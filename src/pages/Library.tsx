import { useState } from 'react'
import { VideoCard, VideoGrid } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { useAuth } from '../lib/auth'
import { ago } from '../lib/format'
import { clearHistory, removeFromHistory, toggleWatchLater, useHistory, useWatchLater } from '../lib/storage'
import { getLikedVideos, getMyPlaylists, getPlaylistVideos } from '../lib/youtube'

type Tab = 'history' | 'later' | 'liked' | 'playlists'

function GoogleLiked() {
  const res = useAsync(() => getLikedVideos(), [])
  if (res.error) return <ErrorBox error={res.error} />
  return <VideoGrid>{res.data?.videos.map((v) => <VideoCard key={v.id} video={v} />)}</VideoGrid>
}

function GooglePlaylists() {
  const [open, setOpen] = useState<string | null>(null)
  const lists = useAsync(() => getMyPlaylists(), [])
  const items = useAsync(() => (open ? getPlaylistVideos(open, 50) : Promise.resolve(undefined)), [open])
  if (lists.error) return <ErrorBox error={lists.error} />
  if (open)
    return (
      <>
        <button className="btn ghost" onClick={() => setOpen(null)}>
          ← Playlists
        </button>
        {items.error && <ErrorBox error={items.error} />}
        <VideoGrid>{items.data?.videos.map((v) => <VideoCard key={v.id} video={v} />)}</VideoGrid>
      </>
    )
  return (
    <VideoGrid>
      {lists.data?.map((p) => (
        <button key={p.id} className="card playlist" onClick={() => setOpen(p.id)}>
          <span className="thumb">
            <img src={p.thumbnail} alt="" loading="lazy" />
            <span className="badge">{p.count} vidéos</span>
          </span>
          <span className="card-title">{p.title}</span>
        </button>
      ))}
    </VideoGrid>
  )
}

export function Library() {
  const { user } = useAuth()
  const history = useHistory()
  const later = useWatchLater()
  const [tab, setTab] = useState<Tab>('history')
  const tabs: [Tab, string][] = [
    ['history', 'Historique'],
    ['later', `Plus tard (${later.length})`],
    ...(user
      ? ([
          ['liked', 'Vidéos aimées'],
          ['playlists', 'Playlists'],
        ] as [Tab, string][])
      : []),
  ]

  return (
    <div className="page">
      <div className="chips">
        {tabs.map(([t, label]) => (
          <button key={t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
        {tab === 'history' && history.length > 0 && (
          <button className="chip" onClick={() => confirm('Effacer tout l’historique ?') && clearHistory()}>
            Effacer
          </button>
        )}
      </div>
      {tab === 'history' &&
        (history.length ? (
          <VideoGrid>
            {history.map((h) => (
              <VideoCard key={h.id} video={h} progress={h.position} subtitle={`Vu ${ago(h.watchedAt)}`} onRemove={() => removeFromHistory(h.id)} />
            ))}
          </VideoGrid>
        ) : (
          <p className="muted">Historique vide. Il est stocké uniquement sur cet appareil.</p>
        ))}
      {tab === 'later' &&
        (later.length ? (
          <VideoGrid>
            {later.map((v) => (
              <VideoCard key={v.id} video={v} subtitle="" onRemove={() => toggleWatchLater(v)} />
            ))}
          </VideoGrid>
        ) : (
          <p className="muted">Rien pour l’instant. Clique ⏱ sur une vidéo pour la garder ici.</p>
        ))}
      {tab === 'liked' && <GoogleLiked />}
      {tab === 'playlists' && <GooglePlaylists />}
    </div>
  )
}
