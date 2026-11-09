import { next, prev, seek, stopMusic, toggle, useMusic } from '../lib/music'
import { Icon } from './Icon'

/** Mini-lecteur musique, au-dessus de la barre d'onglets, sur toutes les pages. */
export function MusicBar() {
  const m = useMusic()
  if (!m.track) return null
  return (
    <div className="music-bar">
      <div className="music-progress" onClick={(e) => m.duration && seek((e.nativeEvent.offsetX / e.currentTarget.clientWidth) * m.duration)}>
        <span style={{ width: `${m.duration ? (m.time / m.duration) * 100 : 0}%` }} />
      </div>
      <img src={m.track.thumbnail} alt="" />
      <span className="music-meta">
        <strong>{m.track.title}</strong>
        <small>{m.loading ? 'Chargement…' : m.track.artist}</small>
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
