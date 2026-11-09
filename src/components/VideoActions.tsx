import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { getLiked, getWatchLater, toggleBlock, toggleLike, toggleWatchLater, type StoredVideo } from '../lib/storage'
import { download, listQualities } from '../lib/download'
import { isNative } from '../lib/nativeFetch'

/** Choix de la qualité puis téléchargement avec progression. */
export function DownloadSheet({ video, open, onClose }: { video: StoredVideo; open: boolean; onClose: () => void }) {
  const [opts, setOpts] = useState<{ height: number; ext: string }[] | null>(null)
  const [state, setState] = useState<{ p: number; step: string } | null>(null)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!open) return
    setMsg('')
    listQualities(video.id).then(setOpts, (e) => setMsg((e as Error).message))
  }, [open, video.id])
  const go = (h: number) => {
    setState({ p: 0, step: 'Préparation' })
    download(video.id, video.title, h, (p, step) => setState({ p, step })).then(
      (r) => (setState(null), setMsg(`Enregistré dans ${r.path}`)),
      (e) => (setState(null), setMsg((e as Error).message)),
    )
  }
  return (
    <Sheet open={open} onClose={state ? () => {} : onClose} title="Télécharger">
      {!isNative() ? (
        <p className="muted">Disponible dans l’application Android.</p>
      ) : state ? (
        <div className="dl-progress">
          <div className="bar">
            <span style={{ width: `${state.p}%` }} />
          </div>
          <small>
            {state.step} · {state.p} %
          </small>
        </div>
      ) : (
        <div className="sheet-list">
          {!opts && !msg && <span className="spinner" />}
          {opts?.map((o) => (
            <button key={o.height} onClick={() => go(o.height)}>
              <Icon name="download" />
              <span>
                {o.height >= 2160 ? '4K' : o.height >= 1440 ? '2K' : 'HD'} · {o.height}p
              </span>
              <small>{o.ext.toUpperCase()}</small>
            </button>
          ))}
        </div>
      )}
      {msg && <p className="muted">{msg}</p>}
    </Sheet>
  )
}

/** Menu ⋮ d'une vidéo : j'aime, plus tard, télécharger, masquer la chaîne, lien. */
export function VideoMenu({ video, open, onClose }: { video: StoredVideo; open: boolean; onClose: () => void }) {
  const [dl, setDl] = useState(false)
  const liked = getLiked().some((x) => x.id === video.id)
  const later = getWatchLater().some((x) => x.id === video.id)
  const act = (f: () => void) => () => (f(), onClose())
  return (
    <>
      <Sheet open={open} onClose={onClose}>
        <div className="sheet-list">
          <button onClick={act(() => toggleLike(video))}>
            <Icon name="like" fill={liked} /> {liked ? 'Je n’aime plus' : 'J’aime'}
          </button>
          <button onClick={act(() => toggleWatchLater(video))}>
            <Icon name={later ? 'check' : 'clock'} /> {later ? 'Retirer de « Plus tard »' : 'Regarder plus tard'}
          </button>
          <button onClick={() => (onClose(), setDl(true))}>
            <Icon name="download" /> Télécharger
          </button>
          <button onClick={act(() => navigator.clipboard?.writeText(`https://youtu.be/${video.id}`))}>
            <Icon name="link" /> Copier le lien
          </button>
          {video.channelTitle && (
            <button className="danger" onClick={act(() => toggleBlock({ id: video.channelId, title: video.channelTitle, thumbnail: '' }))}>
              <Icon name="block" /> Ne plus voir « {video.channelTitle} »
            </button>
          )}
        </div>
      </Sheet>
      <DownloadSheet video={video} open={dl} onClose={() => setDl(false)} />
    </>
  )
}
