import { Link } from 'react-router-dom'
import type { ApiError } from '../lib/youtube'

export function ErrorBox({ error }: { error: Error }) {
  const code = (error as ApiError).code
  return (
    <div className="notice error">
      <strong>{code === 'nokey' ? 'Configuration requise' : 'Erreur'}</strong>
      <p>{error.message}</p>
      <p>
        <Link to="/diagnostic">Lancer le diagnostic</Link>
      </p>
      {code === 'nokey' && (
        <p>
          Ajoute une clé API YouTube dans les <Link to="/settings">Réglages</Link>, ou connecte-toi avec Google.
        </p>
      )}
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
