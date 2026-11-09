// Lecteur : embed youtube-nocookie (via l'API IFrame, pour reprendre la lecture)
// ou une instance Invidious (aucune publicité, mais dépend d'un serveur tiers).
import { useEffect, useRef, useState } from 'react'
import { getSettings, useSettings, updatePosition, saveSettings } from '../lib/storage'
import { Icon } from './Icon'
import { clearNowPlaying, setNowPlaying } from '../lib/background'
import { pauseMusic } from '../lib/music'
import { canUseLocal } from '../lib/nativeFetch'
import { getStreams, type Streams } from '../lib/stream'
import { audioBlobUrl } from '../lib/blobAudio'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytApi: Promise<any> | null = null
export function loadYT() {
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
function DirectPlayer({ id, start, onEnded, onFail, loop, bare, paused, title = '', artist = '' }: { id: string; start: number; onEnded?: () => void; onFail: (why: string) => void; loop?: boolean; bare?: boolean; paused?: boolean; title?: string; artist?: string }) {
  const settings = useSettings()
  const [s, setS] = useState<Streams | null>(null)
  const [src, setSrc] = useState('')
  const [panel, setPanel] = useState(false)
  const [audioSrc, setAudioSrc] = useState('')
  const [stats, setStats] = useState(settings.showStats)
  const mountAt = useRef(performance.now())
  const [marks, setMarks] = useState<Record<string, number>>({})
  const mark = (k: string) => setMarks((m) => (m[k] ? m : { ...m, [k]: Math.round(performance.now() - mountAt.current) }))
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
        if (r.hls && low && !bare) r = { ...r, audio: undefined, qualities: [], video: r.hls }
        mark('flux')
        setS(r)
        if (r.audio) {
          const fmt = r.formats.find((f) => f.url === r.audio)
          if (localStorage.getItem('youfree:audioBlob') === '1' && fmt) audioBlobUrl(fmt.url, fmt.mime).then((u) => ok && setAudioSrc(u), () => ok && setAudioSrc(r.audio!))
          else setAudioSrc(r.audio)
        }
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
      if (document.hidden) return
      if (Math.abs(audio.currentTime - video.currentTime) > 0.25) audio.currentTime = video.currentTime
      // L'image joue mais pas le son (piste arrivée en retard, fin de boucle…) : on relance le son.
      if (!video.paused && audio.paused && audio.readyState >= 2) audio.play().catch(() => {})
    }
    // En arrière-plan, le téléphone suspend l'image : on laisse le son continuer,
    // puis on recale l'image sur le son au retour.
    const onVis = () => {
      if (!document.hidden && !audio.paused) {
        video.currentTime = audio.currentTime
        video.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVis)
    // Notification et contrôles système (sauf Shorts) ; la musique se met en pause.
    const media = () => (document.hidden ? audio : video)
    const announce = () =>
      !bare && setNowPlaying({ title: title || 'Youtmusic', artist, artwork: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }, !media().paused, { toggle: () => (media().paused ? media().play() : media().pause()) })
    const onPlay = () => (pauseMusic(), announce())
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', announce)
    const on: [string, () => void][] = [
      ['play', () => (sync(), audio.play().catch(() => {}))],
      ['pause', () => !document.hidden && audio.pause()],
      ['waiting', () => !document.hidden && audio.pause()],
      ['playing', () => (sync(), audio.play().catch(() => {}))],
      ['seeked', sync],
      ['ratechange', () => (audio.playbackRate = video.playbackRate)],
      ['volumechange', () => ((audio.volume = video.volume), (audio.muted = video.muted))],
    ]
    on.forEach(([e, f]) => video.addEventListener(e, f))
    // Synchro fréquente : le son reprend en moins d'une demi-seconde s'il décroche.
    const fast = setInterval(sync, 400)
    const timer = setInterval(() => {
      if (video.currentTime > 5) updatePosition(id, video.currentTime)
    }, 2000)
    return () => {
      on.forEach(([e, f]) => video.removeEventListener(e, f))
      document.removeEventListener('visibilitychange', onVis)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', announce)
      if (!bare) clearNowPlaying()
      clearInterval(timer)
      clearInterval(fast)
      if (video.currentTime > 5) updatePosition(id, video.currentTime)
    }
  }, [s, src, audioSrc, id, start, bare, title, artist])
  if (!s) return <div className="player loading-player" />
  return (
    <div className="player">
      <video
        ref={v}
        src={src}
        poster={`https://i.ytimg.com/vi/${id}/${bare ? 'oar2' : 'hqdefault'}.jpg`}
        autoPlay={!paused}
        preload="auto"
        playsInline
        controls={!bare}
        onClick={bare ? (e) => (e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause()) : undefined}
        loop={loop || looping}
        style={{ objectFit: bare ? 'cover' : settings.fit }}
        onLoadedMetadata={(e) => ((e.currentTarget.playbackRate = settings.speed), mark('métadonnées'))}
        onPlaying={() => mark('première image')}
        onEnded={() => (updatePosition(id, 0), onEnded?.())}
        onError={() => onFail('lecture refusée par le serveur vidéo')}
      />
      {s.audio && audioSrc && (
        <audio
          ref={a}
          src={audioSrc}
          preload="auto"
          loop={loop}
          onCanPlay={(e) => {
            mark('son')
            // Piste prête après le démarrage de l'image : on la cale et on la lance.
            const vid = v.current
            if (vid && !vid.paused) {
              e.currentTarget.currentTime = vid.currentTime
              e.currentTarget.play().catch(() => {})
            }
          }}
          onError={() => {
            // URL directe refusée : on télécharge la piste par la couche native.
            const fmt = s.formats.find((f) => f.url === s.audio)
            if (!fmt || audioSrc.startsWith('blob:')) return onFail('piste audio refusée')
            localStorage.setItem('youfree:audioBlob', '1')
            audioBlobUrl(fmt.url, fmt.mime).then(setAudioSrc, () => onFail('piste audio refusée'))
          }}
        />
      )}
      {!bare && (
        <button className="player-gear" onClick={() => setPanel(!panel)} aria-label="Réglages de lecture">
          <Icon name="settings" size={20} />
        </button>
      )}
      {stats && (
        <div className="stats" onClick={() => setStats(false)}>
          <strong>Statistiques de lecture</strong>
          <span>client : {s.client}</span>
          {s.timings.map((t) => (
            <span key={t}>{t}</span>
          ))}
          {Object.entries(marks).map(([k, ms]) => (
            <span key={k}>
              {k} : {ms} ms
            </span>
          ))}
          <span>
            source : {src === s.hls ? 'HLS' : `${s.qualities.find((q) => q.url === src)?.height ?? s.height}p`} · {s.formats.find((f) => f.url === src)?.mime.split(';')[0] ?? ''}{' '}
            {s.formats.find((f) => f.url === src)?.mime.match(/codecs="([^".]+)/)?.[1] ?? ''}
          </span>
          <span>{marks['première image'] ? (marks['première image'] > 3000 ? '⚠ démarrage lent : ' + (marks['flux'] > 1500 ? 'récupération des flux (réseau / YouTube)' : 'chargement de la vidéo (débit)') : '✓ démarrage rapide') : '…'}</span>
        </div>
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
            <button className={stats ? 'on' : ''} onClick={() => setStats(!stats)}>
              <Icon name="chart" size={16} /> Statistiques
            </button>
            <button onClick={() => v.current && (v.current.currentTime -= 10)}>−10 s</button>
            <button onClick={() => v.current && (v.current.currentTime += 10)}>+10 s</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Player(props: { id: string; start?: number; onEnded?: () => void; loop?: boolean; bare?: boolean; paused?: boolean; title?: string; artist?: string }) {
  const settings = useSettings()
  const [failed, setFailed] = useState<{ id: string; why: string } | null>(null)
  if (settings.player === 'direct' && canUseLocal() && failed?.id !== props.id)
    return <DirectPlayer id={props.id} start={props.start ?? 0} onEnded={props.onEnded} onFail={(why) => setFailed({ id: props.id, why })} loop={props.loop} bare={props.bare} paused={props.paused} title={props.title} artist={props.artist} />
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
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&autoplay=1&start=${Math.floor(start)}&rel=0&playsinline=1&iv_load_policy=3&cc_load_policy=${getSettings().captions ? 1 : 0}&cc_lang_pref=${getSettings().lang}&origin=${origin}`
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'
    iframe.allowFullscreen = true
    iframe.referrerPolicy = 'strict-origin-when-cross-origin'
    iframe.title = 'Lecteur vidéo'
    mount.replaceWith(iframe)

    loadYT().then((YT) => {
      if (cancelled) return
      player = new YT.Player(iframe, {
        events: {
          onReady: () => !getSettings().captions && player.unloadModule?.('captions'),
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
