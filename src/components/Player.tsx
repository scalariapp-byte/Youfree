// Lecteur : embed youtube-nocookie (via l'API IFrame, pour reprendre la lecture)
// ou une instance Invidious (aucune publicité, mais dépend d'un serveur tiers).
import { useEffect, useRef } from 'react'
import { useSettings, updatePosition } from '../lib/storage'

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

export function Player({ id, start = 0, onEnded }: { id: string; start?: number; onEnded?: () => void }) {
  const settings = useSettings()
  const host = useRef<HTMLDivElement>(null)
  const endedRef = useRef(onEnded)
  endedRef.current = onEnded

  useEffect(() => {
    if (settings.player !== 'nocookie' || !host.current) return
    let player: any
    let timer: number
    let cancelled = false
    const mount = document.createElement('div')
    host.current.replaceChildren(mount)

    loadYT().then((YT) => {
      if (cancelled) return
      player = new YT.Player(mount, {
        host: 'https://www.youtube-nocookie.com',
        videoId: id,
        playerVars: { autoplay: 1, start: Math.floor(start), rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3 },
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
