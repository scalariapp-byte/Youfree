import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { warmUp } from './lib/youtube'
import './styles.css'

warmUp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
