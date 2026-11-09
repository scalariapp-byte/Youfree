import { Children, memo } from 'react'
import { Link } from 'react-router-dom'
import { getVideos, type Video } from '../lib/youtube'
import { prefetch } from '../lib/useAsync'
import { getStreams } from '../lib/stream'
import { canUseLocal } from '../lib/nativeFetch'
import { compact, duration, ago, decode } from '../lib/format'
import { toggleWatchLater, useWatchLater, type StoredVideo } from '../lib/storage'
import { Empty } from './ErrorBox'
import { Avatar } from './Layout'
import { Icon } from './Icon'

export const toStored = (v: Video): StoredVideo => ({
  id: v.id,
  title: v.title,
  channelId: v.channelId,
  channelTitle: v.channelTitle,
  thumbnail: v.thumbnail,
  durationSec: v.durationSec,
})

interface Props {
  video: Video | StoredVideo
  progress?: number
  subtitle?: string
  onRemove?: () => void
}

/** Au toucher : on précharge les infos et les flux pour une ouverture instantanée. */
export function warm(id: string) {
  prefetch(`v:${id}`, async () => (await getVideos([id]))[0])
  if (canUseLocal()) getStreams(id).catch(() => {})
}

export const VideoCard = memo(function VideoCard({ video, progress, subtitle, onRemove }: Props) {
  const later = useWatchLater()
  const saved = later.some((x) => x.id === video.id)
  const full = 'views' in video ? video : null
  const pct = progress && video.durationSec ? Math.min(100, (progress / video.durationSec) * 100) : 0
  const meta =
    subtitle ??
    [full && full.views ? `${compact(full.views)} vues` : '', full?.publishedAt ? ago(full.publishedAt) : ''].filter(Boolean).join(' · ')

  return (
    <article className="card" onPointerDown={() => warm(video.id)}>
      <Link to={`/watch/${video.id}${progress ? `?t=${Math.floor(progress)}` : ''}`} className="thumb" viewTransition>
        <Thumb id={video.id} fallback={video.thumbnail} />
        {full?.live ? <span className="badge live">EN DIRECT</span> : video.durationSec > 0 && <span className="badge">{duration(video.durationSec)}</span>}
        {pct > 0 && (
          <span className="progress">
            <span style={{ width: `${pct}%` }} />
          </span>
        )}
      </Link>
      <div className="card-info">
        <Link to={video.channelId ? `/channel/${video.channelId}` : '#'} className="card-avatar" aria-label={video.channelTitle}>
          <Avatar src={full?.channelAvatar} name={video.channelTitle || '?'} />
        </Link>
        <div className="card-body">
          <Link to={`/watch/${video.id}`} className="card-title" title={decode(video.title)}>
            {decode(video.title)}
          </Link>
          <div className="card-meta">
            <Link to={`/channel/${video.channelId}`}>{video.channelTitle}</Link>
            {meta && <span> · {meta}</span>}
          </div>
        </div>
        <div className="card-actions">
          <button
            className={`icon-btn small ${saved ? 'on' : ''}`}
            title={saved ? 'Retirer de « Plus tard »' : 'Regarder plus tard'}
            onClick={() => toggleWatchLater('views' in video ? toStored(video) : video)}
          >
            <Icon name={saved ? 'check' : 'clock'} size={18} />
          </button>
          {onRemove && (
            <button className="icon-btn small" title="Retirer" onClick={onRemove}>
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
})

/** Miniature adaptée à l'écran : 320 px en liste, 1280 px en pleine largeur (sans bandes noires). */
function Thumb({ id, fallback }: { id: string; fallback: string }) {
  const base = `https://i.ytimg.com/vi/${id}/`
  return (
    <img
      src={base + 'mqdefault.jpg'}
      srcSet={`${base}mqdefault.jpg 320w, ${base}hq720.jpg 1280w`}
      sizes="(max-width: 560px) 100vw, 360px"
      alt=""
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget
        if (img.srcset) {
          img.srcset = ''
          img.src = fallback || base + 'hqdefault.jpg'
        }
      }}
    />
  )
}

export function VideoGrid({ children }: { children: React.ReactNode }) {
  if (Children.count(children) === 0) return <Empty />
  return <div className="grid">{children}</div>
}

export function Skeletons({ n = 12 }: { n?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card skeleton">
          <div className="thumb" />
          <div className="card-info">
            <span className="avatar sk" />
            <div className="card-body">
              <div className="line" />
              <div className="line short" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Carte verticale 9:16 pour un Short. */
export function ShortCard({ video, list }: { video: Video; list?: Video[] }) {
  return (
    <Link to={`/shorts?v=${video.id}`} state={{ list }} className="short-card">
      <img src={video.thumbnail} alt="" loading="lazy" onError={(e) => ((e.currentTarget.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`))} />
      <span className="short-info">
        <span className="short-title">{decode(video.title)}</span>
        {video.views > 0 && <small>{compact(video.views)} vues</small>}
      </span>
    </Link>
  )
}

export function ShortsShelf({ shorts, title = 'Shorts', more = true }: { shorts: Video[]; title?: string; more?: boolean }) {
  if (!shorts.length) return null
  return (
    <section className="shelf">
      <div className="section-head">
        <h2>
          <Icon name="shorts" /> {title}
        </h2>
        {more && <Link to="/shorts">Tout voir</Link>}
      </div>
      <div className="shorts-row">
        {shorts.slice(0, 20).map((s) => (
          <ShortCard key={s.id} video={s} list={shorts} />
        ))}
      </div>
    </section>
  )
}
