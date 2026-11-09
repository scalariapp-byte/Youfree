import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAllSubs } from '../lib/useSubs'
import { useSettings } from '../lib/storage'
import { Icon } from './Icon'
import { UpdateBanner } from './UpdateBanner'
import { suggest } from '../lib/youtube'

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
export function useTheme() {
  const { theme, accent, density } = useSettings()
  useEffect(() => {
    const st = document.documentElement.style
    st.setProperty('--accent', accent)
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(accent.slice(i, i + 2), 16))
    st.setProperty('--accent-text', 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#03201c' : '#ffffff')
    document.documentElement.dataset.density = density
  }, [accent, density])
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0b0d10' : '#ffffff')
  }, [theme])
}

const RECENT = 'youfree:recentSearches'
const getRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT) || '[]')
  } catch {
    return []
  }
}
const addRecent = (q: string) => {
  try {
    localStorage.setItem(RECENT, JSON.stringify([q, ...getRecent().filter((x) => x !== q)].slice(0, 12)))
  } catch {
    /* ignore */
  }
}

function SearchBar({ onDone, autoFocus }: { onDone?: () => void; autoFocus?: boolean }) {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [open, setOpen] = useState(false)
  const [sugg, setSugg] = useState<string[]>([])
  const [sel, setSel] = useState(-1)
  const nav = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])
  // Suggestions pendant la frappe (anti-rebond 120 ms).
  useEffect(() => {
    setSel(-1)
    if (!q.trim()) return setSugg([])
    const t = setTimeout(() => suggest(q).then(setSugg, () => setSugg([])), 120)
    return () => clearTimeout(t)
  }, [q])

  const go = (v: string) => {
    v = v.trim()
    if (!v) return
    const short = v.match(/shorts\/([\w-]{11})/)
    const m = v.match(/(?:youtu\.be\/|v=|embed\/|live\/)([\w-]{11})/)
    if (!short && !m) addRecent(v)
    setQ(v)
    setOpen(false)
    nav(short ? `/shorts?v=${short[1]}` : m ? `/watch/${m[1]}` : `/search?q=${encodeURIComponent(v)}`)
    ref.current?.blur()
    onDone?.()
  }
  const list = q.trim() ? [...getRecent().filter((r) => r.toLowerCase().startsWith(q.toLowerCase()) && r !== q).slice(0, 3), ...sugg.filter((x) => x !== q)].slice(0, 10) : getRecent()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    go(sel >= 0 ? list[sel] : q)
  }
  return (
    <form className="search" onSubmit={submit} role="search">
      <Icon name="search" size={18} />
      <input
        ref={ref}
        value={q}
        onChange={(e) => (setQ(e.target.value), setOpen(true))}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') (e.preventDefault(), setSel((i) => Math.min(i + 1, list.length - 1)))
          if (e.key === 'ArrowUp') (e.preventDefault(), setSel((i) => Math.max(i - 1, -1)))
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Rechercher ou coller un lien"
        aria-label="Rechercher"
        enterKeyHint="search"
        autoComplete="off"
      />
      {q && (
        <button type="button" className="icon-btn small" onClick={() => (setQ(''), ref.current?.focus())} aria-label="Effacer">
          <Icon name="close" size={16} />
        </button>
      )}
      {open && list.length > 0 && (
        <ul className="suggest">
          {list.map((x, i) => (
            <li key={x} className={i === sel ? 'sel' : ''} onMouseDown={(e) => (e.preventDefault(), go(x))}>
              <Icon name={getRecent().includes(x) ? 'history' : 'search'} size={16} />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}

const NAV = [
  { to: '/', icon: 'home', label: 'Accueil', end: true },
  { to: '/shorts', icon: 'shorts', label: 'Shorts' },
  { to: '/subscriptions', icon: 'subs', label: 'Abonnements' },
  { to: '/library', icon: 'library', label: 'Bibliothèque' },
]

export function Layout({ children }: { children: ReactNode }) {

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
            </div>
          </>
        )}
      </header>

      <nav className="sidebar">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} viewTransition>
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

      <main className="content">
        <UpdateBanner />
        {children}
      </main>

      <nav className="tabbar">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} viewTransition>
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
