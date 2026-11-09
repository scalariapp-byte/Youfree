// Persistance locale (navigateur). Tout reste sur l'appareil de l'utilisateur.
import { useSyncExternalStore } from 'react'

export interface Settings {
  region: string
  showShorts: boolean
  speed: number
  quality: number
  fit: 'contain' | 'cover'
  googleClientId: string
  lang: string
  interests: string[]
  onboarded: boolean
  theme: 'dark' | 'light' | 'system'
  accent: string
  density: 'comfort' | 'compact'
  sections: { continue: boolean; shorts: boolean; subs: boolean; popular: boolean }
  autoNext: boolean
  textScale: number
  animations: boolean
  radius: 'round' | 'square'
  homeOrder: string[]
  startTab: string
  tabLabels: boolean
  showStats: boolean
  audioQuality: 'high' | 'low'
  tabs: string[]
  notifyChannels: string[]
  captions: boolean
  shortsBackground: boolean
  autoUpdate: boolean
  strictLang: boolean
  shareApps: string[]
  translateTitles: boolean
  shortsButtons: { like: boolean; details: boolean; download: boolean; more: boolean }
  shortsSide: 'right' | 'left'
  background: 'halo' | 'plain' | 'gradient' | 'aurora' | 'sunset'
  player: 'direct' | 'nocookie' | 'invidious'
  invidiousInstance: string
}

export interface StoredVideo {
  id: string
  title: string
  channelId: string
  channelTitle: string
  thumbnail: string
  durationSec: number
}

export interface HistoryEntry extends StoredVideo {
  watchedAt: number
  position: number
}

export interface LocalChannel {
  id: string
  title: string
  thumbnail: string
}

const DEFAULT_SETTINGS: Settings = {
  region: 'FR',
  showShorts: true,
  speed: 1,
  quality: 720,
  fit: 'contain',
  googleClientId: '',
  lang: 'fr',
  interests: [],
  onboarded: false,
  theme: 'dark',
  accent: '#19c3ae',
  density: 'comfort',
  sections: { continue: true, shorts: true, subs: true, popular: true },
  autoNext: false,
  textScale: 100,
  animations: true,
  radius: 'round',
  homeOrder: ['continue', 'shorts', 'subs', 'popular'],
  startTab: '/',
  tabLabels: true,
  showStats: false,
  audioQuality: 'high',
  tabs: ['/', '/shorts', '/music', '/subscriptions', '/library'],
  notifyChannels: [],
  captions: false,
  shortsBackground: false,
  autoUpdate: true,
  strictLang: true,
  shareApps: [],
  translateTitles: true,
  shortsButtons: { like: true, details: true, download: true, more: true },
  shortsSide: 'right',
  background: 'halo',
  player: 'direct',
  invidiousInstance: 'https://yewtu.be',
}

const listeners = new Set<() => void>()
const cache = new Map<string, unknown>()

function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T
  let value = fallback
  try {
    const raw = localStorage.getItem('youfree:' + key)
    if (raw) value = JSON.parse(raw) as T
  } catch {
    /* stockage indisponible : on garde la valeur par défaut */
  }
  cache.set(key, value)
  return value
}

