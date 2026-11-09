import { useState } from 'react'
import { Link } from 'react-router-dom'
import { VideoCard, VideoGrid, Skeletons, ShortsShelf } from '../components/VideoCard'
import { Avatar } from '../components/Layout'
import { ChannelFinder } from '../components/ChannelFinder'
import { Icon } from '../components/Icon'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { useAllSubs } from '../lib/useSubs'
import { toggleLocalSub, useSettings, useBlocked } from '../lib/storage'
import { getSubscriptionFeed, splitShorts } from '../lib/youtube'

export function Subscriptions() {
  const { all, google, loading } = useAllSubs()
  const settings = useSettings()
  const blocked = useBlocked()
  const [tab, setTab] = useState<'feed' | 'channels' | 'find'>('feed')
  const [force, setForce] = useState(0)
  const key = all.map((c) => c.id).join(',')
  const feed = useAsync(() => (all.length ? getSubscriptionFeed(all, force > 0) : Promise.resolve([])), [key, force, blocked.length])

  if (!all.length && !loading)
    return (
      <div className="page">
        <h1 className="page-title">Abonnements</h1>
        <ChannelFinder />
      </div>
    )

  return (
    <div className="page">
      <h1 className="page-title">Abonnements</h1>
      <Link to="/settings?pane=notifs" className="notif-panel">
        <Icon name="bell" />
        <span>
          <strong>Notifications</strong>
          <small>Choisir les chaînes qui te préviennent des nouvelles vidéos</small>
        </span>
        <Icon name="fwd" size={18} />
      </Link>
      <div className="chips">
        <button className={`chip ${tab === 'feed' ? 'on' : ''}`} onClick={() => setTab('feed')}>
          Dernières vidéos
        </button>
        <button className={`chip ${tab === 'find' ? 'on' : ''}`} onClick={() => setTab('find')}>
          + Trouver des chaînes
        </button>
        <button className={`chip ${tab === 'channels' ? 'on' : ''}`} onClick={() => setTab('channels')}>
          Chaînes ({all.length})
        </button>
        {tab === 'feed' && (
          <button className="chip" onClick={() => setForce((f) => f + 1)} title="Ignorer le cache de 15 min">
            ↻ Actualiser
          </button>
        )}
      </div>
      {tab === 'find' ? (
        <ChannelFinder />
      ) : tab === 'channels' ? (
        <div className="channels">
          {all.map((c) => {
            const fromGoogle = google.some((g) => g.id === c.id)
            return (
              <div key={c.id} className="channel-row">
                <Link to={`/channel/${c.id}`}>
                  <Avatar src={c.thumbnail} name={c.title} size={40} />
                  <span>{c.title}</span>
                </Link>
                {fromGoogle ? (
                  <small className="muted">Compte Google</small>
                ) : (
                  <button className="btn ghost" onClick={() => toggleLocalSub(c)}>
                    Se désabonner
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : feed.error ? (
        <ErrorBox error={feed.error} />
      ) : !feed.data ? (
        <Skeletons />
      ) : (
        <>
          {settings.showShorts && <ShortsShelf shorts={splitShorts(feed.data).shorts} title="Shorts de tes abonnements" more={false} />}
          <VideoGrid>
            {splitShorts(feed.data).videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </VideoGrid>
        </>
      )}
    </div>
  )
}
