import { useEffect, useState } from 'react'
import { getStreams } from '../lib/stream'
import { canUseLocal } from '../lib/nativeFetch'
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
// Tirage aléatoire à chaque ouverture de l'accueil : le contenu change à chaque visite.
let seed = Math.random()
const rnd = (i: number) => ((Math.sin(seed * 9973 + i * 7919) + 1) * 10000) % 1
function pickToday(interests: string[], n: number) {
  return interests
    .map((k, i) => [k, rnd(i)] as const)
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([k]) => k)
}
const shuffle = <T,>(l: T[]) => l.map((v, i) => [v, rnd(i + 100)] as const).sort((a, b) => a[1] - b[1]).map(([v]) => v)
async function forYou(interests: string[]) {
  const lists = await Promise.all(pickToday(interests, 5).map((c) => getTrending(c).then((r) => r.videos, () => [])))
  const out = []
  for (let i = 0; i < 30; i++) for (const l of lists) if (l[i]) out.push(l[i])
  return { videos: out, next: undefined }
}

export function Home() {
  // Nouveau tirage à chaque arrivée sur l'accueil.
  useState(() => (seed = Math.random()))
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
  // Pendant le chargement du nouveau tirage, on montre le précédent (mélangé) : affichage immédiat.
  const last = (() => {
    try {
      return JSON.parse(localStorage.getItem('youfree:homeLast') || '[]')
    } catch {
      return []
    }
  })()
  if (popular.data?.videos?.length) localStorage.setItem('youfree:homeLast', JSON.stringify(popular.data.videos.slice(0, 40)))
  const pop = splitShorts(shuffle(onlyLang(popular.data?.videos ?? last, settings.lang)))
  const shelf = settings.showShorts ? onlyLang([...subs.shorts, ...pop.shorts, ...(shorts.data?.videos ?? [])], settings.lang).filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i) : []

  const first = pop.videos.slice(0, 4).map((v) => v.id).join(',')
  useEffect(() => {
    if (!first || !canUseLocal()) return
    const t = setTimeout(() => first.split(',').forEach((id) => getStreams(id).catch(() => {})), 1200)
    return () => clearTimeout(t)
  }, [first])
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
        {popular.error && !pop.videos.length ? <ErrorBox error={popular.error} /> : !pop.videos.length ? <Skeletons n={8} /> : (
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
