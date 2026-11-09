import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useAllSubs } from '../lib/useSubs'
import { useSettings } from '../lib/storage'
import { Icon } from './Icon'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="logo" aria-label="Accueil Youfree">
      <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden>
        <rect width="64" height="64" rx="18" fill="var(--accent)" />
        <circle cx="32" cy="32" r="16" fill="none" stroke="#fff" strokeWidth="5" />
        <path d="M28 24v16l12-8z" fill="#fff" />
      </svg>
      {!compact && <span>Youfree</span>}
    </Link>
  )
}

/** Applique le thème choisi (sombre par défaut) sur <html>. */
function useTheme() {
  const { theme } = useSettings()
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0b0d10' : '#ffffff')
  }, [theme])
}

function SearchBar({ onDone, autoFocus }: { onDone?: () => void; autoFocus?: boolean }) {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const nav = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = q.trim()
    if (!v) return
    // Coller un lien YouTube ouvre directement la vidéo (ou le Short).
    const short = v.match(/shorts\/([\w-]{11})/)
    const m = v.match(/(?:youtu\.be\/|v=|embed\/|live\/)([\w-]{11})/)
    nav(short ? `/shorts?v=${short[1]}` : m ? `/watch/${m[1]}` : `/search?q=${encodeURIComponent(v)}`)
    ref.current?.blur()
    onDone?.()
  }
  return (
    <form className="search" onSubmit={submit} role="search">
      <Icon name="search" size={18} />
      <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher ou coller un lien" aria-label="Rechercher" enterKeyHint="search" />
      {q && (
        <button type="button" className="icon-btn small" onClick={() => setQ('')} aria-label="Effacer">
          <Icon name="close" size={16} />
        </button>
      )}
    </form>
  )
}

function Account() {
  const { user, available, signIn, signOut, error } = useAuth()
  if (user)
    return (
      <div className="account">
        <button className="avatar-btn" aria-label="Compte">
          <img src={user.picture} alt="" referrerPolicy="no-referrer" />
        </button>
        <div className="account-menu">
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <Link to="/settings">Réglages</Link>
          <button onClick={signOut}>Se déconnecter</button>
        </div>
      </div>
    )
  if (available)
    return (
      <button className="btn small" onClick={signIn} title={error ?? ''}>
        <Icon name="user" size={16} /> Connexion
      </button>
    )
  return null
}

const NAV = [
  { to: '/', icon: 'home', label: 'Accueil', end: true },
  { to: '/shorts', icon: 'shorts', label: 'Shorts' },
  { to: '/subscriptions', icon: 'subs', label: 'Abonnements' },
  { to: '/library', icon: 'library', label: 'Bibliothèque' },
]

export function Layout({ children }: { children: ReactNode }) {
  useTheme()
  const { all } = useAllSubs()
  const { showShorts } = useSettings()
  const [searching, setSearching] = useState(false)
  const { pathname } = useLocation()
  const immersive = pathname.startsWith('/shorts')
  const nav = NAV.filter((n) => showShorts || n.to !== '/shorts')

  useEffect(() => setSearching(false), [pathname])

  return (
    <div className={`app ${immersive ? 'immersive' : ''}`}>
      <header className={`topbar ${searching ? 'searching' : ''}`}>
        {searching ? (
          <>
            <button className="icon-btn" onClick={() => setSearching(false)} aria-label="Retour">
              <Icon name="back" />
            </button>
            <SearchBar autoFocus onDone={() => setSearching(false)} />
          </>
        ) : (
          <>
            <Logo />
            <div className="search-desktop">
              <SearchBar />
            </div>
            <div className="topbar-actions">
              <button className="icon-btn mobile-only" onClick={() => setSearching(true)} aria-label="Rechercher">
                <Icon name="search" />
              </button>
              <Link to="/settings" className="icon-btn" aria-label="Réglages">
                <Icon name="settings" />
              </Link>
              <Account />
            </div>
          </>
        )}
      </header>

      <nav className="sidebar">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <Icon name={n.icon} /> <span>{n.label}</span>
          </NavLink>
        ))}
        <NavLink to="/trending">
          <Icon name="trend" /> <span>Tendances</span>
        </NavLink>
        {all.length > 0 && (
          <>
            <h4>Chaînes</h4>
            {all.slice(0, 50).map((c) => (
              <NavLink key={c.id} to={`/channel/${c.id}`} className="chan">
                <Avatar src={c.thumbnail} name={c.title} size={24} />
                <span className="ellipsis">{c.title}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <main className="content">{children}</main>

      <nav className="tabbar">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <Icon name={n.icon} size={24} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Avatar de chaîne : image si connue, sinon initiale sur une couleur stable. */
export function Avatar({ src, name, size = 36 }: { src?: string; name: string; size?: number }) {
  const [broken, setBroken] = useState(false)
  if (src && !broken)
    return <img className="avatar" src={src} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360
  return (
    <span className="avatar initial" style={{ width: size, height: size, background: `hsl(${h} 45% 38%)`, fontSize: size * 0.42 }}>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  )
}
