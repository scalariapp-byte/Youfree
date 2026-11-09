import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { ErrorBox } from '../components/ErrorBox'
import { Icon } from '../components/Icon'
import { playTracks, useMusic } from '../lib/music'
import { AddToPlaylist } from '../components/AddToPlaylist'
import { createPlaylist, deletePlaylist, toggleInPlaylist, usePlaylists } from '../lib/storage'
import type { Track } from '../lib/innertube'

const music = () => import('../lib/innertube')

function TrackRow({ t, list, i, onAdd, onRemove }: { t: Track; list: Track[]; i: number; onAdd?: (t: Track) => void; onRemove?: () => void }) {
  const m = useMusic()
  return (
    <div className={`track ${m.track?.id === t.id ? 'on' : ''}`}>
      <button className="track-main" onClick={() => playTracks(list, i)}>
        <img src={t.thumbnail} alt="" loading="lazy" />
        <span>
          <strong>{t.title}</strong>
          <small>{t.artist}</small>
        </span>
      </button>
      {t.artistId && (
        <Link to={`/artist/${t.artistId}`} className="icon-btn small" aria-label="Artiste">
          <Icon name="user" size={16} />
        </Link>
      )}
      {t.duration && <small className="muted">{t.duration}</small>}
      {onAdd && (
        <button className="icon-btn small" onClick={() => onAdd(t)} aria-label="Ajouter à une playlist">
          <Icon name="plus" size={18} />
        </button>
      )}
      {onRemove && (
        <button className="icon-btn small" onClick={onRemove} aria-label="Retirer">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}

export function Music() {
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState<Track | null>(null)
  const [openList, setOpenList] = useState<string | null>(null)
  const lists = usePlaylists()
  const pl = lists.find((p) => p.id === openList)
  const home = useAsync(async () => (await music()).musicHome(), [], 'music:home')
  const explore = useAsync(async () => (await music()).musicExplore(), [], 'music:explore')
  const nav = useNavigate()
  const res = useAsync(async () => (q ? (await music()).musicSearch(q) : null), [q], q ? `music:s:${q}` : undefined)
  return (
    <div className="page music">
      <h1 className="page-title">Musique</h1>
      <form className="music-search" onSubmit={(e) => (e.preventDefault(), setQ((e.currentTarget.elements[0] as HTMLInputElement).value.trim()))}>
        <Icon name="search" size={18} />
        <input placeholder="Titres, artistes, albums…" enterKeyHint="search" />
      </form>
      <AddToPlaylist track={adding} open={!!adding} onClose={() => setAdding(null)} />
      {pl ? (
        <section>
          <button className="btn ghost small" onClick={() => setOpenList(null)}>
            <Icon name="back" size={16} /> Playlists
          </button>
          <div className="pl-head">
            <h2>{pl.name}</h2>
            <span className="muted">{pl.tracks.length} titres</span>
            {pl.tracks.length > 0 && (
              <button className="btn" onClick={() => playTracks(pl.tracks, 0)}>
                <Icon name="play" size={16} fill /> Lire
              </button>
            )}
            <button className="btn ghost" onClick={() => (deletePlaylist(pl.id), setOpenList(null))}>
              <Icon name="trash" size={16} /> Supprimer
            </button>
          </div>
          <div className="track-list">
            {pl.tracks.map((t, i) => (
              <TrackRow key={t.id} t={t} list={pl.tracks} i={i} onRemove={() => toggleInPlaylist(pl.id, t)} />
            ))}
          </div>
        </section>
      ) : q ? (
        res.error ? <ErrorBox error={res.error} /> : !res.data ? <span className="spinner" /> : (
          <div className="track-list">
            {res.data.map((t, i) => (
              <TrackRow key={t.id} t={t} list={res.data!} i={i} onAdd={setAdding} />
            ))}
          </div>
        )
      ) : home.error ? (
        <ErrorBox error={home.error} />
      ) : !home.data ? (
        <span className="spinner" />
      ) : (
        <>
        <section>
          <h2>Mes playlists</h2>
          <div className="album-row">
            <button className="album" onClick={() => { const n = prompt('Nom de la playlist'); if (n?.trim()) createPlaylist(n.trim()) }}>
              <span className="pl-cover new"><Icon name="plus" size={36} /></span>
              <strong>Nouvelle playlist</strong>
            </button>
            {lists.map((p) => (
              <button key={p.id} className="album" onClick={() => setOpenList(p.id)}>
                {p.tracks[0] ? <img src={p.tracks[0].thumbnail} alt="" /> : <span className="pl-cover"><Icon name="music" size={36} /></span>}
                <strong>{p.name}</strong>
                <small>{p.tracks.length} titres</small>
              </button>
            ))}
          </div>
        </section>
        {[...home.data, ...(explore.data ?? [])].map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            <div className="album-row">
              {s.items.map((t, i) => (
                <div key={t.id} className="album">
                  <button className="album-play" onClick={() => playTracks(s.items, i)}>
                    <img src={t.thumbnail} alt="" loading="lazy" />
                  </button>
                  <strong>{t.title}</strong>
                  <small onClick={() => t.artistId && nav(`/artist/${t.artistId}`)} className={t.artistId ? 'artist-link' : ''}>
                    {t.artist}
                    <button className="link" onClick={() => setAdding(t)} aria-label="Ajouter à une playlist">
                      {' '}
                      +
                    </button>
                  </small>
                </div>
              ))}
            </div>
          </section>
        ))}
        </>
      )}
    </div>
  )
}
