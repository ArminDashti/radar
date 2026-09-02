import { ref } from 'vue'

export type Theme = 'dark' | 'light' | 'system'
const THEME_KEY = 'radar-theme'
const themes: Theme[] = ['dark', 'light', 'system']
const media = window.matchMedia('(prefers-color-scheme: dark)')

function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  return themes.includes(stored as Theme) ? stored as Theme : 'dark'
}

export const theme = ref<Theme>(readTheme())
function applyTheme() {
  const dark = theme.value === 'dark' || (theme.value === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function setTheme(value: Theme) {
  theme.value = value
  localStorage.setItem(THEME_KEY, value)
  applyTheme()
}

export function cycleTheme() {
  setTheme(themes[(themes.indexOf(theme.value) + 1) % themes.length] ?? 'dark')
}

export function initializeTheme() {
  applyTheme()
  media.addEventListener('change', () => { if (theme.value === 'system') applyTheme() })
}
