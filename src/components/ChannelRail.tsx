import { NavLink } from 'react-router-dom'
import { useAllSubs } from '../lib/useSubs'
import { Avatar } from './Layout'

/** Colonne des chaînes suivies, toujours visible sur le côté des pages de chaîne. */
export function ChannelRail() {
  const { all } = useAllSubs()
  if (!all.length) return null
  return (
    <nav className="chan-rail" aria-label="Mes chaînes">
      {all.map((c) => (
        <NavLink key={c.id} to={`/channel/${c.id}`} title={c.title} replace>
          <Avatar src={c.thumbnail} name={c.title} size={44} />
          <span>{c.title}</span>
        </NavLink>
      ))}
    </nav>
  )
}
