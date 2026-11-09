import { THEMES } from '../lib/i18n'
export { THEMES }

export function ThemeChips({ value, onChange }: { value?: string; onChange: (id?: string) => void }) {
  return (
    <div className="chips sticky-chips">
      {THEMES.map(([label, id]) => {
        const v = id === 'all' ? undefined : id
        return (
          <button key={id} className={`chip ${value === v ? 'on' : ''}`} onClick={() => onChange(v)}>
            {label}
          </button>
        )
      })}
    </div>
  )
}
