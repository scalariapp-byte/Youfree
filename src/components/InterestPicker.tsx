import { useState } from 'react'
import { GROUPS, INTERESTS } from '../lib/interests'
import { Icon } from './Icon'

/** Choix précis des centres d'intérêt : recherche, groupes, tout cocher par groupe. */
export function InterestPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState('')
  const sel = new Set(value)
  const toggle = (k: string) => onChange(sel.has(k) ? value.filter((x) => x !== k) : [...value, k])
  const list = INTERESTS.filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="picker">
      <div className="picker-top">
        <div className="music-search">
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un centre d’intérêt" />
        </div>
        <small className="muted">
          {value.length} sélectionné{value.length > 1 ? 's' : ''} sur {INTERESTS.length}
          {value.length > 0 && (
            <button className="link" onClick={() => onChange([])}>
              {' '}
              · tout effacer
            </button>
          )}
        </small>
      </div>
      {GROUPS.map((g) => {
        const items = list.filter((i) => i.group === g)
        if (!items.length) return null
        const all = items.every((i) => sel.has(i.key))
        return (
          <div key={g} className="picker-group">
            <div className="picker-head">
              <h4>{g}</h4>
              <button
                className="link"
                onClick={() => onChange(all ? value.filter((k) => !items.some((i) => i.key === k)) : [...new Set([...value, ...items.map((i) => i.key)])])}
              >
                {all ? 'Tout retirer' : 'Tout choisir'}
              </button>
            </div>
            <div className="interest-grid left">
              {items.map((i) => (
                <button key={i.key} className={`interest ${sel.has(i.key) ? 'on' : ''}`} onClick={() => toggle(i.key)}>
                  {sel.has(i.key) && <Icon name="check" size={16} />}
                  {i.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
