// Lecteur : embed youtube-nocookie (via l'API IFrame, pour reprendre la lecture)
// ou une instance Invidious (aucune publicité, mais dépend d'un serveur tiers).
import { useEffect, useRef, useState } from 'react'
import { getSettings, useSettings, updatePosition, saveSettings } from '../lib/storage'
import { Icon } from './Icon'
import { clearNowPlaying, nowPlayingOwner, setNowPlaying } from '../lib/background'
import { pauseMusic } from '../lib/music'
import { canUseLocal } from '../lib/nativeFetch'
import { getStreams, getStreamsOther, type Streams } from '../lib/stream'
import { audioBlobUrl, streamAudioUrl } from '../lib/blobAudio'
import { log } from '../lib/log'
import { netCap } from '../lib/net'

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
function DirectPlayer({ id, start, onEnded, onFail: giveUp, loop, bare, paused, title = '', artist = '' }: { id: string; start: number; onEnded?: () => void; onFail: (why: string) => void; loop?: boolean; bare?: boolean; paused?: boolean; title?: string; artist?: string }) {
  const settings = useSettings()
  const [s, setS] = useState<Streams | null>(null)
  const rescue = useRef(0)
  /** Avant d'abandonner : 1) format image+son tout-en-un, 2) autre client YouTube, 3) repli. */
  const onFail = (why: string) => {
    const cur = s
    if (cur && rescue.current === 0) {
      rescue.current = 1
      const prog = cur.formats.filter((f) => f.audio && f.video).sort((a, b) => b.height - a.height)[0]
      if (prog) {
        log(bare ? 'short' : 'vidéo', `${id} ${why} → format tout-en-un ${prog.height}p`)
        setAudioSrc('')
        setS({ ...cur, audio: undefined, qualities: [{ height: prog.height, url: prog.url }], video: prog.url })
        setSrc(prog.url)
        return
      }
    }
    if (cur && rescue.current <= 1) {
      rescue.current = 2
      log(bare ? 'short' : 'vidéo', `${id} ${why} → essai d'un autre client que ${cur.client}`)
      getStreamsOther(id, cur.client).then(
        (r) => {
          triedA.current = []
          triedQ.current = []
          readyFor.current = ''
          setS(r)
          setSrc((r.qualities.find((q) => q.height <= 1080) ?? r.qualities[r.qualities.length - 1])?.url ?? r.video)
          const fmt = r.formats.find((f) => f.url === r.audio)
          if (fmt) audioBlobUrl(fmt.url, fmt.mime).then(setAudioSrc, () => setAudioSrc(r.audio!))
          else setAudioSrc('')
        },
        () => giveUp(why),
      )
      return
    }
    giveUp(why)
  }
  const [src, setSrc] = useState('')
  const [panel, setPanel] = useState(false)
  const [audioSrc, setAudioSrc] = useState('')
  const readyFor = useRef('')
  const triedQ = useRef<string[]>([])
  const triedA = useRef<string[]>([])
  const pos = useRef(0)
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
        log(bare ? 'short' : 'vidéo', `${id} flux ok client=${r.client} qualités=${r.qualities.map((q) => q.height).join(',') || 'hls'} audio=${r.audio ? 'séparé' : 'aucun'} mode=${localStorage.getItem('youfree:audioBlob') === '1' ? 'blob' : 'direct'}`)
        setS(r)
        if (r.audio) {
          const fmt = r.formats.find((f) => f.url === r.audio)
          if (localStorage.getItem('youfree:audioBlob') === '1' && fmt) {
            // Son progressif : démarre dès le premier morceau ; sinon piste entière en mémoire.
            const live = streamAudioUrl(fmt.url, fmt.mime, () => ok && audioBlobUrl(fmt.url, fmt.mime).then(setAudioSrc, () => setAudioSrc(r.audio!)))
            if (live) setAudioSrc(live)
            else audioBlobUrl(fmt.url, fmt.mime).then((u) => ok && setAudioSrc(u), () => ok && setAudioSrc(r.audio!))
          } else setAudioSrc(r.audio)
        }
        // Shorts : 1080p max (écran de téléphone) ; vidéos : qualité préférée.
        // Qualité de départ limitée par la connexion (mauvais réseau : 144p-480p).
        const cap = Math.min(bare ? Math.min(settings.quality, 1080) : settings.quality, netCap())
        setSrc((r.qualities.find((q) => q.height <= cap) ?? r.qualities[r.qualities.length - 1])?.url ?? r.video)
      },
      (e) => (log('vidéo', `${id} flux KO : ${(e as Error).message}`), ok && onFail((e as Error).message)),
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
    // Changement de qualité : on reprend là où on en était.
    const t0 = pos.current || video.currentTime || start
    video.currentTime = t0
    if (!audio) return () => void (!document.hidden && video.pause())
    const sync = () => {
      if (document.hidden) return
      // Recalage seulement si l'écart est net et qu'aucun recalage n'est en cours.
      if (!audio.seeking && Math.abs(audio.currentTime - video.currentTime) > 0.4) audio.currentTime = video.currentTime
      // L'image joue mais pas le son (piste arrivée en retard, fin de boucle…) : on relance le son.
      if (!video.paused && audio.paused && audio.readyState >= 2) audio.play().catch(() => {})
    }
    // En arrière-plan, le téléphone suspend l'image : on laisse le son continuer,
    // puis on recale l'image sur le son au retour.
    const onVis = () => {
      // Shorts : pause quand on quitte l'appli (sauf si la lecture en arrière-plan est activée).
      if (document.hidden && bare && !getSettings().shortsBackground) {
        video.pause()
        audio.pause()
        return
      }
      if (!document.hidden && bare && !getSettings().shortsBackground && !paused) {
        video.play().catch(() => {})
        return
      }
      if (!document.hidden && !audio.paused) {
        video.currentTime = audio.currentTime
        video.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVis)
    // Notification et contrôles système (sauf Shorts) ; la musique se met en pause.
    const media = () => (document.hidden ? audio : video)
    const announce = () =>
      (!bare || getSettings().shortsBackground) &&
      setNowPlaying({ title: title || (bare ? 'Short' : 'Youtmusic'), artist, artwork: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }, !media().paused, { toggle: () => (media().paused ? media().play() : media().pause()) }, video)
    const onPlay = () => (pauseMusic(), announce())
    video.addEventListener('play', onPlay)
    // Une pause ne met à jour la notification que si ce lecteur en est le propriétaire.
    const onPause = () => nowPlayingOwner() === video && announce()
    video.addEventListener('pause', onPause)
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
    const fast = setInterval(() => (sync(), video.currentTime > 0 && (pos.current = video.currentTime)), 400)
    // Image bloquée plus de 2,5 s : on passe à la qualité inférieure.
    let stallTimer: number | undefined
    const onWaiting = () => {
      clearTimeout(stallTimer)
      stallTimer = window.setTimeout(() => {
        const cur = s.qualities.findIndex((q) => q.url === video.currentSrc || q.url === src)
        const lower = s.qualities[cur + 1]
        if (lower && video.readyState < 3) {
          log(bare ? 'short' : 'vidéo', `${id} blocage, passage en ${lower.height}p`)
          setSrc(lower.url)
        }
      }, 2500)
    }
    const onFlow = () => clearTimeout(stallTimer)
    const onEnd = () => loop && ((video.currentTime = 0), video.play().catch(() => {}))
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onFlow)
    video.addEventListener('ended', onEnd)
    let saved = 0
    const timer = setInterval(() => {
      // Position enregistrée toutes les ~15 s seulement (moins d'écritures, synchro Google possible).
      if (video.currentTime > 5 && Math.abs(video.currentTime - saved) >= 15) updatePosition(id, (saved = video.currentTime))
    }, 2000)
    return () => {
      on.forEach(([e, f]) => video.removeEventListener(e, f))
      document.removeEventListener('visibilitychange', onVis)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      clearNowPlaying(video)
      clearInterval(timer)
      clearInterval(fast)
      // Lecteur retiré de la page (autre onglet, Short suivant) : on coupe tout, sinon le son continue.
      if (!document.hidden) (video.pause(), audio.pause())
      clearTimeout(stallTimer)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onFlow)
      video.removeEventListener('ended', onEnd)
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
        onPlaying={() => (mark('première image'), log(bare ? 'short' : 'vidéo', `${id} image ok, son ${a.current ? (a.current.paused ? 'EN PAUSE' : 'joue') : 'absent'}`))}
        onEnded={() => (updatePosition(id, 0), onEnded?.())}
        onError={() => {
          // Qualité refusée par le serveur : on tente les autres avant de se replier.
          const curH = s.qualities.find((q) => q.url === src)?.height ?? Infinity
          const untried = s.qualities.filter((q) => q.url !== src && !triedQ.current.includes(q.url))
          // D'abord la qualité juste en dessous, puis les autres.
          const rest = [...untried.filter((q) => q.height < curH), ...untried.filter((q) => q.height >= curH).reverse()]
          if (rest.length && triedQ.current.length < 3) {
            triedQ.current.push(src)
            log(bare ? 'short' : 'vidéo', `${id} qualité refusée, essai ${rest[0].height}p`)
            setSrc(rest[0].url)
          } else onFail('lecture refusée par le serveur vidéo')
        }}
      />
      {s.audio && audioSrc && (
        <audio
          ref={a}
          src={audioSrc}
          preload="auto"
          loop={loop}
          onCanPlay={(e) => {
            // Une seule fois par piste : recaler le son relance « canplay » (boucle infinie sinon).
            if (readyFor.current === audioSrc) return
            readyFor.current = audioSrc
            mark('son')
            log(bare ? 'short' : 'vidéo', `${id} son prêt (${audioSrc.startsWith('blob:') ? 'mémoire' : 'direct'}) en ${Math.round(performance.now() - mountAt.current)} ms`)
            const vid = v.current
            if (vid && !vid.paused) {
              if (Math.abs(e.currentTarget.currentTime - vid.currentTime) > 0.5) e.currentTarget.currentTime = vid.currentTime
              e.currentTarget.play().catch(() => {})
            }
          }}
          onError={() => {
            // URL directe refusée : on télécharge la piste par la couche native.
            const fmt = s.formats.find((f) => f.url === s.audio)
            log(bare ? 'short' : 'vidéo', `${id} son refusé (${audioSrc.startsWith('blob:') ? 'blob' : 'direct'}) code=${a.current?.error?.code} ${fmt?.mime ?? ''}`)
            if (!fmt) return onFail('piste audio refusée')
            localStorage.setItem('youfree:audioBlob', '1')
            // Essaie les autres pistes audio (téléchargées par le téléphone) avant le repli.
            const others = s.formats.filter((f) => f.audio && !f.video && !triedA.current.includes(f.url)).sort((x, y) => Math.abs(x.bitrate - 130000) - Math.abs(y.bitrate - 130000))
            const next = audioSrc.startsWith('blob:') ? others.find((f) => f.url !== fmt.url) : fmt
            if (!next || triedA.current.length >= 3) return onFail('piste audio refusée')
            triedA.current.push(next.url)
            const viaBlob = () => audioBlobUrl(next.url, next.mime).then(setAudioSrc, (er) => (log('vidéo', `${id} blob KO : ${er.message}`), onFail('piste audio refusée')))
            const live = !audioSrc.startsWith('blob:') ? streamAudioUrl(next.url, next.mime, () => void viaBlob()) : null
            if (live) setAudioSrc(live)
            else viaBlob()
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
            <button onClick={() => import('../lib/report').then((r) => r.sendReport())}>
              <Icon name="share" size={16} /> Rapport
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
  useEffect(() => void (failed && log('vidéo', `${failed.id} repli lecteur YouTube : ${failed.why}`)), [failed])
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
