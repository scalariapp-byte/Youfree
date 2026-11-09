import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VideoCard, VideoGrid, Skeletons } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { search, type Video } from '../lib/youtube'

export function Search() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
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

  return (
    <div className="page">
      <h2>Résultats pour « {q} »</h2>
      {res.error ? (
        <ErrorBox error={res.error} />
      ) : !res.data ? (
        <Skeletons />
      ) : res.data.videos.length === 0 ? (
        <p className="muted">Aucun résultat.</p>
      ) : (
        <>
          <VideoGrid>
            {[...res.data.videos, ...extra.videos].map((v) => (
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
