// Notifications de nouvelles vidéos pour les chaînes choisies (vérifiées tant que l'appli tourne).
import { LocalNotifications } from '@capacitor/local-notifications'
import { getLocalSubs, getSettings } from './storage'
import { isNative } from './nativeFetch'

const LAST = 'youfree:lastSeen'
const last = (): Record<string, string> => JSON.parse(localStorage.getItem(LAST) || '{}')

export async function askPermission() {
  if (!isNative()) return false
  const p = await LocalNotifications.requestPermissions()
  return p.display === 'granted'
}

export async function checkNew() {
  const ids = getSettings().notifyChannels
  if (!isNative() || !ids.length) return
  const seen = last()
  const local = await import('./innertube')
  for (const c of getLocalSubs().filter((s) => ids.includes(s.id))) {
    try {
      const v = (await local.playlistVideos('UU' + c.id.slice(2))).videos[0]
      if (!v) continue
      if (seen[c.id] && seen[c.id] !== v.id)
        await LocalNotifications.schedule({
          notifications: [{ id: Math.floor(Math.random() * 1e9), title: c.title, body: v.title, extra: { id: v.id } }],
        })
      seen[c.id] = v.id
    } catch {
      /* chaîne indisponible */
    }
  }
  localStorage.setItem(LAST, JSON.stringify(seen))
}

export function startNotifications() {
  if (!isNative()) return
  LocalNotifications.addListener('localNotificationActionPerformed', (a) => (location.hash = `#/watch/${a.notification.extra?.id}`))
  setTimeout(checkNew, 8000)
  setInterval(checkNew, 30 * 60_000)
}
