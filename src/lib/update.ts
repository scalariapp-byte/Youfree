// Vérification des mises à jour : automatique (si activée) ou manuelle depuis les paramètres.
import { useSyncExternalStore } from 'react'
import { localFetch, isNative } from './nativeFetch'
import { getSettings } from './storage'

export const BUILD = Number(import.meta.env.VITE_BUILD ?? 0)
const API = 'https://api.github.com/repos/scalariapp-byte/Youfree/releases/tags/android-latest'
export const APK = 'https://github.com/scalariapp-byte/Youfree/releases/download/android-latest/youfree.apk'

let state = { latest: 0, notes: '', checking: false, checkedAt: 0, error: '' }
const subs = new Set<() => void>()
const set = (p: Partial<typeof state>) => ((state = { ...state, ...p }), subs.forEach((f) => f()))
export const useUpdate = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => state)

export async function checkUpdate() {
  if (!isNative()) return set({ error: 'Disponible dans l’application Android' })
  set({ checking: true, error: '' })
  try {
    const txt = await (await localFetch(`${API}?t=${Date.now()}`, { headers: { Accept: 'application/vnd.github+json' } })).text()
    const body = String(JSON.parse(txt).body ?? '')
    const latest = Number(body.match(/build\s+(\d+)/i)?.[1] ?? 0)
    const notes = (body.split('\n').find((l) => l.startsWith('Nouveautés')) ?? '').replace(/^Nouveautés\s*:\s*/, '')
    set({ latest, notes, checkedAt: Date.now() })
  } catch {
    set({ error: 'Vérification impossible (réseau)' })
  } finally {
    set({ checking: false })
  }
}

export function startAutoUpdate() {
  const auto = () => getSettings().autoUpdate && checkUpdate()
  auto()
  document.addEventListener('visibilitychange', () => !document.hidden && auto())
  setInterval(auto, 30 * 60_000)
}
