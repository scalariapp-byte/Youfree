import { useEffect, useState } from 'react'
import { VideoCard, VideoGrid, Skeletons, ShortsShelf } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { Infinite } from '../components/Infinite'
import { useAsync } from '../lib/useAsync'
import { useSettings, useBlocked } from '../lib/storage'
import { getTrending, splitShorts, type Video } from '../lib/youtube'

export function Trending() {
  const cat: string | undefined = undefined
  const [extra, setExtra] = useState<{ videos: Video[]; next?: string }>({ videos: [] })
  const settings = useSettings()
  const blocked = useBlocked()
  useEffect(() => setExtra({ videos: [] }), [cat, settings.region, blocked.length])
  const res = useAsync(() => {
    return getTrending(cat)
  }, [cat, settings.region, blocked.length], `pop:${settings.region}:${cat ?? ''}`)

  const next = extra.next ?? res.data?.next
  const more = async () => {
    const r = await getTrending(cat, next)
    setExtra((e) => ({ videos: [...e.videos, ...r.videos], next: r.next ?? '' }))
  }
  const split = splitShorts([...(res.data?.videos ?? []), ...extra.videos])

  return (
    <div className="page">
      <h1 className="page-title">Tendances</h1>
      {res.error ? (
        <ErrorBox error={res.error} />
      ) : !res.data ? (
        <Skeletons />
      ) : (
        <>
          {settings.showShorts && <ShortsShelf shorts={split.shorts} />}
          <VideoGrid>
            {split.videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </VideoGrid>
          <Infinite hasMore={!!next} onMore={more} />
        </>
      )}
    </div>
  )
}
