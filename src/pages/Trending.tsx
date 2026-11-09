import { useEffect, useState } from 'react'
import { VideoCard, VideoGrid, Skeletons, ShortsShelf } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { ThemeChips } from '../components/Themes'
import { useAsync } from '../lib/useAsync'
import { useSettings } from '../lib/storage'
import { getTrending, splitShorts, type Video } from '../lib/youtube'

export function Trending() {
  const [cat, setCat] = useState<string | undefined>()
  const [extra, setExtra] = useState<{ videos: Video[]; next?: string }>({ videos: [] })
  const settings = useSettings()
  useEffect(() => setExtra({ videos: [] }), [cat, settings.region, settings.hideGaming, settings.source])
  const res = useAsync(() => {
    return getTrending(cat)
  }, [cat, settings.region, settings.hideGaming, settings.source], `pop:${settings.source}:${settings.region}:${cat ?? ''}`)

  const next = extra.next ?? res.data?.next
  const more = async () => {
    const r = await getTrending(cat, next)
    setExtra((e) => ({ videos: [...e.videos, ...r.videos], next: r.next ?? '' }))
  }
  const split = splitShorts([...(res.data?.videos ?? []), ...extra.videos])

  return (
    <div className="page">
      <h1 className="page-title">Tendances</h1>
      <ThemeChips value={cat} onChange={setCat} />
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
