// Accueil : pas d'algorithme opaque, pas de Shorts imposés, pas de jeux.
// 1) Reprendre  2) Nouveautés des abonnements (chronologique)  3) Tendances par thème.
import { Link } from 'react-router-dom'
import { ago } from '../lib/format'
import { VideoCard, VideoGrid, Skeletons } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { useAllSubs } from '../lib/useSubs'
import { useHistory, useSettings } from '../lib/storage'
import { getSubscriptionFeed, getTrending, hasCredentials } from '../lib/youtube'
import { useAuth } from '../lib/auth'
import { Onboarding } from './Onboarding'

function ContinueWatching() {
  const history = useHistory()
  const items = history.filter((h) => h.position > 10 && (!h.durationSec || h.position < h.durationSec * 0.92)).slice(0, 8)
  if (!items.length) return null
  return (
    <section>
      <div className="section-head">
        <h2>Reprendre</h2>
        <Link to="/library">Historique</Link>
      </div>
      <div className="row">
        {items.map((h) => (
          <VideoCard key={h.id} video={h} progress={h.position} subtitle={`Vu ${ago(h.watchedAt)}`} />
        ))}
      </div>
    </section>
  )
}

function SubsFeed() {
  const { all, loading } = useAllSubs()
  const settings = useSettings()
  const key = all.map((c) => c.id).join(',')
  const feed = useAsync(() => (all.length ? getSubscriptionFeed(all) : Promise.resolve([])), [key, settings.hideShorts, settings.hideGaming])
  if (!all.length && !loading) return null
  return (
    <section>
      <div className="section-head">
        <h2>Nouveautés de tes abonnements</h2>
        <Link to="/subscriptions">Tout voir</Link>
      </div>
      {feed.error ? (
        <ErrorBox error={feed.error} />
      ) : !feed.data ? (
        <Skeletons n={8} />
      ) : (
        <VideoGrid>
          {feed.data.slice(0, 12).map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </VideoGrid>
      )}
    </section>
  )
}

function TrendingPreview() {
  const settings = useSettings()
  const res = useAsync(() => getTrending(), [settings.region, settings.hideShorts, settings.hideGaming])
  return (
    <section>
      <div className="section-head">
        <h2>Populaire en ce moment</h2>
        <Link to="/trending">Explorer par thème</Link>
      </div>
      {res.error ? (
        <ErrorBox error={res.error} />
      ) : !res.data ? (
        <Skeletons n={8} />
      ) : (
        <VideoGrid>
          {res.data.videos.slice(0, 16).map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </VideoGrid>
      )}
    </section>
  )
}

export function Home() {
  useAuth() // re-rendu à la connexion
  if (!hasCredentials()) return <Onboarding />
  return (
    <div className="page">
      <ContinueWatching />
      <SubsFeed />
      <TrendingPreview />
    </div>
  )
}
