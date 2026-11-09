import { getSettings } from './storage'

// Priorité : valeur saisie dans Réglages > variable d'environnement au build.
export const apiKey = () => getSettings().apiKey.trim() || (import.meta.env.VITE_YT_API_KEY ?? '').trim()
export const clientId = () => getSettings().clientId.trim() || (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
