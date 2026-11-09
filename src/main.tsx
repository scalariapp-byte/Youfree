import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { warmUp } from './lib/youtube'
import { onStorageChange } from './lib/storage'
import './styles.css'

warmUp()
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
