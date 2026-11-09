import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { getLocalSubs, toggleLocalSub, useLocalSubs, useSettings } from '../lib/storage'
import { themeQuery } from '../lib/i18n'
import { Avatar } from './Layout'
import { Icon } from './Icon'

/** Recherche de chaînes + suggestions selon les centres d'intérêt. */
export function ChannelFinder() {
  const s = useSettings()
  const subs = useLocalSubs()
  const [q, setQ] = useState('')
  const seed = q || themeQuery(s.lang, s.interests[0] ?? 'all')
  const res = useAsync(async () => (await import('../lib/innertube')).searchChannels(seed), [seed], `chs:${s.lang}:${seed}`)
  return (
    <section>
      <h2>{q ? 'Chaînes trouvées' : 'Chaînes suggérées'}</h2>
      <form className="music-search" onSubmit={(e) => (e.preventDefault(), setQ((e.currentTarget.elements[0] as HTMLInputElement).value.trim()))}>
        <Icon name="search" size={18} />
        <input placeholder="Rechercher une chaîne" enterKeyHint="search" />
      </form>
      {!res.data ? (
        <span className="spinner" />
      ) : (
        <div className="channels">
          {res.data.map((c: { id: string; title: string; thumbnail: string; subs: string }) => {
            const on = subs.some((x) => x.id === c.id)
            return (
              <div key={c.id} className="channel-row">
                <Link to={`/channel/${c.id}`}>
                  <Avatar src={c.thumbnail} name={c.title} size={40} />
                  <span>
                    {c.title}
                    <small className="muted"> {c.subs}</small>
                  </span>
                </Link>
                <button className={`btn small ${on ? 'ghost' : ''}`} onClick={() => toggleLocalSub({ id: c.id, title: c.title, thumbnail: c.thumbnail })}>
                  {on ? 'Abonné ✓' : 'S’abonner'}
                </button>
              </div>
            )
          })}
        </div>
      )}
      {getLocalSubs().length > 0 && <p className="muted">{getLocalSubs().length} abonnement(s).</p>}
    </section>
  )
}
