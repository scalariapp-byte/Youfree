import { Link } from 'react-router-dom'

export function ErrorBox({ error }: { error: Error }) {
  return (
    <div className="notice error">
      <strong>Impossible de charger</strong>
      <p>{error.message}</p>
      <p>
        <Link to="/diagnostic">Lancer le diagnostic</Link>
      </p>
    </div>
  )
}

/** Affiché quand une liste revient vide (plutôt qu'une page blanche). */
export function Empty({ children }: { children?: React.ReactNode }) {
  return (
    <div className="empty">
      {children ?? 'Aucune vidéo trouvée.'} <Link to="/diagnostic">Lancer le diagnostic</Link>
    </div>
  )
}
