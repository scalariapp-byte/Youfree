import { useState } from 'react'
import { VideoCard, VideoGrid } from '../components/VideoCard'
import { ago } from '../lib/format'
import { clearHistory, removeFromHistory, toggleWatchLater, useHistory, useWatchLater } from '../lib/storage'

type Tab = 'history' | 'later'

export function Library() {
  const history = useHistory()
  const later = useWatchLater()
  const [tab, setTab] = useState<Tab>('history')
  const tabs: [Tab, string][] = [
    ['history', 'Historique'],
    ['later', `Plus tard (${later.length})`],
  ]

  return (
    <div className="page">
      <div className="chips">
        {tabs.map(([t, label]) => (
          <button key={t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
        {tab === 'history' && history.length > 0 && (
          <button className="chip" onClick={() => confirm('Effacer tout l’historique ?') && clearHistory()}>
            Effacer
          </button>
        )}
      </div>
      {tab === 'history' &&
        (history.length ? (
          <VideoGrid>
            {history.map((h) => (
              <VideoCard key={h.id} video={h} progress={h.position} subtitle={`Vu ${ago(h.watchedAt)}`} onRemove={() => removeFromHistory(h.id)} />
            ))}
          </VideoGrid>
        ) : (
          <p className="muted">Historique vide. Il est stocké uniquement sur cet appareil.</p>
        ))}
      {tab === 'later' &&
        (later.length ? (
          <VideoGrid>
            {later.map((v) => (
              <VideoCard key={v.id} video={v} subtitle="" onRemove={() => toggleWatchLater(v)} />
            ))}
          </VideoGrid>
        ) : (
          <p className="muted">Rien pour l’instant. Clique ⏱ sur une vidéo pour la garder ici.</p>
        ))}
    </div>
  )
}
