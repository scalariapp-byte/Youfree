// Vérifie à l'ouverture si un APK plus récent est publié, et annonce la mise à jour installée.
import { useEffect, useState } from 'react'
import { isNative } from '../lib/nativeFetch'

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
    fetch(RELEASE_API)
      .then((r) => r.json())
      .then((rel) => {
        const m = String(rel.body ?? '').match(/build\s+(\d+)/i)
        const notes = String(rel.body ?? '').split(/\n/).find((l) => l.startsWith('Nouveautés')) ?? ''
        if (m && Number(m[1]) > BUILD) setLatest({ build: Number(m[1]), notes: notes.replace(/^Nouveautés\s*:\s*/, '') })
      })
      .catch(() => {})
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
