// Lecteur : embed youtube-nocookie (via l'API IFrame, pour reprendre la lecture)
// ou une instance Invidious (aucune publicité, mais dépend d'un serveur tiers).
import { useEffect, useRef, useState } from 'react'
import { useSettings, updatePosition } from '../lib/storage'
import { canUseLocal } from '../lib/nativeFetch'
import { getStreams, type Streams } from '../lib/stream'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytApi: Promise<any> | null = null
function loadYT() {
  if (!ytApi) {
    ytApi = new Promise((resolve) => {
      if (window.YT?.Player) return resolve(window.YT)
      window.onYouTubeIframeAPIReady = () => resolve(window.YT)
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    })
  }
  return ytApi
}

/** Lecteur natif sans pub : vidéo et audio séparés, synchronisés. */
function DirectPlayer({ id, start, onEnded, onFail, loop }: { id: string; start: number; onEnded?: () => void; onFail: () => void; loop?: boolean }) {
  const [s, setS] = useState<Streams | null>(null)
  const [src, setSrc] = useState('')
  const v = useRef<HTMLVideoElement>(null)
  const a = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    let ok = true
    getStreams(id).then((r) => ok && (setS(r), setSrc(r.video)), () => ok && onFail())
    return () => {
      ok = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  useEffect(() => {
    const video = v.current
    const audio = a.current
    if (!video || !s) return
    const t0 = video.currentTime || start
    video.currentTime = t0
    if (!audio) return
    const sync = () => {
      if (Math.abs(audio.currentTime - video.currentTime) > 0.25) audio.currentTime = video.currentTime
    }
    const on: [string, () => void][] = [
      ['play', () => (sync(), audio.play().catch(() => {}))],
      ['pause', () => audio.pause()],
      ['waiting', () => audio.pause()],
      ['playing', () => (sync(), audio.play().catch(() => {}))],
      ['seeked', sync],
      ['ratechange', () => (audio.playbackRate = video.playbackRate)],
      ['volumechange', () => ((audio.volume = video.volume), (audio.muted = video.muted))],
    ]
    on.forEach(([e, f]) => video.addEventListener(e, f))
    const timer = setInterval(() => {
      sync()
      if (video.currentTime > 5) updatePosition(id, video.currentTime)
    }, 2000)
    return () => {
      on.forEach(([e, f]) => video.removeEventListener(e, f))
      clearInterval(timer)
      if (video.currentTime > 5) updatePosition(id, video.currentTime)
    }
  }, [s, src, id, start])
  if (!s) return <div className="player loading-player" />
  return (
    <div className="player">
      <video ref={v} src={src} autoPlay playsInline controls loop={loop} onEnded={() => (updatePosition(id, 0), onEnded?.())} onError={onFail} />
      {s.audio && <audio ref={a} src={s.audio} preload="auto" onError={onFail} />}
      {s.qualities.length > 1 && (
        <select className="quality" value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Qualité">
          {s.qualities.map((q) => (
            <option key={q.url} value={q.url}>
              {q.height}p
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

export function Player(props: { id: string; start?: number; onEnded?: () => void; loop?: boolean }) {
  const settings = useSettings()
  const [failed, setFailed] = useState<string | null>(null)
  if (settings.player === 'direct' && canUseLocal() && failed !== props.id)
    return <DirectPlayer id={props.id} start={props.start ?? 0} onEnded={props.onEnded} onFail={() => setFailed(props.id)} loop={props.loop} />
  return <EmbedPlayer {...props} />
}

function EmbedPlayer({ id, start = 0, onEnded }: { id: string; start?: number; onEnded?: () => void }) {
  const settings = useSettings()
  const host = useRef<HTMLDivElement>(null)
  const endedRef = useRef(onEnded)
  endedRef.current = onEnded

  useEffect(() => {
    if (settings.player === 'invidious' || !host.current) return
    let player: any
    let timer: number
    let cancelled = false
    const mount = document.createElement('div')
    host.current.replaceChildren(mount)

    // On crée l'iframe nous-mêmes pour fixer la politique de Referer : sans Referer,
    // YouTube refuse la lecture (erreur 153), ce qui arrive dans certaines WebViews.
    const iframe = document.createElement('iframe')
    const origin = encodeURIComponent(location.origin)
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&autoplay=1&start=${Math.floor(start)}&rel=0&playsinline=1&iv_load_policy=3&origin=${origin}`
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'
    iframe.allowFullscreen = true
    iframe.referrerPolicy = 'strict-origin-when-cross-origin'
    iframe.title = 'Lecteur vidéo'
    mount.replaceWith(iframe)

    loadYT().then((YT) => {
      if (cancelled) return
      player = new YT.Player(iframe, {
        events: {
          onStateChange: (e: any) => {
            if (e.data === YT.PlayerState.ENDED) {
              updatePosition(id, 0)
              endedRef.current?.()
            }
          },
        },
      })
      timer = window.setInterval(() => {
        const t = player?.getCurrentTime?.()
        if (typeof t === 'number' && t > 5) updatePosition(id, t)
      }, 5000)
    })
    return () => {
      cancelled = true
      clearInterval(timer)
      try {
        const t = player?.getCurrentTime?.()
        if (typeof t === 'number' && t > 5) updatePosition(id, t)
        player?.destroy?.()
      } catch {
        /* ignore */
      }
    }
    // start n'est lu qu'au montage d'une vidéo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, settings.player])

  if (settings.player === 'invidious') {
    const base = settings.invidiousInstance.replace(/\/+$/, '')
    return (
      <div className="player">
        <iframe
          src={`${base}/embed/${id}?autoplay=1&t=${Math.floor(start)}`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          title="Lecteur vidéo"
        />
      </div>
    )
  }
  return <div className="player" ref={host} />
}
