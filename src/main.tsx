import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { THEME_PREFERENCE_STORAGE_KEY } from './shared/lib/storageKeys'

function applyStoredThemeBeforeRender() {
  if (typeof window === 'undefined') return

  const preference = window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY)
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const useDark =
    preference === 'dark' || (preference === 'system' && systemDark)

  document.documentElement.classList.toggle('dark', useDark)
  document.documentElement.style.colorScheme = useDark ? 'dark' : 'light'
}

applyStoredThemeBeforeRender()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
