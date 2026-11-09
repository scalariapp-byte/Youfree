// Lecteur Shorts vertical : on fait défiler d'un Short à l'autre, seul le Short
// visible charge un lecteur (économie de données et de batterie).
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorBox } from '../components/ErrorBox'
import { Icon } from '../components/Icon'
import { decode, compact } from '../lib/format'
import { toggleWatchLater, useSettings, useWatchLater } from '../lib/storage'
import { getShorts, getVideos, type Video } from '../lib/youtube'
import { toStored } from '../components/VideoCard'
import { THEMES } from '../components/Themes'
import { Player } from '../components/Player'
import { getStreams } from '../lib/stream'
import { canUseLocal } from '../lib/nativeFetch'

function ShortSlide({ v, active }: { v: Video; active: boolean }) {
  const settings = useSettings()
  const later = useWatchLater()
  const saved = later.some((x) => x.id === v.id)
  const src =
    settings.player === 'invidious'
      ? `${settings.invidiousInstance.replace(/\/+$/, '')}/embed/${v.id}?autoplay=1&loop=1`
      : `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&loop=1&playlist=${v.id}&playsinline=1&rel=0&iv_load_policy=3&origin=${encodeURIComponent(location.origin)}`
  return (
    <div className="short-slide" data-id={v.id}>
      <div className="short-frame">
        {active && settings.player === 'direct' && canUseLocal() ? (
          <Player id={v.id} loop />
        ) : active ? (
          <iframe src={src} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" title={v.title} />
        ) : (
          <img src={v.thumbnail} alt="" loading="lazy" onError={(e) => (e.currentTarget.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`)} />
        )}
      </div>
      <div className="short-overlay">
        <div className="short-text">
          {v.channelTitle && (
            <Link to={`/channel/${v.channelId}`} className="short-channel">
              @{v.channelTitle}
            </Link>
          )}
          <p>{decode(v.title)}</p>
          {v.views > 0 && <small>{compact(v.views)} vues</small>}
        </div>
        <div className="short-actions">
          <button className={saved ? 'on' : ''} onClick={() => toggleWatchLater(toStored(v))} aria-label="Plus tard">
            <Icon name={saved ? 'check' : 'clock'} size={26} />
            <span>Plus tard</span>
          </button>
          <button onClick={() => navigator.clipboard?.writeText(`https://youtube.com/shorts/${v.id}`)} aria-label="Copier le lien">
            <Icon name="link" size={26} />
            <span>Lien</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function Shorts() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { state } = useLocation() as { state?: { list?: Video[] } }
  const startId = params.get('v')
  const [cat, setCat] = useState<string | undefined>()
  const [items, setItems] = useState<Video[]>([])
  const [next, setNext] = useState<string | undefined>()
  const [error, setError] = useState<Error | null>(null)
  const [active, setActive] = useState<string | null>(startId)
  const loading = useRef(false)
  const feed = useRef<HTMLDivElement>(null)

  // Chargement initial : la liste transmise (étagère), sinon le Short demandé, puis un fil de Shorts.
  useEffect(() => {
    let alive = true
    setError(null)
    ;(async () => {
      try {
        let first: Video[] = []
        if (state?.list?.length && startId) {
          const i = state.list.findIndex((x) => x.id === startId)
          first = i >= 0 ? [...state.list.slice(i), ...state.list.slice(0, i)] : state.list
        } else if (startId && !cat) {
          first = await getVideos([startId]).catch(() => [])
          if (!first.length) first = [{ id: startId, title: '', description: '', channelId: '', channelTitle: '', publishedAt: '', thumbnail: `https://i.ytimg.com/vi/${startId}/hqdefault.jpg`, durationSec: 0, views: 0, likes: 0, categoryId: '', live: false, isShort: true }]
        }
        const r = await getShorts(cat)
        if (!alive) return
        const seen = new Set(first.map((x) => x.id))
        const list = [...first, ...r.videos.filter((x) => !seen.has(x.id))]
        setItems(list)
        setNext(r.next)
        setActive(list[0]?.id ?? null)
        feed.current?.scrollTo({ top: 0 })
      } catch (e) {
        if (alive) setError(e as Error)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat])

  const loadMore = useCallback(async () => {
    if (!next || loading.current) return
    loading.current = true
    try {
      const r = await getShorts(cat, next)
      setItems((old) => {
        const seen = new Set(old.map((x) => x.id))
        return [...old, ...r.videos.filter((x) => !seen.has(x.id))]
      })
      setNext(r.next)
    } finally {
      loading.current = false
    }
  }, [next, cat])

  // Le Short visible à plus de 60 % devient actif.
  useEffect(() => {
    const root = feed.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive((e.target as HTMLElement).dataset.id ?? null)),
      { root, threshold: 0.6 },
    )
    root.querySelectorAll('.short-slide').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [items])

  useEffect(() => {
    const i = items.findIndex((x) => x.id === active)
    if (i >= items.length - 4) loadMore()
    // Précharge les flux des deux Shorts suivants : le défilement est instantané.
    if (canUseLocal()) items.slice(i + 1, i + 3).forEach((x) => getStreams(x.id).catch(() => {}))
  }, [active, items, loadMore])

  return (
    <div className="shorts-page">
      <div className="shorts-top">
        <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label="Retour">
          <Icon name="back" />
        </button>
        <div className="chips">
          {THEMES.map(([label, key]) => (key === 'all' ? [label, undefined] : [label, key]) as [string, string | undefined]).map(([label, id]) => (
            <button key={label} className={`chip ${cat === id ? 'on' : ''}`} onClick={() => setCat(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <div className="page">
          <ErrorBox error={error} />
        </div>
      ) : (
        <div className="shorts-feed" ref={feed}>
          {items.length === 0 && <div className="short-slide loading">Chargement…</div>}
          {items.map((v) => (
            <ShortSlide key={v.id} v={v} active={v.id === active} />
          ))}
        </div>
      )}
    </div>
  )
}
