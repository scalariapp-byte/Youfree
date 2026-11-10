import { useState } from 'react'
import { Link } from 'react-router-dom'
import { VideoCard, VideoGrid, Skeletons, ShortsShelf } from '../components/VideoCard'
import { Avatar } from '../components/Layout'
import { ChannelFinder } from '../components/ChannelFinder'
import { NotifPanel } from '../components/NotifPanel'
import { Sheet } from '../components/Sheet'
import { Icon } from '../components/Icon'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { useAllSubs } from '../lib/useSubs'
import { saveSettings, toggleLocalSub, useSettings, useBlocked } from '../lib/storage'
import { askPermission } from '../lib/notify'
import { getSubscriptionFeed, splitShorts } from '../lib/youtube'

export function Subscriptions() {
  const { all, loading } = useAllSubs()
  const settings = useSettings()
  const blocked = useBlocked()
  const [tab, setTab] = useState<'feed' | 'channels' | 'find'>('feed')
  const [force, setForce] = useState(0)
  const [filterQ, setFilterQ] = useState('')
  const [notif, setNotif] = useState(false)
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
      <button className="notif-panel" onClick={() => setNotif(true)}>
        <Icon name="bell" />
        <span>
          <strong>Notifications {settings.notificationsOn ? '' : '(désactivées)'}</strong>
          <small>{settings.notificationsOn ? `${settings.notifyChannels.length} chaîne(s) te préviennent` : 'Touche pour les réactiver'}</small>
        </span>
        <Icon name="fwd" size={18} />
      </button>
      <Sheet open={notif} onClose={() => setNotif(false)} title="Notifications">
        <NotifPanel />
      </Sheet>
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
        <div>
          <div className="music-search">
            <Icon name="search" size={18} />
            <input value={filterQ} onChange={(e) => setFilterQ(e.target.value)} placeholder={`Filtrer mes ${all.length} chaînes`} />
          </div>
          <div className="channels">
            {all
              .filter((c) => c.title.toLowerCase().includes(filterQ.toLowerCase()))
              .map((c) => {
                const bell = settings.notifyChannels.includes(c.id)
                return (
                  <div key={c.id} className="channel-row">
                    <Link to={`/channel/${c.id}`}>
                      <Avatar src={c.thumbnail} name={c.title} size={40} />
                      <span>{c.title}</span>
                    </Link>
                    <div className="row-btns tight">
                      <button
                        className={`icon-btn small ${bell ? 'on' : ''}`}
                        aria-label="Notifications"
                        onClick={async () => {
                          if (!bell) await askPermission()
                          saveSettings({ notifyChannels: bell ? settings.notifyChannels.filter((x) => x !== c.id) : [...settings.notifyChannels, c.id] })
                        }}
                      >
                        <Icon name="bell" size={18} fill={bell} />
                      </button>
                      <button className="btn ghost small" onClick={() => confirm(`Se désabonner de ${c.title} ?`) && toggleLocalSub(c)}>
                        Se désabonner
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
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
