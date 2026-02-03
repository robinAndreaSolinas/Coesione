import { ref } from 'vue'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useReportData } from './useReportData'

const BRAND = [59, 130, 246] as [number, number, number]
const MUTED = [100, 116, 139] as [number, number, number]
const SUCCESS = [34, 197, 94] as [number, number, number]
const WARNING = [234, 179, 8] as [number, number, number]
const DANGER = [239, 68, 68] as [number, number, number]
const LIGHT = [248, 250, 252] as [number, number, number]
const BORDER = [226, 232, 240] as [number, number, number]

export function usePdfExport() {
  const isExporting = ref(false)
  const { reportSections } = useReportData()

  function progressColor(pct: number): [number, number, number] {
    if (pct >= 80) return SUCCESS
    if (pct >= 50) return WARNING
    return DANGER
  }

  const margin = 20

  function addFooter(doc: jsPDF, pageNum: number) {
    const h = doc.internal.pageSize.getHeight()
    const w = doc.internal.pageSize.getWidth()
    doc.setDrawColor(...BORDER)
    doc.line(margin, h - 18, w - margin, h - 18)
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`Cohesion Analytics · Report obiettivi · Pagina ${pageNum} di ${doc.getNumberOfPages()}`, w / 2, h - 10, { align: 'center' })
  }

  function drawBar(doc: jsPDF, x: number, y: number, w: number, h: number, pct: number) {
    doc.setFillColor(...LIGHT)
    doc.rect(x, y, w, h, 'F')
    if (pct > 0) {
      doc.setFillColor(...progressColor(pct))
      doc.rect(x, y, (w * Math.min(100, pct)) / 100, h, 'F')
    }
  }

  function exportFullReport() {
    isExporting.value = true
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const w = doc.internal.pageSize.getWidth()
      const h = doc.internal.pageSize.getHeight()
      let y = 0
      let pageNum = 1

      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, w, 48, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Cohesion Analytics', margin, 22)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      const dateStr = new Date().toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      doc.text(`Report obiettivi e dati ottenuti · ${dateStr}`, margin, 32)
      y = 58

      const totalProgress =
        reportSections.value.length > 0
          ? Math.round(
              reportSections.value.reduce((a, s) => a + s.categoryProgress, 0) /
                reportSections.value.length
            )
          : 0

      if (reportSections.value.length === 0) {
        doc.setFontSize(11)
        doc.setTextColor(...MUTED)
        doc.text('Nessun obiettivo configurato.', w / 2, 80, { align: 'center' })
      } else {
        doc.setFillColor(...LIGHT)
        doc.setDrawColor(...BORDER)
        doc.rect(margin, y, w - margin * 2, 32, 'FD')
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('Riepilogo complessivo', margin + 10, y + 12)
        doc.setFontSize(22)
        doc.setTextColor(...BRAND)
        doc.text(`${totalProgress}%`, margin + 10, y + 26)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...MUTED)
        doc.text('Progresso medio su tutti gli obiettivi', w - margin - 10, y + 20, { align: 'right' })
        drawBar(doc, margin + 10, y + 28, w - margin * 2 - 20, 4, totalProgress)
        y += 42

        reportSections.value.forEach((section) => {
          if (y > h - 70) {
            doc.addPage()
            pageNum++
            y = 24
          }

          doc.setFillColor(...LIGHT)
          doc.setDrawColor(...BORDER)
          doc.rect(margin, y, w - margin * 2, 14, 'FD')
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...BRAND)
          doc.text(section.title, margin + 10, y + 9)
          doc.setFontSize(10)
          doc.setTextColor(...progressColor(section.categoryProgress))
          doc.text(`${section.categoryProgress}%`, w - margin - 10, y + 9, { align: 'right' })
          y += 20

          autoTable(doc, {
            startY: y,
            head: [['Obiettivo', 'Target', 'Dati ottenuti', 'Progresso']],
            body: section.metrics.map((m) => [
              m.label,
              m.goal,
              m.obtained,
              m.progress + '%',
            ]),
            theme: 'plain',
            headStyles: {
              fillColor: [15, 23, 42],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
            },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: margin, right: margin },
            tableLineColor: BORDER,
            tableLineWidth: 0.2,
          })
          const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
          y = finalY + 8

          drawBar(doc, margin, y, w - margin * 2, 6, section.categoryProgress)
          y += 16
        })
      }

      for (let i = 1; i <= doc.getNumberOfPages(); i++) {
        doc.setPage(i)
        addFooter(doc, i)
      }

      doc.save(`Cohesion-Analytics-${dateStr.replace(/\s/g, '-')}.pdf`)
    } finally {
      isExporting.value = false
    }
  }

  return { exportFullReport, isExporting }
}
