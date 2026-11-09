// Vérifie à l'ouverture si un APK plus récent est publié, et annonce la mise à jour installée.
import { useEffect, useState } from 'react'
import { isNative, localFetch } from '../lib/nativeFetch'

const BUILD = Number(import.meta.env.VITE_BUILD ?? 0)
const RELEASE_API = 'https://api.github.com/repos/scalariapp-byte/Youtmusic/releases/tags/android-latest'
const APK = 'https://github.com/scalariapp-byte/Youtmusic/releases/download/android-latest/youfree.apk'

export function UpdateBanner() {
  const [latest, setLatest] = useState<{ build: number; notes: string } | null>(null)
  const [justUpdated, setJustUpdated] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!BUILD) return
    try {
      const seen = Number(localStorage.getItem('youfree:build') ?? 0)
      if (seen && seen < BUILD) setJustUpdated(true)
      localStorage.setItem('youfree:build', String(BUILD))
    } catch {
      /* ignore */
    }
    if (!isNative()) return
    // Vérifie au lancement, à chaque retour dans l'appli et toutes les 30 min (requête native).
    const check = () =>
      localFetch(`${RELEASE_API}?t=${Date.now()}`, { headers: { Accept: 'application/vnd.github+json' } })
        .then((r) => r.text())
        .then((txt) => {
          const rel = JSON.parse(txt)
          const m = String(rel.body ?? '').match(/build\s+(\d+)/i)
          const notes = String(rel.body ?? '').split(/\n/).find((l) => l.startsWith('Nouveautés')) ?? ''
          if (m && Number(m[1]) > BUILD) (setLatest({ build: Number(m[1]), notes: notes.replace(/^Nouveautés\s*:\s*/, '') }), setHidden(false))
        })
        .catch(() => {})
    check()
    const onVis = () => !document.hidden && check()
    document.addEventListener('visibilitychange', onVis)
    const t = setInterval(check, 30 * 60_000)
    return () => (document.removeEventListener('visibilitychange', onVis), clearInterval(t))
  }, [])

  if (hidden) return null
  if (latest)
    return (
      <div className="update-banner">
        <div>
          <strong>Nouvelle version disponible</strong>
          <small>
            Version {latest.build} (tu as la {BUILD}){latest.notes ? ` · ${latest.notes}` : ''}
          </small>
        </div>
        <a className="btn small" href={APK}>
          Mettre à jour
        </a>
        <button className="icon-btn small" onClick={() => setHidden(true)} aria-label="Plus tard">
          ✕
        </button>
      </div>
    )
  if (justUpdated)
    return (
      <div className="update-banner ok" onClick={() => setHidden(true)}>
        <div>
          <strong>Youtmusic est à jour</strong>
          <small>Version {BUILD} installée.</small>
        </div>
        <button className="icon-btn small" aria-label="Fermer">
          ✕
        </button>
      </div>
    )
  return null
}
