// Lecteur Shorts vertical : on fait défiler d'un Short à l'autre, seul le Short
// visible charge un lecteur (économie de données et de batterie).
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorBox } from '../components/ErrorBox'
import { Icon } from '../components/Icon'
import { decode, compact, ago } from '../lib/format'
import { Comments } from '../components/Comments'
import { toggleLike, useLiked, useBlocked, useSettings } from '../lib/storage'
import { applyFilters, getComments, getShorts, getVideos, search, type Video } from '../lib/youtube'
import { useAsync } from '../lib/useAsync'
import { onlyLang } from '../lib/i18n'
import { isSlow } from '../lib/net'
import { Sheet } from '../components/Sheet'
import { VideoMenu, DownloadSheet } from '../components/VideoActions'
import { toStored, Tr } from '../components/VideoCard'
import { Player } from '../components/Player'
import { getStreams } from '../lib/stream'
import { canUseLocal } from '../lib/nativeFetch'

function ShortSlide({ v, active, near }: { v: Video; active: boolean; near: boolean }) {
  const liked = useLiked().some((x) => x.id === v.id)
  const { shortsButtons: sb, shortsSide } = useSettings()
  const [sheet, setSheet] = useState<'' | 'info' | 'menu' | 'dl'>('')
  const info = useAsync(() => (sheet === 'info' ? Promise.all([getVideos([v.id]).then((r) => r[0]), getComments(v.id)]) : Promise.resolve(undefined)), [sheet, v.id])
  const st = toStored(v)
  return (
    <div className="short-slide" data-id={v.id}>
      <div className="short-frame">
        {active || near ? (
          <Player id={v.id} loop bare paused={!active} />
        ) : (
          <img src={v.thumbnail} alt="" loading="lazy" onError={(e) => (e.currentTarget.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`)} />
        )}
      </div>
      <div className={`short-overlay ${shortsSide === 'left' ? 'left' : ''}`}>
        <div className="short-text">
          {v.channelTitle && (
            <Link to={`/channel/${v.channelId}`} className="short-channel">
              @{v.channelTitle}
            </Link>
          )}
          <p onClick={() => setSheet('info')}>
            <Tr text={decode(v.title)} />
          </p>
        </div>
        <div className="short-actions">
          {sb.like && <button className={liked ? 'on' : ''} onClick={() => toggleLike(st)}>
            <Icon name="like" size={26} fill={liked} />
            <span>{v.views ? compact(v.views) : 'J’aime'}</span>
          </button>}
          {sb.details && (
            <button onClick={() => setSheet('info')}>
              <Icon name="comment" size={26} />
              <span>Détails</span>
            </button>
          )}
          {sb.download && (
            <button onClick={() => setSheet('dl')}>
              <Icon name="download" size={26} />
              <span>Télécharger</span>
            </button>
          )}
          {sb.more && (
            <button onClick={() => setSheet('menu')}>
              <Icon name="dots" size={26} />
              <span>Plus</span>
            </button>
          )}
        </div>
      </div>
      <Sheet open={sheet === 'info'} onClose={() => setSheet('')} title="Détails">
        {!info.data ? (
          <span className="spinner" />
        ) : (
          <div className="info-sheet">
            <h4 className="info-title">{decode(info.data[0]?.title || v.title)}</h4>
            <div className="info-stats">
              <span>
                <strong>{compact(info.data[0]?.views || v.views)}</strong> vues
              </span>
              {!!info.data[0]?.likes && (
                <span>
                  <strong>{compact(info.data[0].likes)}</strong> j’aime
                </span>
              )}
              {info.data[0]?.publishedAt && <span>{ago(info.data[0].publishedAt)}</span>}
              {(info.data[0]?.channelTitle || v.channelTitle) && <span>@{info.data[0]?.channelTitle || v.channelTitle}</span>}
            </div>
            {info.data[0]?.description && (
              <p className="desc-text">
                <Tr text={info.data[0].description} />
              </p>
            )}
            <h4>Commentaires</h4>
            <Comments list={info.data[1]} />
          </div>
        )}
      </Sheet>
      <VideoMenu video={st} open={sheet === 'menu'} onClose={() => setSheet('')} />
      <DownloadSheet video={st} open={sheet === 'dl'} onClose={() => setSheet('')} />
    </div>
  )
}

const SEEN = 'youfree:seenShorts'
const seenShorts = () => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(SEEN) || '[]'))
  } catch {
    return new Set<string>()
  }
}
const markSeen = (id: string) => {
  const l = [...seenShorts()].filter((x) => x !== id)
  l.push(id)
  try {
    localStorage.setItem(SEEN, JSON.stringify(l.slice(-600)))
  } catch {
    /* ignore */
  }
}

export function Shorts() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { state } = useLocation() as { state?: { list?: Video[] } }
  const startId = params.get('v')
  const cat: string | undefined = undefined
  const [q, setQ] = useState('')
  const [grid, setGrid] = useState(false)
  const blocked = useBlocked()
  const { interests, lang } = useSettings()
  // Sans recherche : Shorts tirés de tes centres d'intérêt (3 thèmes au hasard, puis un nouveau à chaque page).
  const pick = () => interests[Math.floor(Math.random() * interests.length)]
  const load = async (token?: string) => {
    if (q) return search(q, token, 'shorts')
    if (!interests.length) return getShorts(cat, token)
    const keys = token ? [pick()] : [pick(), pick(), pick()]
    const lists = await Promise.all(keys.map((k) => getShorts(k).then((r) => r.videos, () => [] as Video[])))
    const out: Video[] = []
    for (let i = 0; i < 20; i++) for (const l of lists) if (l[i]) out.push(l[i])
    // Ordre mélangé et Shorts déjà vus écartés : un fil neuf à chaque visite.
    const seen = seenShorts()
    const fresh = out.filter((v) => !seen.has(v.id))
    const list = (fresh.length >= 4 ? fresh : out).sort(() => Math.random() - 0.5)
    return { videos: onlyLang(list, lang), next: 'more' }
  }
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
        if (state?.list?.length && startId && !cat && !q) {
          const i = state.list.findIndex((x) => x.id === startId)
          first = i >= 0 ? [...state.list.slice(i), ...state.list.slice(0, i)] : state.list
        } else if (startId && !cat && !q) {
          first = await getVideos([startId]).catch(() => [])
          if (!first.length) first = [{ id: startId, title: '', description: '', channelId: '', channelTitle: '', publishedAt: '', thumbnail: `https://i.ytimg.com/vi/${startId}/hqdefault.jpg`, durationSec: 0, views: 0, likes: 0, categoryId: '', live: false, isShort: true }]
        }
        const r = await load()
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
  }, [cat, q])

  const loadMore = useCallback(async () => {
    if (!next || loading.current) return
    loading.current = true
    try {
      const r = await load(next)
      setItems((old) => {
        const seen = new Set(old.map((x) => x.id))
        return [...old, ...r.videos.filter((x) => !seen.has(x.id))]
      })
      setNext(r.next)
    } finally {
      loading.current = false
    }
  }, [next, cat, q])

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
  }, [items, blocked])

  useEffect(() => {
    if (active) markSeen(active)
    const i = items.findIndex((x) => x.id === active)
    if (i >= items.length - 4) loadMore()
    // Précharge les flux des deux Shorts suivants : le défilement est instantané.
    if (canUseLocal() && !isSlow()) items.slice(i + 1, i + 3).forEach((x) => getStreams(x.id).catch(() => {}))
  }, [active, items, loadMore])

  return (
    <div className="shorts-page">
      <div className="shorts-top">
        <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label="Retour">
          <Icon name="back" />
        </button>
        <form className="shorts-search" onSubmit={(e) => {
            e.preventDefault()
            const v = (e.currentTarget.elements[0] as HTMLInputElement).value.trim()
            setQ(v)
            setGrid(!!v)
            ;(e.currentTarget.elements[0] as HTMLInputElement).blur()
          }}>
          <Icon name="search" size={18} />
          <input key={q} defaultValue={q} placeholder="Rechercher des Shorts" enterKeyHint="search" />
          {q && (
            <button type="button" onClick={() => (setQ(''), setGrid(false))} aria-label="Effacer">
              <Icon name="close" size={16} />
            </button>
          )}
        </form>
      </div>
      {error ? (
        <div className="page">
          <ErrorBox error={error} />
        </div>
      ) : (
        grid ? (
          <div className="shorts-results">
            {items.length === 0 && <span className="spinner" />}
            {applyFilters(items).map((v, i, list) => (
              <button
                key={v.id}
                className="short-card"
                onClick={() => {
                  setItems([...list.slice(i), ...list.slice(0, i)])
                  setActive(v.id)
                  setGrid(false)
                  feed.current?.scrollTo({ top: 0 })
                }}
              >
                <img src={v.thumbnail} alt="" loading="lazy" onError={(e) => (e.currentTarget.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`)} />
                <span className="short-info">
                  <span className="short-title">
                    <Tr text={decode(v.title)} />
                  </span>
                  {v.views > 0 && <small>{compact(v.views)} vues</small>}
                </span>
              </button>
            ))}
          </div>
        ) : (
        <div className="shorts-feed" ref={feed}>
          {items.length === 0 && <div className="short-slide loading">Chargement…</div>}
          {applyFilters(items).map((v, i, list) => (
            <ShortSlide key={v.id} v={v} active={v.id === active} near={!isSlow() && list[i - 1]?.id === active} />
          ))}
        </div>
        )
      )}
    </div>
  )
}
