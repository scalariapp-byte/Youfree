import { useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { ErrorBox } from '../components/ErrorBox'
import { Icon } from '../components/Icon'
import { playTracks, useMusic } from '../lib/music'
import type { Track } from '../lib/innertube'

const music = () => import('../lib/innertube')

function TrackRow({ t, list, i }: { t: Track; list: Track[]; i: number }) {
  const m = useMusic()
  return (
    <button className={`track ${m.track?.id === t.id ? 'on' : ''}`} onClick={() => playTracks(list, i)}>
      <img src={t.thumbnail} alt="" loading="lazy" />
      <span>
        <strong>{t.title}</strong>
        <small>{t.artist}</small>
      </span>
      {t.duration && <small className="muted">{t.duration}</small>}
    </button>
  )
}

export function Music() {
  const [q, setQ] = useState('')
  const home = useAsync(async () => (await music()).musicHome(), [], 'music:home')
  const res = useAsync(async () => (q ? (await music()).musicSearch(q) : null), [q], q ? `music:s:${q}` : undefined)
  return (
    <div className="page music">
      <h1 className="page-title">Musique</h1>
      <form className="music-search" onSubmit={(e) => (e.preventDefault(), setQ((e.currentTarget.elements[0] as HTMLInputElement).value.trim()))}>
        <Icon name="search" size={18} />
        <input placeholder="Titres, artistes, albums…" enterKeyHint="search" />
      </form>
      {q ? (
        res.error ? <ErrorBox error={res.error} /> : !res.data ? <span className="spinner" /> : (
          <div className="track-list">
            {res.data.map((t, i) => (
              <TrackRow key={t.id} t={t} list={res.data!} i={i} />
            ))}
          </div>
        )
      ) : home.error ? (
        <ErrorBox error={home.error} />
      ) : !home.data ? (
        <span className="spinner" />
      ) : (
        home.data.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            <div className="album-row">
              {s.items.map((t, i) => (
                <button key={t.id} className="album" onClick={() => playTracks(s.items, i)}>
                  <img src={t.thumbnail} alt="" loading="lazy" />
                  <strong>{t.title}</strong>
                  <small>{t.artist}</small>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
