import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useAllSubs } from '../lib/useSubs'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Accueil Youfree">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden>
        <rect width="64" height="64" rx="16" fill="var(--accent)" />
        <circle cx="32" cy="32" r="17" fill="none" stroke="#fff" strokeWidth="5" />
        <path d="M27 23v18l14-9z" fill="#fff" />
      </svg>
      <span>Youfree</span>
    </Link>
  )
}

function SearchBar() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const nav = useNavigate()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = q.trim()
    if (!v) return
    // Coller un lien YouTube ouvre directement la vidéo.
    const m = v.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)
    nav(m ? `/watch/${m[1]}` : `/search?q=${encodeURIComponent(v)}`)
  }
  return (
    <form className="search" onSubmit={submit} role="search">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher ou coller un lien" aria-label="Rechercher" />
      <button type="submit" aria-label="Lancer la recherche">
        ⌕
      </button>
    </form>
  )
}

function Account() {
  const { user, available, signIn, signOut, error } = useAuth()
  if (user)
    return (
      <div className="account">
        <img src={user.picture} alt="" referrerPolicy="no-referrer" />
        <div className="account-menu">
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button onClick={signOut}>Se déconnecter</button>
        </div>
      </div>
    )
  return (
    <div className="account">
      {available ? (
        <button className="btn" onClick={signIn} title={error ?? ''}>
          Se connecter
        </button>
      ) : (
        <Link to="/settings" className="btn ghost">
          Sans compte
        </Link>
      )}
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { all } = useAllSubs()
  const close = () => setOpen(false)
  return (
    <div className={`app ${open ? 'nav-open' : ''}`}>
      <header className="topbar">
        <button className="icon-btn menu" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>
        <Logo />
        <SearchBar />
        <Account />
      </header>
      <nav className="sidebar" onClick={close}>
        <NavLink to="/" end>
          <span>⌂</span> Accueil
        </NavLink>
        <NavLink to="/subscriptions">
          <span>▤</span> Abonnements
        </NavLink>
        <NavLink to="/trending">
          <span>↗</span> Tendances
        </NavLink>
        <NavLink to="/library">
          <span>☰</span> Bibliothèque
        </NavLink>
        <NavLink to="/settings">
          <span>⚙</span> Réglages
        </NavLink>
        {all.length > 0 && (
          <>
            <h4>Chaînes</h4>
            {all.slice(0, 40).map((c) => (
              <NavLink key={c.id} to={`/channel/${c.id}`} className="chan">
                <img src={c.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
                <span className="ellipsis">{c.title}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="scrim" onClick={close} />
      <main className="content">{children}</main>
    </div>
  )
}
