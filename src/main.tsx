import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './lib/log'
import { warmUp } from './lib/youtube'
import { onStorageChange } from './lib/storage'
import './styles.css'

// Cache des pages vidé à chaque ouverture (réglages, historique, abonnements et traductions conservés).
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('youfree:cache:') || k === 'youfree:homeLast')
    .forEach((k) => localStorage.removeItem(k))
  sessionStorage.clear()
} catch {
  /* stockage indisponible */
}
warmUp()
import('./lib/update').then((u) => u.startAutoUpdate())
import('./lib/notify').then((n) => n.startNotifications())
// Sauvegarde Google : synchronise au démarrage puis après chaque changement.
import('./lib/cloud').then((c) => {
  if (c.cloudState().email) c.sync().catch(() => {})
  onStorageChange(c.autoSync)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Geste / bouton retour : ferme la fenêtre ouverte, sinon page précédente, sinon met l'appli en arrière-plan (ne la quitte pas).
import('@capacitor/app').then(({ App: CapApp }) =>
  CapApp.addListener('backButton', () => {
    const sheet = document.querySelector<HTMLElement>('.sheet-back')
    if (sheet) return sheet.click()
    const np = document.querySelector<HTMLElement>('.np-close')
    if (np) return np.click()
    if (location.hash && location.hash !== '#/' && history.length > 1) history.back()
    else CapApp.minimizeApp()
  }),
).catch(() => {})
