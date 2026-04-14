import fs from 'node:fs'
import path from 'node:path'
import type { Request, Response } from 'express'
import { Router } from 'express'
import PDFDocument from 'pdfkit'
type PdfDoc = InstanceType<typeof PDFDocument>

interface ReportMetricPayload {
  label: string
  goal: string
  obtained: string
  progress: number
}

interface ReportSectionPayload {
  title: string
  categoryProgress: number
  metrics: ReportMetricPayload[]
}

interface ReportPayload {
  generatedAt?: string
  sections?: ReportSectionPayload[]
}

const router = Router()
const PAGE_MARGIN = 28
const CARD_GAP = 10
const SECTION_CARD_RADIUS = 10
const METRIC_CARD_RADIUS = 8
const COLORS = {
  pageBg: '#f8fafc',
  headerBg: '#0f172a',
  headerText: '#f8fafc',
  headerMuted: '#94a3b8',
  sectionTitle: '#1d4ed8',
  cardBorder: '#e2e8f0',
  cardBg: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  track: '#e2e8f0',
}

function ensureReportPath(
  baseDir: string,
  dayFolder: string,
  reportFileName: string
): { dir: string; filePath: string } {
  const dir = path.join(baseDir, dayFolder)
  fs.mkdirSync(dir, { recursive: true })
  return { dir, filePath: path.join(dir, reportFileName) }
}

function progressColor(progress: number): string {
  if (progress >= 80) return COLORS.success
  if (progress >= 50) return COLORS.warning
  return COLORS.danger
}

function drawBackground(doc: PdfDoc) {
  const pageWidth = doc.page.width
  const pageHeight = doc.page.height
  doc.save()
  doc.rect(0, 0, pageWidth, pageHeight).fill(COLORS.pageBg)
  doc.restore()
}

function drawHeader(doc: PdfDoc, generatedLabel: string) {
  const pageWidth = doc.page.width
  const headerHeight = 72
  doc.save()
  doc.roundedRect(PAGE_MARGIN, PAGE_MARGIN, pageWidth - PAGE_MARGIN * 2, headerHeight, 12).fill(COLORS.headerBg)
  doc.restore()

  doc.fillColor(COLORS.headerText).fontSize(18).font('Helvetica-Bold')
  doc.text('Cohesion Analytics', PAGE_MARGIN + 16, PAGE_MARGIN + 18)
  doc.fillColor(COLORS.headerMuted).fontSize(10).font('Helvetica')
  doc.text(`Report obiettivi e dati ottenuti · ${generatedLabel}`, PAGE_MARGIN + 16, PAGE_MARGIN + 44)
}

function ensureSpace(
  doc: PdfDoc,
  currentY: number,
  requiredHeight: number,
  generatedLabel: string
): number {
  const maxY = doc.page.height - PAGE_MARGIN
  if (currentY + requiredHeight <= maxY) return currentY

  doc.addPage()
  drawBackground(doc)
  drawHeader(doc, generatedLabel)
  return PAGE_MARGIN + 72 + CARD_GAP
}

function drawProgressBar(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number
) {
  const bounded = Math.max(0, Math.min(100, progress))
  doc.save()
  doc.roundedRect(x, y, width, height, height / 2).fill(COLORS.track)
  doc.roundedRect(x, y, (width * bounded) / 100, height, height / 2).fill(progressColor(bounded))
  doc.restore()
}

function drawPageTitle(doc: PdfDoc, title: string, subtitle: string, startY: number): number {
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(14).text(title, PAGE_MARGIN, startY)
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10).text(subtitle, PAGE_MARGIN, startY + 18)
  return startY + 36
}

function drawMetricCard(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  metric: ReportMetricPayload
): void {
  const height = 68
  doc.save()
  doc.roundedRect(x, y, width, height, METRIC_CARD_RADIUS).fill(COLORS.cardBg).stroke(COLORS.cardBorder)
  doc.restore()

  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(10).text(metric.label, x + 10, y + 10, {
    width: width - 20,
    ellipsis: true,
  })
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(`Valore: ${metric.obtained}`, x + 10, y + 28)
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(`Target: ${metric.goal}`, x + 10, y + 42)
  drawProgressBar(doc, x + 90, y + 52, width - 120, 8, metric.progress)
  doc.fillColor(progressColor(metric.progress)).font('Helvetica-Bold').fontSize(9)
  doc.text(`${Math.round(metric.progress)}%`, x + width - 26, y + 50, { width: 20, align: 'right' })
}

