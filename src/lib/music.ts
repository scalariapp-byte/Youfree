// Lecteur musique : file d'attente globale, audio seul (économe en données et en batterie).
import { useSyncExternalStore } from 'react'
import type { Track } from './innertube'
import { getStreams } from './stream'
import { getSettings } from './storage'
import { clearNowPlaying, setNowPlaying } from './background'

const audio = new Audio()
audio.preload = 'auto'
document.body.appendChild(audio)
/* eslint-disable @typescript-eslint/no-explicit-any */
// Secours : lecteur YouTube intégré invisible (fonctionne quand les flux directs sont refusés).
let yt: any = null
let ytTimer: number | undefined
let mode: 'audio' | 'embed' = 'audio'
export let lastMusicError = ''
let queue: Track[] = []
let index = -1
let state = { track: null as Track | null, playing: false, loading: false, time: 0, duration: 0, error: '' }
const subs = new Set<() => void>()
const emit = (p: Partial<typeof state>) => ((state = { ...state, ...p }), subs.forEach((f) => f()))

const announce = () => state.track && setNowPlaying({ title: state.track.title, artist: state.track.artist, artwork: state.track.thumbnail }, state.playing, { toggle, next, prev })
audio.addEventListener('playing', () => (emit({ playing: true }), announce()))
audio.addEventListener('pause', () => (emit({ playing: false }), announce()))
audio.addEventListener('timeupdate', () => emit({ time: audio.currentTime, duration: audio.duration || 0 }))
audio.addEventListener('ended', () => next())

async function load(i: number) {
  if (i < 0 || i >= queue.length) return
  index = i
  const t = queue[i]
  emit({ track: t, loading: true, time: 0, error: '' })
  try {
    const s = await getStreams(t.id)
    if (queue[index]?.id !== t.id) return
    // Plusieurs pistes audio candidates : si l'une est refusée, on passe à la suivante.
    const low = getSettings().audioQuality === 'low'
    const cands = s.formats
      .filter((f) => f.audio && !f.video)
      .sort((x, y) => (/mp4/.test(y.mime) ? 1 : 0) - (/mp4/.test(x.mime) ? 1 : 0) || (low ? x.bitrate - y.bitrate : y.bitrate - x.bitrate))
      .map((f) => f.url)
    cands.push(...s.formats.filter((f) => f.audio && f.video).map((f) => f.url))
    let ok = false
    for (const url of cands) {
      if (await tryPlay(url)) {
        ok = true
        break
      }
    }
    if (!ok) throw new Error(cands.length ? `${cands.length} pistes audio refusées (${audio.error?.message || 'code ' + (audio.error?.code ?? '?')})` : 'aucune piste audio')
    // Complète la file avec les titres suggérés par YouTube Music.
    if (i >= queue.length - 2) {
      const more = await (await import('./innertube')).musicUpNext(t.id).catch(() => [])
      const seen = new Set(queue.map((x) => x.id))
      queue = [...queue, ...more.filter((x) => !seen.has(x.id))]
    }
    mode = 'audio'
  } catch (e) {
    lastMusicError = (e as Error).message
    // Bascule sur le lecteur intégré invisible plutôt que de rester muet.
    try {
      await playEmbed(t.id)
    } catch (e2) {
      emit({ error: `Lecture impossible : ${lastMusicError} / ${(e2 as Error).message}` })
    }
  } finally {
    emit({ loading: false })
  }
}

async function playEmbed(id: string) {
  audio.pause()
  mode = 'embed'
  const { loadYT } = await import('../components/Player')
  const YT = await loadYT()
  if (!yt) {
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;width:1px;height:1px;left:-10px;bottom:0;opacity:0;pointer-events:none'
    const div = document.createElement('div')
    host.appendChild(div)
    document.body.appendChild(host)
    await new Promise<void>((res) => {
      yt = new YT.Player(div, {
        host: 'https://www.youtube-nocookie.com',
        width: 1,
        height: 1,
        videoId: id,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1, origin: location.origin },
        events: {
          onReady: () => res(),
          onStateChange: (e: any) => {
            if (e.data === YT.PlayerState.ENDED) next()
            if (e.data === YT.PlayerState.PLAYING) (emit({ playing: true, error: '' }), announce())
            if (e.data === YT.PlayerState.PAUSED) (emit({ playing: false }), announce())
          },
          onError: (e: any) => emit({ error: `Lecture impossible (lecteur intégré, code ${e.data})` }),
        },
      })
    })
  }
  yt.loadVideoById(id)
  yt.playVideo()
  clearInterval(ytTimer)
  ytTimer = window.setInterval(() => mode === 'embed' && yt?.getCurrentTime && emit({ time: yt.getCurrentTime(), duration: yt.getDuration() || 0 }), 500)
}

function tryPlay(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const done = (v: boolean) => (audio.removeEventListener('playing', yes), audio.removeEventListener('error', no), clearTimeout(t), resolve(v))
    const yes = () => done(true)
    const no = () => done(false)
    const t = setTimeout(() => done(!audio.paused && audio.currentTime > 0), 10000)
    audio.addEventListener('playing', yes)
    audio.addEventListener('error', no)
    audio.src = url
    audio.play().catch(() => {})
  })
}

export const playTracks = (list: Track[], start = 0) => ((queue = list.slice()), load(start))
export const next = () => load(index + 1)
export const prev = () => (state.time > 3 ? seek(0) : load(index - 1))
export const getQueue = () => ({ queue, index })
export const playAt = (i: number) => load(i)
const embedPlaying = () => yt?.getPlayerState?.() === 1
export const pauseMusic = () => (mode === 'embed' ? yt?.pauseVideo() : audio.pause())
export const toggle = () => (mode === 'embed' ? (embedPlaying() ? yt.pauseVideo() : yt.playVideo()) : audio.paused ? audio.play() : audio.pause())
export const seek = (t: number) => (mode === 'embed' ? yt?.seekTo(t, true) : (audio.currentTime = t))
export const stopMusic = () => (audio.pause(), yt?.stopVideo?.(), audio.removeAttribute('src'), emit({ track: null, playing: false }), clearNowPlaying())
export const useMusic = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
  )
