import { authToken, clearToken } from './auth'

export interface Probe { id: number; code: string; name: string; flag_icon: string; public_ip: string; created_at: string }
export interface Host { id: number; name: string; host: string; http_enabled: boolean; icmp_enabled: boolean; probe_id: number | null; active: boolean; logo_icon: string; created_at: string }
export interface GridCell { latency_ms: number | null; ok: boolean }
export interface GridRow { id: number; name: string; host?: string; flag_icon: string; probe_code: string; cells: Array<GridCell | null> }
export interface GridResponse { interval: string; protocol: string; buckets: string[]; rows: GridRow[] }
export interface HostInput { name: string; host: string; http_enabled: boolean; icmp_enabled: boolean; probe_id: number | null; active: boolean }
export interface HostTestResult { protocol: string; ok: boolean; latency_ms: number | null; error: string }
export interface HostTestResponse { id: number; name: string; host: string; results: HostTestResult[] }
export interface AdminStats {
  db_ok: boolean
  hosts: number
  active_hosts: number
  probes: number
  samples: number
  last_sample_at: string | null
  database_bytes: number
}

export interface AuthResponse {
  token: string
  username: string
  role: 'admin' | 'user'
}

export interface HostPrefs {
  host_ids: number[]
}

export interface HostRequest {
  id: number
  user_id: number
  username: string
  name: string
  host: string
  http_enabled: boolean
  icmp_enabled: boolean
  status: 'pending' | 'approved' | 'rejected'
  reviewer_note: string
  created_at: string
  reviewed_at: string | null
}

export interface HostRequestInput {
  name: string
  host: string
  http_enabled: boolean
  icmp_enabled: boolean
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

function withBase(path: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  if (!base || base === '/') return path
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

async function parseError(response: Response): Promise<never> {
  if (response.status === 401 && authToken.value) clearToken()
  const body = await response.json().catch(() => ({})) as { error?: string }
  throw new ApiError(body.error ?? `Request failed (${response.status})`, response.status)
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (authToken.value) headers.set('Authorization', `Bearer ${authToken.value}`)
  const response = await fetch(withBase(path), { ...init, headers })
  if (!response.ok) await parseError(response)
  return response.json() as Promise<T>
}

export async function apiForm<T>(path: string, form: FormData, method = 'POST'): Promise<T> {
  const headers = new Headers()
  if (authToken.value) headers.set('Authorization', `Bearer ${authToken.value}`)
  const response = await fetch(withBase(path), { method, body: form, headers })
  if (!response.ok) await parseError(response)
  return response.json() as Promise<T>
}

export function assetUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return withBase(path)
}

export function testHost(id: number): Promise<HostTestResponse> {
  return api<HostTestResponse>(`/api/hosts/${id}/test`, { method: 'POST' })
}

export async function deleteHost(id: number): Promise<void> {
  const headers = new Headers()
  if (authToken.value) headers.set('Authorization', `Bearer ${authToken.value}`)
  const response = await fetch(withBase(`/api/hosts/${id}`), { method: 'DELETE', headers })
  if (!response.ok) await parseError(response)
}

export function fetchAdminStats(): Promise<AdminStats> {
  return api<AdminStats>('/api/admin/stats')
}

export function signup(username: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function login(username: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function getHostPrefs(): Promise<HostPrefs> {
  return api<HostPrefs>('/api/me/host-prefs')
}

export function putHostPrefs(hostIds: number[]): Promise<HostPrefs> {
  return api<HostPrefs>('/api/me/host-prefs', {
    method: 'PUT',
    body: JSON.stringify({ host_ids: hostIds }),
  })
}

export function listHostRequests(status?: string): Promise<HostRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return api<HostRequest[]>(`/api/host-requests${query}`)
}

export function createHostRequest(input: HostRequestInput): Promise<HostRequest> {
  return api<HostRequest>('/api/host-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function approveHostRequest(id: number, reviewerNote = ''): Promise<{ id: number; status: string; endpoint_id: number }> {
  return api(`/api/host-requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ reviewer_note: reviewerNote }),
  })
}

export function rejectHostRequest(id: number, reviewerNote = ''): Promise<{ id: number; status: string }> {
  return api(`/api/host-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reviewer_note: reviewerNote }),
  })
}
