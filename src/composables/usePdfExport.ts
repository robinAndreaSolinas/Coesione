import { ref } from 'vue'
import { useReportData } from './useReportData'
import { useMetrics } from './useMetrics'
import { useObjectives } from './useObjectives'

export function usePdfExport() {
  const isExporting = ref(false)
  const { reportSections } = useReportData()
  const { loadMetrics } = useMetrics()
  const { loadObjectives } = useObjectives()

  async function exportFullReport() {
    isExporting.value = true
    try {
      // Forza refresh dei dati prima dell'export, così il PDF usa valori reali aggiornati.
      await Promise.all([loadMetrics(), loadObjectives()])

      const token = localStorage.getItem('coesione-token')
      const response = await fetch('/api/v1/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          generatedAt: new Date().toISOString(),
          sections: reportSections.value,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition') || ''
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      const filename = filenameMatch?.[1] || 'report.pdf'
      const blobUrl = URL.createObjectURL(blob)

      // Apre il PDF in una nuova tab per visualizzazione immediata.
      window.open(blobUrl, '_blank', 'noopener,noreferrer')

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
    } finally {
      isExporting.value = false
    }
  }

  return { exportFullReport, isExporting }
}
