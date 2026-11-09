import { useEffect, useState } from 'react'
import { APK, BUILD, useUpdate } from '../lib/update'

/** Bannière : nouvelle version disponible, ou confirmation après mise à jour. */
export function UpdateBanner() {
  const u = useUpdate()
  const [hidden, setHidden] = useState(0)
  const [justUpdated, setJustUpdated] = useState(false)
  useEffect(() => {
    if (!BUILD) return
    try {
      const seen = Number(localStorage.getItem('youfree:build') ?? 0)
      if (seen && seen < BUILD) setJustUpdated(true)
      localStorage.setItem('youfree:build', String(BUILD))
    } catch {
      /* ignore */
    }
  }, [])
  if (u.latest > BUILD && hidden !== u.latest)
    return (
      <div className="update-banner">
        <div>
          <strong>Nouvelle version disponible</strong>
          <small>
            Version {u.latest} (tu as la {BUILD}){u.notes ? ` · ${u.notes}` : ''}
          </small>
        </div>
        <a className="btn small" href={APK}>
          Mettre à jour
        </a>
        <button className="icon-btn small" onClick={() => setHidden(u.latest)} aria-label="Plus tard">
          ✕
        </button>
      </div>
    )
  if (justUpdated)
    return (
      <div className="update-banner ok" onClick={() => setJustUpdated(false)}>
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
