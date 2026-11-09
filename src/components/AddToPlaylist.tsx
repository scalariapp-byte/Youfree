import { useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { createPlaylist, toggleInPlaylist, usePlaylists, type PlaylistTrack } from '../lib/storage'

/** Ajouter / retirer un titre de ses playlists, ou en créer une. */
export function AddToPlaylist({ track, open, onClose }: { track: PlaylistTrack | null; open: boolean; onClose: () => void }) {
  const lists = usePlaylists()
  const [name, setName] = useState('')
  if (!track) return null
  return (
    <Sheet open={open} onClose={onClose} title="Ajouter à une playlist">
      <form
        className="music-search"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          toggleInPlaylist(createPlaylist(name.trim()).id, track)
          setName('')
        }}
      >
        <Icon name="plus" size={18} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle playlist" />
      </form>
      <div className="sheet-list">
        {lists.map((p) => {
          const inside = p.tracks.some((t) => t.id === track.id)
          return (
            <button key={p.id} onClick={() => toggleInPlaylist(p.id, track)}>
              <Icon name={inside ? 'check' : 'music'} /> {p.name}
              <small>{p.tracks.length} titres</small>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
