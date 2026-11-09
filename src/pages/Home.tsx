// Accueil : thèmes en haut, puis Reprendre, Shorts, Nouveautés des abonnements, Populaire.
// Pas d'algorithme opaque, pas de jeux.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ago } from '../lib/format'
import { VideoCard, VideoGrid, Skeletons, ShortsShelf } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { ThemeChips } from '../components/Themes'
import { useAsync } from '../lib/useAsync'
import { useAllSubs } from '../lib/useSubs'
import { useHistory, useSettings } from '../lib/storage'
import { getShorts, getSubscriptionFeed, getTrending, isAvailable, splitShorts } from '../lib/youtube'
import { Onboarding } from './Onboarding'

function ContinueWatching() {
  const history = useHistory()
  const items = history.filter((h) => h.position > 10 && (!h.durationSec || h.position < h.durationSec * 0.92)).slice(0, 10)
  if (!items.length) return null
  return (
    <section>
      <div className="section-head">
        <h2>Reprendre</h2>
        <Link to="/library">Historique</Link>
      </div>
      <div className="row">
        {items.map((h) => (
          <VideoCard key={h.id} video={h} progress={h.position} subtitle={`vu ${ago(h.watchedAt)}`} />
        ))}
      </div>
    </section>
  )
}

export function Home() {
  const settings = useSettings()
  const { all, loading } = useAllSubs()
  const [cat, setCat] = useState<string | undefined>()
  const key = all.map((c) => c.id).join(',')

  const feed = useAsync(() => (all.length ? getSubscriptionFeed(all) : Promise.resolve([])), [key, settings.hideGaming], `feed:${key}`)
  const popular = useAsync(() => getTrending(cat), [cat, settings.region, settings.hideGaming], `pop:${settings.region}:${cat ?? ''}`)
  const shorts = useAsync(() => (settings.showShorts ? getShorts(cat) : Promise.resolve({ videos: [], next: undefined })), [cat, settings.showShorts, settings.region], `sh:${settings.region}:${cat ?? ''}:${settings.showShorts}`)

  if (!isAvailable()) return <Onboarding />

  const subs = splitShorts(feed.data ?? [])
  const pop = splitShorts(popular.data?.videos ?? [])
  const shelf = settings.showShorts ? [...subs.shorts, ...pop.shorts, ...(shorts.data?.videos ?? [])].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i) : []

  return (
    <div className="page">
      <ThemeChips value={cat} onChange={setCat} />
      {!cat && <ContinueWatching />}

      {shelf.length > 0 && <ShortsShelf shorts={shelf} />}

      {!cat && (all.length > 0 || loading) && (
        <section>
          <div className="section-head">
            <h2>Nouveautés de tes abonnements</h2>
            <Link to="/subscriptions">Tout voir</Link>
          </div>
          {feed.error ? <ErrorBox error={feed.error} /> : !feed.data ? <Skeletons n={6} /> : (
            <VideoGrid>
              {subs.videos.slice(0, 12).map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </VideoGrid>
          )}
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>{cat ? 'Populaire dans ce thème' : 'Populaire en ce moment'}</h2>
          <Link to="/trending">Explorer</Link>
        </div>
        {popular.error ? <ErrorBox error={popular.error} /> : !popular.data ? <Skeletons n={8} /> : (
          <VideoGrid>
            {pop.videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </VideoGrid>
        )}
      </section>
    </div>
  )
}
