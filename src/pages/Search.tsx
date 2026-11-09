import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VideoCard, VideoGrid, Skeletons, ShortsShelf } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { useSettings } from '../lib/storage'
import { search, splitShorts, type Video } from '../lib/youtube'

export function Search() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const { showShorts } = useSettings()
  const [extra, setExtra] = useState<{ videos: Video[]; next?: string }>({ videos: [] })
  const res = useAsync(() => {
    setExtra({ videos: [] })
    return search(q)
  }, [q])
  const next = extra.next ?? res.data?.next
  const more = async () => {
    const r = await search(q, next)
    setExtra((e) => ({ videos: [...e.videos, ...r.videos], next: r.next ?? '' }))
  }
  const split = splitShorts([...(res.data?.videos ?? []), ...extra.videos])

  return (
    <div className="page">
      <h1 className="page-title">« {q} »</h1>
      {res.error ? (
        <ErrorBox error={res.error} />
      ) : !res.data ? (
        <Skeletons />
      ) : (
        <>
          {showShorts && <ShortsShelf shorts={split.shorts} more={false} />}
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
