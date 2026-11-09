import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { VideoCard, VideoGrid, Skeletons, ShortCard } from '../components/VideoCard'
import { Avatar } from '../components/Layout'
import { ErrorBox } from '../components/ErrorBox'
import { Infinite } from '../components/Infinite'
import { useAsync } from '../lib/useAsync'
import { applyFilters, getChannel, getChannelShorts, getPlaylistVideos, splitShorts, type Video } from '../lib/youtube'
import { compact } from '../lib/format'
import { toggleLocalSub, useLocalSubs, useSettings } from '../lib/storage'
import { useAllSubs } from '../lib/useSubs'

export function Channel() {
  const { id = '' } = useParams()
  const subs = useLocalSubs()
  const { google } = useAllSubs()
  const [extra, setExtra] = useState<{ videos: Video[]; next?: string }>({ videos: [] })
  const { showShorts } = useSettings()
  const [tab, setTab] = useState<'videos' | 'shorts'>('videos')
  const ch = useAsync(() => getChannel(id), [id], `ch:${id}`)
  const shorts = useAsync(() => (tab === 'shorts' ? getChannelShorts(id) : Promise.resolve(undefined)), [id, tab], tab === 'shorts' ? `chs:${id}` : undefined)
  const vids = useAsync(() => {
    setExtra({ videos: [] })
    return getPlaylistVideos('UU' + id.slice(2), 30)
  }, [id], `chv:${id}`)
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
            <Avatar src={c.thumbnail} name={c.title} size={88} />
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
      {showShorts && (
        <div className="chips">
          <button className={`chip ${tab === 'videos' ? 'on' : ''}`} onClick={() => setTab('videos')}>
            Vidéos
          </button>
          <button className={`chip ${tab === 'shorts' ? 'on' : ''}`} onClick={() => setTab('shorts')}>
            Shorts
          </button>
        </div>
      )}
      {tab === 'shorts' ? (
        shorts.error ? (
          <ErrorBox error={shorts.error} />
        ) : !shorts.data ? (
          <Skeletons n={6} />
        ) : shorts.data.videos.length === 0 ? (
          <p className="muted">Aucun Short sur cette chaîne.</p>
        ) : (
          <div className="shorts-grid">
            {shorts.data.videos.map((v) => (
              <ShortCard key={v.id} video={v} list={shorts.data!.videos} />
            ))}
          </div>
        )
      ) : vids.error ? (
        <ErrorBox error={vids.error} />
      ) : !vids.data ? (
        <Skeletons />
      ) : (
        <>
          <VideoGrid>
            {splitShorts(applyFilters([...vids.data.videos, ...extra.videos])).videos.map((v) => (
              <VideoCard key={v.id} video={{ ...v, channelAvatar: v.channelAvatar ?? c?.thumbnail }} />
            ))}
          </VideoGrid>
          <Infinite hasMore={!!next} onMore={more} />
        </>
      )}
    </div>
  )
}
