// Lecteur : embed youtube-nocookie (via l'API IFrame, pour reprendre la lecture)
// ou une instance Invidious (aucune publicité, mais dépend d'un serveur tiers).
import { useEffect, useRef, useState } from 'react'
import { useSettings, updatePosition, saveSettings } from '../lib/storage'
import { Icon } from './Icon'
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
function DirectPlayer({ id, start, onEnded, onFail, loop, bare, paused }: { id: string; start: number; onEnded?: () => void; onFail: (why: string) => void; loop?: boolean; bare?: boolean; paused?: boolean }) {
  const settings = useSettings()
  const [s, setS] = useState<Streams | null>(null)
  const [src, setSrc] = useState('')
  const [panel, setPanel] = useState(false)
  const [looping, setLooping] = useState(false)
  const [sleep, setSleep] = useState(0)
  useEffect(() => {
    if (!v.current) return
    if (paused) v.current.pause()
    else v.current.play().catch(() => {})
  }, [paused, s])
  // Minuterie de veille : met en pause après N minutes.
  useEffect(() => {
    if (!sleep) return
    const t = setTimeout(() => (v.current?.pause(), setSleep(0)), sleep * 60_000)
    return () => clearTimeout(t)
  }, [sleep])
  const v = useRef<HTMLVideoElement>(null)
  const a = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    let ok = true
    getStreams(id).then(
      (r) => {
        if (!ok) return
        // HLS si les flux directs plafonnent sous 480p (cas du client IOS).
        const low = !r.qualities.length || r.qualities[0].height < 480
        if (r.hls && low) r = { ...r, audio: undefined, qualities: [], video: r.hls }
        setS(r)
        setSrc((r.qualities.find((q) => q.height <= settings.quality) ?? r.qualities[r.qualities.length - 1])?.url ?? r.video)
      },
      (e) => ok && onFail((e as Error).message),
    )
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
      <video
        ref={v}
        src={src}
        autoPlay={!paused}
        preload="auto"
        playsInline
        controls={!bare}
        onClick={bare ? (e) => (e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause()) : undefined}
        loop={loop || looping}
        style={{ objectFit: bare ? 'cover' : settings.fit }}
        onLoadedMetadata={(e) => (e.currentTarget.playbackRate = settings.speed)}
        onEnded={() => (updatePosition(id, 0), onEnded?.())}
        onError={() => onFail('lecture refusée par le serveur vidéo')}
      />
      {s.audio && <audio ref={a} src={s.audio} preload="auto" onError={() => onFail('piste audio refusée')} />}
      {!bare && (
        <button className="player-gear" onClick={() => setPanel(!panel)} aria-label="Réglages de lecture">
          <Icon name="settings" size={20} />
        </button>
      )}
      {panel && (
        <div className="player-panel" onClick={(e) => e.stopPropagation()}>
          <label>
            Vitesse
            <div className="opts">
              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
                <button key={r} className={settings.speed === r ? 'on' : ''} onClick={() => (saveSettings({ speed: r }), v.current && (v.current.playbackRate = r))}>
                  {r}×
                </button>
              ))}
            </div>
          </label>
          {s.qualities.length > 1 && (
            <label>
              Qualité
              <div className="opts">
                {s.qualities.map((q) => (
                  <button key={q.url} className={src === q.url ? 'on' : ''} onClick={() => (setSrc(q.url), saveSettings({ quality: q.height }))}>
                    {q.height}p
                  </button>
                ))}
              </div>
            </label>
          )}
          <label>
            Image
            <div className="opts">
              <button className={settings.fit === 'contain' ? 'on' : ''} onClick={() => saveSettings({ fit: 'contain' })}>Ajuster</button>
              <button className={settings.fit === 'cover' ? 'on' : ''} onClick={() => saveSettings({ fit: 'cover' })}>Remplir</button>
            </div>
          </label>
          <label>
            Minuterie
            <div className="opts">
              {[0, 15, 30, 60].map((m) => (
                <button key={m} className={sleep === m ? 'on' : ''} onClick={() => setSleep(m)}>
                  {m ? `${m} min` : 'Non'}
                </button>
              ))}
            </div>
          </label>
          <div className="opts">
            <button className={looping ? 'on' : ''} onClick={() => setLooping(!looping)}>
              <Icon name="refresh" size={16} /> Boucle
            </button>
            {'pictureInPictureEnabled' in document && (
              <button onClick={() => v.current?.requestPictureInPicture?.().catch(() => {})}>Mini-lecteur</button>
            )}
            <button onClick={() => v.current && (v.current.currentTime -= 10)}>−10 s</button>
            <button onClick={() => v.current && (v.current.currentTime += 10)}>+10 s</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Player(props: { id: string; start?: number; onEnded?: () => void; loop?: boolean; bare?: boolean; paused?: boolean }) {
  const settings = useSettings()
  const [failed, setFailed] = useState<{ id: string; why: string } | null>(null)
  if (settings.player === 'direct' && canUseLocal() && failed?.id !== props.id)
    return <DirectPlayer id={props.id} start={props.start ?? 0} onEnded={props.onEnded} onFail={(why) => setFailed({ id: props.id, why })} loop={props.loop} bare={props.bare} paused={props.paused} />
  if (props.paused) return <div className="player" />
  return (
    <>
      <EmbedPlayer {...props} />
      {failed && <div className="fallback-note">Lecture sans pub impossible ({failed.why}). Lecteur YouTube utilisé.</div>}
    </>
  )
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
