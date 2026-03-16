export const DATA_API_BASE_URL =
  process.env.DATA_API_BASE_URL ?? 'http://127.0.0.1:8000'

export function getDefaultStartDate(): string {
  return '2025-08-01'
}

export function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0]
}

