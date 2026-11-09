// Partage : feuille Youtmusic avec uniquement les applis choisies, + « Autres… » (menu Android).
import { registerPlugin } from '@capacitor/core'
import { useSyncExternalStore } from 'react'
import { isNative } from './nativeFetch'

export interface ShareApp {
  pkg: string
  label: string
  icon: string
}
interface TargetsPlugin {
  list(): Promise<{ apps: ShareApp[] }>
  share(o: { pkg: string; text: string }): Promise<void>
}
export const Targets = registerPlugin<TargetsPlugin>('ShareTargets')

let req: { url: string; title: string } | null = null
const subs = new Set<() => void>()
const set = (v: typeof req) => ((req = v), subs.forEach((f) => f()))
export const useShareRequest = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => req)
export const closeShare = () => set(null)

export function shareVideo(id: string, title: string, short = false) {
  set({ url: short ? `https://youtube.com/shorts/${id}` : `https://youtu.be/${id}`, title })
}

let appsCache: Promise<ShareApp[]> | null = null
export const listApps = () => (appsCache ??= isNative() ? Targets.list().then((r) => r.apps.sort((a, b) => a.label.localeCompare(b.label))) : Promise.resolve([]))

/** Menu de partage complet d'Android. */
export async function systemShare(url: string, title: string) {
  try {
    if (isNative()) {
      const { Share } = await import('@capacitor/share')
      // Lien : partagé tel quel ; texte long (rapport) : envoyé comme texte.
      await Share.share(url.startsWith('http') ? { title, text: title, url, dialogTitle: 'Partager avec…' } : { title, text: url, dialogTitle: 'Envoyer avec…' })
    } else if (navigator.share) await navigator.share({ title, url })
    else await navigator.clipboard?.writeText(url)
  } catch {
    /* annulé */
  }
}
