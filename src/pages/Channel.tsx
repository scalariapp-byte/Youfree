import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { VideoCard, VideoGrid, Skeletons } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { applyFilters, getChannel, getPlaylistVideos, type Video } from '../lib/youtube'
import { compact } from '../lib/format'
import { toggleLocalSub, useLocalSubs } from '../lib/storage'
import { useAllSubs } from '../lib/useSubs'

export function Channel() {
  const { id = '' } = useParams()
  const subs = useLocalSubs()
  const { google } = useAllSubs()
  const [extra, setExtra] = useState<{ videos: Video[]; next?: string }>({ videos: [] })
  const ch = useAsync(() => getChannel(id), [id])
  const vids = useAsync(() => {
    setExtra({ videos: [] })
    return getPlaylistVideos('UU' + id.slice(2), 30)
  }, [id])
  const next = extra.next ?? vids.data?.next
  const more = async () => {
    const r = await getPlaylistVideos('UU' + id.slice(2), 30, next)
    setExtra((e) => ({ videos: [...e.videos, ...r.videos], next: r.next ?? '' }))
  }

  if (ch.error) return <div className="page"><ErrorBox error={ch.error} /></div>
  const c = ch.data
  const isSub = subs.some((s) => s.id === id)
  const isGoogle = google.some((s) => s.id === id)

  return (
    <div className="page">
      {c && (
        <>
          {c.banner && <div className="banner" style={{ backgroundImage: `url(${c.banner})` }} />}
          <header className="channel-head">
            <img src={c.thumbnail} alt="" referrerPolicy="no-referrer" />
            <div>
              <h1>{c.title}</h1>
              <p className="muted">
                {compact(c.subscribers)} abonnés · {compact(c.videoCount)} vidéos
              </p>
              <p className="channel-desc">{c.description}</p>
            </div>
            {isGoogle ? (
              <span className="btn ghost">Abonné ✓</span>
            ) : (
              <button className={`btn ${isSub ? 'ghost' : ''}`} onClick={() => toggleLocalSub({ id: c.id, title: c.title, thumbnail: c.thumbnail })}>
                {isSub ? 'Abonné ✓' : 'S’abonner'}
              </button>
            )}
          </header>
        </>
      )}
      {vids.error ? (
        <ErrorBox error={vids.error} />
      ) : !vids.data ? (
        <Skeletons />
      ) : (
        <>
          <VideoGrid>
            {applyFilters([...vids.data.videos, ...extra.videos]).map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </VideoGrid>
          {next && (
            <button className="btn ghost more" onClick={more}>
              Afficher plus
            </button>
          )}
        </>
      )}
    </div>
  )
}
