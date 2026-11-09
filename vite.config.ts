import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : l'app fonctionne sur GitHub Pages ou n'importe quel sous-dossier.
export default defineConfig({
  base: './',
  plugins: [react()],
})
