import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.youfree',
  appName: 'Youfree',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    // Les requêtes du mode sans clé passent par la couche HTTP native (pas de CORS).
    CapacitorHttp: { enabled: false },
  },
}

export default config
