import { useI18n } from 'vue-i18n'

export function useObjectiveTitle() {
  const { t, te } = useI18n()

  function titleFor(id: string, fallback?: string): string {
    const key = `objectives.${id}`
    if (te(key)) return t(key)
    return fallback ?? id
  }

  return { titleFor }
}