function drawMetricsGrid(
  doc: PdfDoc,
  title: string,
  subtitle: string,
  metrics: ReportMetricPayload[],
  generatedLabel: string,
  cols = 2
): void {
  const pageWidth = doc.page.width
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  const gap = 8
  const cardWidth = (contentWidth - gap * (cols - 1)) / cols
  const cardHeight = 68

  let y = PAGE_MARGIN + 72 + CARD_GAP
  y = drawPageTitle(doc, title, subtitle, y)

  for (let i = 0; i < metrics.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    let cardY = y + row * (cardHeight + gap)

    const needsBreak = cardY + cardHeight > doc.page.height - PAGE_MARGIN
    if (needsBreak) {
      doc.addPage()
      drawBackground(doc)
      drawHeader(doc, generatedLabel)
      y = PAGE_MARGIN + 72 + CARD_GAP
      y = drawPageTitle(doc, title, subtitle, y)
      cardY = y
      const offset = i % cols
      const cardX = PAGE_MARGIN + offset * (cardWidth + gap)
      drawMetricCard(doc, cardX, cardY, cardWidth, metrics[i])
      continue
    }

    const cardX = PAGE_MARGIN + col * (cardWidth + gap)
    drawMetricCard(doc, cardX, cardY, cardWidth, metrics[i])
  }
}

router.post('/pdf', (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as ReportPayload
    const sections = Array.isArray(body.sections) ? body.sections : []
    const generatedAt = body.generatedAt ? new Date(body.generatedAt) : new Date()
    const dayFolder = Number.isNaN(generatedAt.getTime())
      ? new Date().toISOString().slice(0, 10)
      : generatedAt.toISOString().slice(0, 10)
    const fileDate = dayFolder.replace(/-/g, '')
    const reportFileName = `${fileDate}-report.pdf`

    const defaultReportsDir = process.cwd().endsWith(`${path.sep}server`)
      ? path.resolve(process.cwd(), '..', 'reports')
      : path.join(process.cwd(), 'reports')
    const reportsBaseDir = process.env.REPORTS_DIR || defaultReportsDir
    const { filePath } = ensureReportPath(reportsBaseDir, dayFolder, reportFileName)

    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN })
    const writeStream = fs.createWriteStream(filePath)
    doc.pipe(writeStream)

    const generatedLabel = generatedAt.toLocaleDateString('it-IT')
    const pageWidth = doc.page.width
    const contentWidth = pageWidth - PAGE_MARGIN * 2
    drawBackground(doc)
    drawHeader(doc, generatedLabel)
    let y = PAGE_MARGIN + 72 + CARD_GAP

    if (sections.length === 0) {
      y = ensureSpace(doc, y, 80, generatedLabel)
      doc.save()
      doc.roundedRect(PAGE_MARGIN, y, contentWidth, 70, SECTION_CARD_RADIUS).fill(COLORS.cardBg).stroke(COLORS.cardBorder)
      doc.restore()
      doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(12).text('Nessun obiettivo configurato', PAGE_MARGIN + 16, y + 20)
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10).text('Configura almeno un obiettivo per generare il report.', PAGE_MARGIN + 16, y + 40)
    } else {
      const totalMetrics = sections.flatMap((section) => section.metrics)
      drawMetricsGrid(
        doc,
        'Totale',
        'Tutte le metriche dashboard (valore / target / progresso)',
        totalMetrics,
        generatedLabel,
        3
      )

      for (const section of sections) {
        doc.addPage()
        drawBackground(doc)
        drawHeader(doc, generatedLabel)
        drawMetricsGrid(
          doc,
          section.title,
          `Metriche della sezione ${section.title}`,
          section.metrics,
          generatedLabel
        )
      }
    }

    doc.end()

    writeStream.on('finish', () => {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${reportFileName}"`)
      res.download(filePath)
    })

    writeStream.on('error', (error) => {
      res.status(500).json({ error: error.message || 'Errore durante il salvataggio del PDF' })
    })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Errore' })
  }
})

export default router
