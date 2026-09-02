import { computed, ref } from 'vue'

const TOKEN_KEY = 'radar-token'
const ROLE_KEY = 'radar-role'
const USERNAME_KEY = 'radar-username'

export type UserRole = 'admin' | 'user'

function readToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

function readRole(): UserRole | null {
  try {
    const role = localStorage.getItem(ROLE_KEY)
    return role === 'admin' || role === 'user' ? role : null
  } catch {
    return null
  }
}

function readUsername() {
  try { return localStorage.getItem(USERNAME_KEY) } catch { return null }
}

export const authToken = ref<string | null>(readToken())
export const authRole = ref<UserRole | null>(readRole())
export const authUsername = ref<string | null>(readUsername())
export const isAuthenticated = computed(() => Boolean(authToken.value))
export const isAdmin = computed(() => authRole.value === 'admin')

export function setSession(token: string, role: UserRole, username: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
  localStorage.setItem(USERNAME_KEY, username)
  authToken.value = token
  authRole.value = role
  authUsername.value = username
}

/** @deprecated prefer setSession */
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  authToken.value = token
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(USERNAME_KEY)
  authToken.value = null
  authRole.value = null
  authUsername.value = null
}
