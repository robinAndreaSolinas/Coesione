import { ref } from 'vue'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useReportData } from './useReportData'

export function usePdfExport() {
  const isExporting = ref(false)
  const { reportSections } = useReportData()

  function exportFullReport() {
    isExporting.value = true
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      let y = 20

      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('Cohesion Analytics', pageWidth / 2, y, { align: 'center' })
      y += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Report completo - ${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      )
      y += 20

      reportSections.value.forEach((section, idx) => {
        if (y > 250) {
          doc.addPage()
          y = 20
        }

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(70, 95, 255)
        doc.text(section.title, 14, y)
        y += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)

        autoTable(doc, {
          startY: y,
          head: [['Obiettivo', 'Target']],
          body: section.metrics.map((m) => [m.label, m.goal]),
          theme: 'grid',
          headStyles: { fillColor: [70, 95, 255], textColor: 255 },
          margin: { left: 14, right: 14 },
        })
        y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
        y += 5

        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`Obiettivo: ${section.targetLabel} | Progresso: ${section.progress}%`, 14, y)
        y += 15
      })

      doc.save('Cohesion-Analytics-Report.pdf')
    } finally {
      isExporting.value = false
    }
  }

  return { exportFullReport, isExporting }
}
