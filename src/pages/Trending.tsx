import { useState } from 'react'
import { VideoCard, VideoGrid, Skeletons } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { useSettings } from '../lib/storage'
import { getTrending, type Video } from '../lib/youtube'

// Pas de catégorie « Jeux vidéo » (20) dans les thèmes proposés.
const CATEGORIES: [string, string | undefined][] = [
  ['Tout', undefined],
  ['Musique', '10'],
  ['Actualités', '25'],
  ['Science & tech', '28'],
  ['Éducation', '27'],
  ['Sport', '17'],
  ['Divertissement', '24'],
  ['Humour', '23'],
  ['Films & animation', '1'],
  ['Cuisine & vie', '26'],
  ['Auto', '2'],
]

export function Trending() {
  const [cat, setCat] = useState<string | undefined>()
  const [extra, setExtra] = useState<{ videos: Video[]; next?: string }>({ videos: [] })
  const settings = useSettings()
  const res = useAsync(() => {
    setExtra({ videos: [] })
    return getTrending(cat)
  }, [cat, settings.region, settings.hideShorts, settings.hideGaming])

  const next = extra.next ?? res.data?.next
  const more = async () => {
    const r = await getTrending(cat, next)
    setExtra((e) => ({ videos: [...e.videos, ...r.videos], next: r.next ?? '' }))
  }

  return (
    <div className="page">
      <div className="chips">
        {CATEGORIES.map(([label, id]) => (
          <button key={label} className={`chip ${cat === id ? 'on' : ''}`} onClick={() => setCat(id)}>
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
