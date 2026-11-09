import { Link } from 'react-router-dom'
import type { Video } from '../lib/youtube'
import { compact, duration, ago, decode } from '../lib/format'
import { toggleWatchLater, useWatchLater, type StoredVideo } from '../lib/storage'

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

export function VideoCard({ video, progress, subtitle, onRemove }: Props) {
  const later = useWatchLater()
  const saved = later.some((x) => x.id === video.id)
  const full = 'views' in video ? video : null
  const pct = progress && video.durationSec ? Math.min(100, (progress / video.durationSec) * 100) : 0

  return (
    <article className="card">
      <Link to={`/watch/${video.id}${progress ? `?t=${Math.floor(progress)}` : ''}`} className="thumb">
        <img src={video.thumbnail} alt="" loading="lazy" />
        {full?.live ? <span className="badge live">EN DIRECT</span> : video.durationSec > 0 && <span className="badge">{duration(video.durationSec)}</span>}
        {pct > 0 && (
          <span className="progress">
            <span style={{ width: `${pct}%` }} />
          </span>
        )}
      </Link>
      <div className="card-body">
        <Link to={`/watch/${video.id}`} className="card-title" title={decode(video.title)}>
          {decode(video.title)}
        </Link>
        <Link to={`/channel/${video.channelId}`} className="card-channel">
          {video.channelTitle}
        </Link>
        <div className="card-meta">
          {subtitle ?? (full ? `${compact(full.views)} vues · ${ago(full.publishedAt)}` : '')}
        </div>
      </div>
      <div className="card-actions">
        <button
          className={`icon-btn ${saved ? 'on' : ''}`}
          title={saved ? 'Retirer de « Plus tard »' : 'Regarder plus tard'}
          onClick={() => toggleWatchLater('views' in video ? toStored(video) : video)}
        >
          {saved ? '✓' : '⏱'}
        </button>
        {onRemove && (
          <button className="icon-btn" title="Retirer" onClick={onRemove}>
            ✕
          </button>
        )}
      </div>
    </article>
  )
}

export function VideoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid">{children}</div>
}

export function Skeletons({ n = 12 }: { n?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card skeleton">
          <div className="thumb" />
          <div className="line" />
          <div className="line short" />
        </div>
      ))}
    </div>
  )
}
