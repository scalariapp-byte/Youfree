// Sauvegarde des données Youtmusic (abonnements, historique, j'aime, playlists, réglages) dans
// un fichier visible « Youtmusic - sauvegarde.json » du Google Drive de l'utilisateur.
// Aucun accès au compte YouTube.
import { SocialLogin } from '@capgo/capacitor-social-login'
import { localFetch } from './nativeFetch'
import { exportAll, getSettings, mergeAll } from './storage'

// drive.file : fichier visible « Youtmusic - sauvegarde.json » dans le Drive ; l'appli ne voit que ses propres fichiers.
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const FILE = 'Youtmusic - sauvegarde.json'
const META = 'youfree:cloud'

export interface CloudState {
  email?: string
  name?: string
  picture?: string
  lastSync?: number
}
export const cloudState = (): CloudState => {
  try {
    return JSON.parse(localStorage.getItem(META) || '{}')
  } catch {
    return {}
  }
}
const setState = (s: CloudState) => localStorage.setItem(META, JSON.stringify(s))

export const webClientId = () => getSettings().googleClientId.trim() || (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ?? '')

let token: string | null = null
let initialized = false

async function login(): Promise<string> {
  if (!webClientId()) throw new Error('ID client Google non configuré (Réglages → Sauvegarde Google).')
  if (!initialized) {
    await SocialLogin.initialize({ google: { webClientId: webClientId() } })
    initialized = true
  }
  const res: any = await SocialLogin.login({ provider: 'google', options: { scopes: [SCOPE] } })
  const r = res.result
  token = r?.accessToken?.token ?? null
  if (!token) throw new Error('Google n’a pas accordé l’accès au stockage.')
  setState({ ...cloudState(), email: r.profile?.email ?? '', name: r.profile?.name ?? '', picture: r.profile?.imageUrl ?? '' })
  return token
}

async function drive(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const t = token ?? (await login())
  const res = await localFetch(`https://www.googleapis.com/${path}`, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${t}` } })
  if (res.status === 401 && retry) {
    token = null
    return drive(path, init, false)
  }
  if (!res.ok) throw new Error(`Google Drive : erreur ${res.status}`)
  return res
}

async function findFile(): Promise<string | null> {
  const r = await drive(`drive/v3/files?fields=files(id)&q=${encodeURIComponent(`name='${FILE}' and trashed=false`)}`)
  return (await r.json()).files?.[0]?.id ?? null
}

/** Fusionne les données distantes et locales, puis enregistre le résultat des deux côtés. */
export async function sync(): Promise<CloudState> {
  const id = await findFile()
  if (id) mergeAll(await (await drive(`drive/v3/files/${id}?alt=media`)).text())
  const body = exportAll()
  if (id) {
    await drive(`upload/drive/v3/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
  } else {
    const boundary = 'youfree' + Date.now()
    const multipart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({ name: FILE, mimeType: 'application/json' })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`
    await drive('upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart })
  }
  const s = { ...cloudState(), lastSync: Date.now() }
  setState(s)
  return s
}

export async function connect() {
  await login()
  return sync()
}

export async function disconnect() {
  token = null
  try {
    await SocialLogin.logout({ provider: 'google' })
  } catch {
    /* ignore */
  }
  localStorage.removeItem(META)
}

/** Synchronisation automatique (au démarrage et après des changements), si connecté. */
let timer: number | undefined
export function autoSync() {
  if (!cloudState().email) return
  clearTimeout(timer)
  timer = window.setTimeout(() => sync().catch(() => {}), 20_000)
}
