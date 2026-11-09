// Lecture en arrière-plan : notification Android + boutons, et contrôles système (MediaSession).
import { registerPlugin } from '@capacitor/core'
import { isNative } from './nativeFetch'

interface BgPlugin {
  update(o: { title: string; text: string; playing: boolean }): Promise<void>
  stop(): Promise<void>
  addListener(e: 'action', f: (d: { action: string }) => void): Promise<unknown>
}
const Bg = registerPlugin<BgPlugin>('BackgroundPlayback')

type Handlers = { toggle: () => void; next?: () => void; prev?: () => void }
let handlers: Handlers | null = null
let owner: unknown = null
if (isNative()) Bg.addListener('action', ({ action }) => handlers?.[action as keyof Handlers]?.())

/** Annonce le média en cours (notification + écran verrouillé). */
export function setNowPlaying(meta: { title: string; artist: string; artwork?: string }, playing: boolean, h: Handlers, who: unknown = null) {
  handlers = h
  owner = who
  if (isNative()) Bg.update({ title: meta.title, text: meta.artist, playing }).catch(() => {})
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: meta.title, artist: meta.artist, artwork: meta.artwork ? [{ src: meta.artwork }] : [] })
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
    navigator.mediaSession.setActionHandler('play', h.toggle)
    navigator.mediaSession.setActionHandler('pause', h.toggle)
    navigator.mediaSession.setActionHandler('nexttrack', h.next ?? null)
    navigator.mediaSession.setActionHandler('previoustrack', h.prev ?? null)
  }
}

export const nowPlayingOwner = () => owner

/** N'arrête le service que si c'est ce lecteur qui l'a lancé en dernier. */
export function clearNowPlaying(who: unknown = null) {
  if (who !== null && who !== owner) return
  owner = null
  handlers = null
  if (isNative()) Bg.stop().catch(() => {})
}
