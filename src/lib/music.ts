// Lecteur musique : file d'attente globale, audio seul (économe en données et en batterie).
import { useSyncExternalStore } from 'react'
import type { Track } from './innertube'
import { getStreams } from './stream'

const audio = new Audio()
let queue: Track[] = []
let index = -1
let state = { track: null as Track | null, playing: false, loading: false, time: 0, duration: 0 }
const subs = new Set<() => void>()
const emit = (p: Partial<typeof state>) => ((state = { ...state, ...p }), subs.forEach((f) => f()))

audio.addEventListener('play', () => emit({ playing: true }))
audio.addEventListener('pause', () => emit({ playing: false }))
audio.addEventListener('timeupdate', () => emit({ time: audio.currentTime, duration: audio.duration || 0 }))
audio.addEventListener('ended', () => next())

async function load(i: number) {
  if (i < 0 || i >= queue.length) return
  index = i
  const t = queue[i]
  emit({ track: t, loading: true, time: 0 })
  try {
    const s = await getStreams(t.id)
    const a = s.formats.filter((f) => f.audio && !f.video).sort((x, y) => y.bitrate - x.bitrate)[0]
    audio.src = a?.url ?? s.video
    await audio.play()
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, artwork: [{ src: t.thumbnail }] })
      navigator.mediaSession.setActionHandler('nexttrack', next)
      navigator.mediaSession.setActionHandler('previoustrack', prev)
    }
    // Complète la file avec les titres suggérés par YouTube Music.
    if (i >= queue.length - 2) {
      const more = await (await import('./innertube')).musicUpNext(t.id).catch(() => [])
      const seen = new Set(queue.map((x) => x.id))
      queue = [...queue, ...more.filter((x) => !seen.has(x.id))]
    }
  } finally {
    emit({ loading: false })
  }
}

export const playTracks = (list: Track[], start = 0) => ((queue = list.slice()), load(start))
export const next = () => load(index + 1)
export const prev = () => (audio.currentTime > 3 ? (audio.currentTime = 0) : load(index - 1))
export const toggle = () => (audio.paused ? audio.play() : audio.pause())
export const seek = (t: number) => (audio.currentTime = t)
export const stopMusic = () => (audio.pause(), audio.removeAttribute('src'), emit({ track: null, playing: false }))
export const useMusic = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
  )
