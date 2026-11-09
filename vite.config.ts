import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : l'app fonctionne sur GitHub Pages, dans un sous-dossier ou dans l'app Android.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    // Développement uniquement : relaie /__yt/<chemin> vers YouTube pour tester
    // le mode sans clé sur ordinateur (dans l'app Android, le téléphone fait la requête lui-même).
    proxy: {
      '/__yt': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__yt/, ''),
        headers: { origin: 'https://www.youtube.com', referer: 'https://www.youtube.com/' },
      },
    },
  },
})
