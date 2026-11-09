import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { closeShare, listApps, systemShare, Targets, useShareRequest, type ShareApp } from '../lib/share'
import { saveSettings, useSettings } from '../lib/storage'

/** Feuille de partage : tes applis favorites seulement, modifiables. */
export function ShareSheet() {
  const req = useShareRequest()
  const { shareApps } = useSettings()
  const [apps, setApps] = useState<ShareApp[]>([])
  const [edit, setEdit] = useState(false)
  useEffect(() => {
    if (req) listApps().then(setApps)
    else setEdit(false)
  }, [req])
  if (!req) return null
  const fav = shareApps.map((p) => apps.find((a) => a.pkg === p)).filter((a): a is ShareApp => !!a)
  const text = `${req.title}\n${req.url}`
  const toggle = (pkg: string) => saveSettings({ shareApps: shareApps.includes(pkg) ? shareApps.filter((x) => x !== pkg) : [...shareApps, pkg] })
  return (
    <Sheet open onClose={closeShare} title={edit ? 'Choisis tes applis de partage' : 'Partager'}>
      {edit ? (
        <div className="share-grid">
          {apps.map((a) => (
            <button key={a.pkg} className={`share-app ${shareApps.includes(a.pkg) ? 'on' : ''}`} onClick={() => toggle(a.pkg)}>
              <img src={a.icon} alt="" />
              <span>{a.label}</span>
              {shareApps.includes(a.pkg) && <i className="share-check">✓</i>}
            </button>
          ))}
        </div>
      ) : (
        <div className="share-grid">
          {fav.map((a) => (
            <button key={a.pkg} className="share-app" onClick={() => (Targets.share({ pkg: a.pkg, text }).catch(() => systemShare(req.url, req.title)), closeShare())}>
              <img src={a.icon} alt="" />
              <span>{a.label}</span>
            </button>
          ))}
          <button className="share-app" onClick={() => (systemShare(req.url, req.title), closeShare())}>
            <span className="share-ico">
              <Icon name="dots" />
            </span>
            <span>Autres…</span>
          </button>
          <button className="share-app" onClick={() => (navigator.clipboard?.writeText(req.url), closeShare())}>
            <span className="share-ico">
              <Icon name="link" />
            </span>
            <span>Copier</span>
          </button>
        </div>
      )}
      {apps.length > 0 && (
        <button className="btn ghost small share-edit" onClick={() => setEdit(!edit)}>
          {edit ? 'Terminé' : fav.length ? 'Modifier mes applis' : 'Choisir mes applis'}
        </button>
      )}
    </Sheet>
  )
}
