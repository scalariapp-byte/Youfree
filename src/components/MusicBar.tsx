import { useState } from 'react'
import { getQueue, next, playAt, prev, seek, stopMusic, toggle, useMusic } from '../lib/music'
import { duration } from '../lib/format'
import { AddToPlaylist } from './AddToPlaylist'
import { Icon } from './Icon'

/** Mini-lecteur musique, au-dessus de la barre d'onglets, sur toutes les pages. */
export function MusicBar() {
  const m = useMusic()
  const [full, setFull] = useState(false)
  const [add, setAdd] = useState(false)
  if (!m.track) return null
  if (full) {
    const { queue, index } = getQueue()
    return (
      <div className="now-playing">
        <button className="icon-btn np-close" onClick={() => setFull(false)} aria-label="Réduire">
          <Icon name="back" />
        </button>
        <div className="np-art" style={{ backgroundImage: `url(${m.track.thumbnail})` }} />
        <img className="np-cover" src={m.track.thumbnail.replace(/=w\d+-h\d+/, '=w720-h720')} alt="" />
        <h2>{m.track.title}</h2>
        <p className="muted">
          {m.error || (m.track.artistId ? <a href={`#/artist/${m.track.artistId}`} onClick={() => setFull(false)}>{m.track.artist} ›</a> : m.track.artist)}
        </p>
        <button className="btn ghost small" onClick={() => setAdd(true)}>
          <Icon name="plus" size={16} /> Ajouter à une playlist
        </button>
        <AddToPlaylist track={m.track} open={add} onClose={() => setAdd(false)} />
        <input className="np-seek" type="range" min={0} max={m.duration || 1} step={0.5} value={m.time} onChange={(e) => seek(Number(e.target.value))} />
        <div className="np-times">
          <span>{duration(Math.floor(m.time)) || '0:00'}</span>
          <span>{duration(Math.floor(m.duration))}</span>
        </div>
        <div className="np-controls">
          <button className="icon-btn" onClick={prev} aria-label="Précédent">
            <Icon name="back" size={30} />
          </button>
          <button className="icon-btn np-play" onClick={toggle} aria-label={m.playing ? 'Pause' : 'Lecture'}>
            <Icon name={m.playing ? 'pause' : 'play'} size={34} fill />
          </button>
          <button className="icon-btn" onClick={next} aria-label="Suivant">
            <Icon name="fwd" size={30} />
          </button>
        </div>
        <h4>À suivre</h4>
        <div className="track-list">
          {queue.slice(index + 1, index + 30).map((t, i) => (
            <button key={t.id} className="track" onClick={() => playAt(index + 1 + i)}>
              <img src={t.thumbnail} alt="" loading="lazy" />
              <span>
                <strong>{t.title}</strong>
                <small>{t.artist}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="music-bar">
      <div className="music-progress" onClick={(e) => m.duration && seek((e.nativeEvent.offsetX / e.currentTarget.clientWidth) * m.duration)}>
        <span style={{ width: `${m.duration ? (m.time / m.duration) * 100 : 0}%` }} />
      </div>
      <img src={m.track.thumbnail} alt="" />
      <span className="music-meta" onClick={() => setFull(true)}>
        <strong>{m.track.title}</strong>
        <small className={m.error ? 'err' : ''}>{m.error || (m.loading ? 'Chargement…' : m.track.artist)}</small>
      </span>
      <button className="icon-btn" onClick={prev} aria-label="Précédent">
        <Icon name="back" />
      </button>
      <button className="icon-btn play" onClick={toggle} aria-label={m.playing ? 'Pause' : 'Lecture'}>
        <Icon name={m.playing ? 'pause' : 'play'} fill />
      </button>
      <button className="icon-btn" onClick={next} aria-label="Suivant">
        <Icon name="fwd" />
      </button>
      <button className="icon-btn small" onClick={stopMusic} aria-label="Fermer">
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}
