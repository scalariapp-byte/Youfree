// Accueil : thèmes en haut, puis Reprendre, Shorts, Nouveautés des abonnements, Populaire.
// Pas d'algorithme opaque, pas de jeux.
import { Link } from 'react-router-dom'
import { ago } from '../lib/format'
import { VideoCard, VideoGrid, Skeletons, ShortsShelf } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { useAllSubs } from '../lib/useSubs'
import { useHistory, useSettings, useBlocked } from '../lib/storage'
import { getShorts, getSubscriptionFeed, getTrending, isAvailable, splitShorts } from '../lib/youtube'
import { Onboarding } from './Onboarding'
import { onlyLang } from '../lib/i18n'

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

/** « Pour toi » : vidéos populaires de chaque centre d'intérêt, entremêlées. */
// Rotation quotidienne parmi les centres d'intérêt (5 par jour), pour varier sans tout charger.
function pickToday(interests: string[], n: number) {
  const day = Math.floor(Date.now() / 86400000)
  return [...interests].sort((a, b) => ((a.charCodeAt(0) * 31 + a.length * day) % 97) - ((b.charCodeAt(0) * 31 + b.length * day) % 97)).slice(0, n)
}
async function forYou(interests: string[]) {
  const lists = await Promise.all(pickToday(interests, 5).map((c) => getTrending(c).then((r) => r.videos, () => [])))
  const out = []
  for (let i = 0; i < 30; i++) for (const l of lists) if (l[i]) out.push(l[i])
  return { videos: out, next: undefined }
}

export function Home() {
  const settings = useSettings()
  const blocked = useBlocked()
  const { all, loading } = useAllSubs()
  const cat: string | undefined = undefined
  const key = all.map((c) => c.id).join(',')

  const feed = useAsync(() => (all.length ? getSubscriptionFeed(all) : Promise.resolve([])), [key, blocked.length], `feed:${key}`)
  const mix = !cat && settings.interests.length > 0
  const popular = useAsync(() => (mix ? forYou(settings.interests) : getTrending(cat)), [cat, settings.region, blocked.length], `pop:${settings.lang}:${settings.region}:${cat ?? ''}:${mix ? settings.interests.join('.') : ''}`)
  const shorts = useAsync(() => (settings.showShorts ? getShorts(cat ?? pickToday(settings.interests, 1)[0]) : Promise.resolve({ videos: [], next: undefined })), [cat, settings.showShorts, settings.region], `sh:${settings.lang}:${settings.region}:${cat ?? pickToday(settings.interests, 1)[0] ?? ''}:${settings.showShorts}`)

  if (!isAvailable()) return <Onboarding />

  const subs = splitShorts(feed.data ?? [])
  const pop = splitShorts(onlyLang(popular.data?.videos ?? [], settings.lang))
  const shelf = settings.showShorts ? onlyLang([...subs.shorts, ...pop.shorts, ...(shorts.data?.videos ?? [])], settings.lang).filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i) : []

  const blocks: Record<string, React.ReactNode> = {
    continue: !cat && settings.sections.continue && <ContinueWatching key="c" />,
    shorts: settings.sections.shorts && shelf.length > 0 && <ShortsShelf key="s" shorts={shelf} />,
    subs: !cat && settings.sections.subs && (all.length > 0 || loading) && (
        <section key="n">
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
      ),
    popular: (cat || settings.sections.popular) && <section key="p">
        <div className="section-head">
          <h2>{cat ? 'Populaire dans ce thème' : mix ? 'Pour toi' : 'Populaire en ce moment'}</h2>
          <Link to="/trending">Explorer</Link>
        </div>
        {popular.error ? <ErrorBox error={popular.error} /> : !popular.data ? <Skeletons n={8} /> : (
          <VideoGrid>
            {pop.videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </VideoGrid>
        )}
      </section>,
  }
  return <div className="page">{settings.homeOrder.map((k) => blocks[k])}</div>
}