function write<T>(key: string, value: T) {
  cache.set(key, value)
  try {
    localStorage.setItem('youfree:' + key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

window.addEventListener('storage', (e) => {
  if (e.key?.startsWith('youfree:')) {
    cache.delete(e.key.slice(8))
    listeners.forEach((l) => l())
  }
})

// ---- Réglages
export const getSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>('settings', {}) })
let settingsSnapshot = getSettings()
subscribe(() => (settingsSnapshot = getSettings()))
export const saveSettings = (patch: Partial<Settings>) => write('settings', { ...getSettings(), ...patch })
export const useSettings = () => useSyncExternalStore(subscribe, () => settingsSnapshot)

// ---- Historique
const HISTORY_MAX = 300
export const getHistory = () => read<HistoryEntry[]>('history', [])
export const useHistory = () => useSyncExternalStore(subscribe, getHistory)
export function recordWatch(v: StoredVideo, position = 0) {
  const prev = getHistory().find((h) => h.id === v.id)
  const entry: HistoryEntry = { ...v, watchedAt: Date.now(), position: position || prev?.position || 0 }
  write('history', [entry, ...getHistory().filter((h) => h.id !== v.id)].slice(0, HISTORY_MAX))
}
export function updatePosition(id: string, position: number) {
  const list = getHistory()
  const i = list.findIndex((h) => h.id === id)
  if (i < 0) return
  const next = list.slice()
  next[i] = { ...next[i], position }
  write('history', next)
}
export const removeFromHistory = (id: string) => write('history', getHistory().filter((h) => h.id !== id))
export const clearHistory = () => write('history', [])

// ---- À regarder plus tard
export const getWatchLater = () => read<StoredVideo[]>('watchLater', [])
export const useWatchLater = () => useSyncExternalStore(subscribe, getWatchLater)
export function toggleWatchLater(v: StoredVideo) {
  const list = getWatchLater()
  write('watchLater', list.some((x) => x.id === v.id) ? list.filter((x) => x.id !== v.id) : [v, ...list])
}

// ---- Abonnements locaux (fonctionnent sans compte)
export const getLocalSubs = () => read<LocalChannel[]>('subs', [])
export const useLocalSubs = () => useSyncExternalStore(subscribe, getLocalSubs)
export function toggleLocalSub(c: LocalChannel) {
  const list = getLocalSubs()
  write('subs', list.some((x) => x.id === c.id) ? list.filter((x) => x.id !== c.id) : [...list, c])
}
export function importLocalSubs(channels: LocalChannel[]) {
  const map = new Map(getLocalSubs().map((c) => [c.id, c]))
  channels.forEach((c) => map.set(c.id, c))
  write('subs', [...map.values()])
}

// ---- J'aime (local, synchronisé avec la sauvegarde Google)
export const getLiked = () => read<StoredVideo[]>('liked', [])
export const useLiked = () => useSyncExternalStore(subscribe, getLiked)
export function toggleLike(v: StoredVideo) {
  const l = getLiked()
  write('liked', l.some((x) => x.id === v.id) ? l.filter((x) => x.id !== v.id) : [v, ...l])
}

// ---- Playlists musique
export interface PlaylistTrack {
  id: string
  title: string
  artist: string
  thumbnail: string
}
export interface LocalPlaylist {
  id: string
  name: string
  tracks: PlaylistTrack[]
}
export const getPlaylists = () => read<LocalPlaylist[]>('playlists', [])
export const usePlaylists = () => useSyncExternalStore(subscribe, getPlaylists)
export const createPlaylist = (name: string) => {
  const p = { id: Date.now().toString(36), name, tracks: [] }
  write('playlists', [...getPlaylists(), p])
  return p
}
export const deletePlaylist = (id: string) => write('playlists', getPlaylists().filter((p) => p.id !== id))
export function toggleInPlaylist(pid: string, t: PlaylistTrack) {
  write(
    'playlists',
    getPlaylists().map((p) => (p.id !== pid ? p : { ...p, tracks: p.tracks.some((x) => x.id === t.id) ? p.tracks.filter((x) => x.id !== t.id) : [...p.tracks, t] })),
  )
}

// ---- Chaînes masquées
export const getBlocked = () => read<LocalChannel[]>('blocked', [])
export const useBlocked = () => useSyncExternalStore(subscribe, getBlocked)
export function toggleBlock(c: LocalChannel) {
  const l = getBlocked()
  write('blocked', l.some((x) => x.id === c.id || (!!c.title && x.title === c.title)) ? l.filter((x) => x.id !== c.id && x.title !== c.title) : [...l, c])
}

// ---- Export / import complet
export function exportAll() {
  return JSON.stringify(
    { version: 1, settings: getSettings(), history: getHistory(), watchLater: getWatchLater(), subs: getLocalSubs(), liked: getLiked(), blocked: getBlocked(), playlists: getPlaylists() },
    null,
    2,
  )
}
/** Fusion sans perte (synchronisation) : historique le plus récent, listes réunies. */
export function mergeAll(json: string) {
  const d = JSON.parse(json)
  const hist = new Map(getHistory().map((h) => [h.id, h]))
  ;(d.history ?? []).forEach((h: HistoryEntry) => {
    const cur = hist.get(h.id)
    if (!cur || h.watchedAt > cur.watchedAt) hist.set(h.id, h)
  })
  write('history', [...hist.values()].sort((a, b) => b.watchedAt - a.watchedAt).slice(0, HISTORY_MAX))
  const later = new Map(getWatchLater().map((v) => [v.id, v]))
  ;(d.watchLater ?? []).forEach((v: StoredVideo) => later.has(v.id) || later.set(v.id, v))
  write('watchLater', [...later.values()])
  if (d.subs) importLocalSubs(d.subs)
  if (d.liked) write('liked', [...new Map([...d.liked, ...getLiked()].map((v: StoredVideo) => [v.id, v])).values()])
  if (d.playlists) write('playlists', [...new Map([...d.playlists, ...getPlaylists()].map((p: LocalPlaylist) => [p.id, p])).values()])
  if (d.blocked) write('blocked', [...new Map([...d.blocked, ...getBlocked()].map((c: LocalChannel) => [c.id, c])).values()])
  if (d.settings) {
    const { googleClientId: _g, ...rest } = d.settings
    write('settings', { ...rest, ...read<Partial<Settings>>('settings', {}), onboarded: true })
  }
}

export function importAll(json: string) {
  const data = JSON.parse(json)
  if (data.history) write('history', data.history)
  if (data.watchLater) write('watchLater', data.watchLater)
  if (data.subs) importLocalSubs(data.subs)
}

export const onStorageChange = subscribe
