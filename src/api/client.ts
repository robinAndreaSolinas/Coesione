const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('coesione-token')
}

export function decodeToken(): { role?: string } | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { role: payload.role }
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data as T
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: ApiUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<ApiUser>('/auth/me'),
    updateMe: (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) =>
      request<ApiUser>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
    logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  },
  users: {
    list: () => request<ApiUser[]>('/users'),
    create: (data: { name: string; email: string; password: string; role?: string }) =>
      request<ApiUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ApiUser & { password?: string }>) =>
      request<ApiUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  },
  apiKeys: {
    list: () => request<ApiKeyEntry[]>('/api-keys'),
    create: (data: { name: string; type: ApiKeyType; key: string | Record<string, unknown> }) =>
      request<ApiKeyEntry>('/api-keys', { method: 'POST', body: JSON.stringify(data), cache: 'no-store' }),
    update: (hash: string, data: { name?: string; source?: string; type?: ApiKeyType; key?: string | Record<string, unknown> }) =>
      request<ApiKeyEntry>(`/api-keys/${hash}`, { method: 'PUT', body: JSON.stringify(data), cache: 'no-store' }),
    delete: (hash: string) => request<void>(`/api-keys/${hash}`, { method: 'DELETE' }),
  },
  objectives: {
    list: () => request<ApiObjective[]>('/objectives'),
    update: (id: string, data: { value: number; unit: string }) =>
      request<ApiObjective>(`/objectives/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  pages: {
    getVisibility: () => request<Record<string, PageVisibility>>('/pages/visibility'),
    getPageVisibility: (pageKey: string) =>
      request<PageVisibility>(`/pages/visibility/${pageKey}`),
    setVisibility: (pageKey: string, data: PageVisibility) =>
      request<PageVisibility>(`/pages/visibility/${pageKey}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
}

export interface ApiUser {
  id: string
  name: string
  email: string
  active: boolean
  role: string
}

export type ApiKeyType = 'jwt' | 'api_key' | 'secret_client' | 'token_json'

export interface ApiKeyEntry {
  hash: string
  name: string
  source: string
  type: ApiKeyType
  createdAt: number
}

export interface ApiObjective {
  id: string
  title: string
  category: string
  path: string
  value: number
  unit: string
}

export interface PageVisibility {
  isPublic: boolean
  isVisibleForUsers: boolean
}
