import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VideoCard, VideoGrid, Skeletons, ShortsShelf } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { Infinite } from '../components/Infinite'
import { useAsync } from '../lib/useAsync'
import { useSettings } from '../lib/storage'
import { search, splitShorts, type SearchFilter, type Video } from '../lib/youtube'

const FILTERS: [SearchFilter, string][] = [
  ['', 'Pertinence'],
  ['popular', 'Populaires'],
  ['today', 'Aujourd’hui'],
  ['week', 'Cette semaine'],
  ['month', 'Ce mois'],
  ['short', 'Moins de 4 min'],
  ['long', 'Plus de 20 min'],
]

export function Search() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const { showShorts } = useSettings()
  const [filter, setFilter] = useState<SearchFilter>('')
  const [extra, setExtra] = useState<{ videos: Video[]; next?: string }>({ videos: [] })
  useEffect(() => setExtra({ videos: [] }), [q, filter])
  const res = useAsync(() => {
    return search(q, undefined, filter)
  }, [q, filter], `s:${q}:${filter}`)
  const next = extra.next ?? res.data?.next
  const more = async () => {
    const r = await search(q, next, filter)
    setExtra((e) => ({ videos: [...e.videos, ...r.videos], next: r.next ?? '' }))
  }
  const split = splitShorts([...(res.data?.videos ?? []), ...extra.videos])

  return (
    <div className="page">
      <div className="chips">
        {FILTERS.map(([f, label]) => (
          <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
            {label}
          </button>
        ))}
      </div>
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
          <Infinite hasMore={!!next} onMore={more} />
        </>
      )}
    </div>
  )
}
