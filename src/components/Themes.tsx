// Thèmes proposés (identifiants de catégorie YouTube). Pas de « Jeux vidéo » (20).
export const THEMES: [string, string | undefined][] = [
  ['Tout', undefined],
  ['Musique', '10'],
  ['Actualités', '25'],
  ['Science & tech', '28'],
  ['Éducation', '27'],
  ['Sport', '17'],
  ['Divertissement', '24'],
  ['Humour', '23'],
  ['Films', '1'],
  ['Cuisine & vie', '26'],
  ['Auto', '2'],
]

export function ThemeChips({ value, onChange }: { value?: string; onChange: (id?: string) => void }) {
  return (
    <div className="chips sticky-chips">
      {THEMES.map(([label, id]) => (
        <button key={label} className={`chip ${value === id ? 'on' : ''}`} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  )
}
