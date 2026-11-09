import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { ErrorBox } from '../components/ErrorBox'
import { playTracks } from '../lib/music'

/** Page artiste : photo, bio, statistiques, titres et albums. */
export function Artist() {
  const { id = '' } = useParams()
  const [more, setMore] = useState(false)
  const a = useAsync(async () => (await import('../lib/innertube')).musicArtist(id), [id], `artist:${id}`)
  if (a.error) return <div className="page"><ErrorBox error={a.error} /></div>
  if (!a.data) return <div className="page"><span className="spinner" /></div>
  const d = a.data
  return (
    <div className="page artist">
      <div className="artist-hero" style={{ backgroundImage: `url(${d.thumbnail})` }}>
        <h1>{d.name}</h1>
        <div className="artist-stats">
          {d.stats.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
      {d.bio && (
        <p className={`artist-bio ${more ? 'open' : ''}`} onClick={() => setMore(!more)}>
          {d.bio}
        </p>
      )}
      {d.sections.map((s) => (
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
      ))}
    </div>
  )
}
