import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/Layout'

export function Onboarding() {
  const { available, signIn, error } = useAuth()
  return (
    <div className="page onboarding">
      <Logo />
      <h1>YouTube, sans pubs ni distractions.</h1>
      <ul className="pitch">
        <li>Pas de jeux, pas de Shorts imposés, pas de flux infini.</li>
        <li>Un accueil chronologique basé sur <em>tes</em> abonnements.</li>
        <li>Historique, « plus tard » et abonnements stockés sur ton appareil.</li>
      </ul>
      <div className="choices">
        <div className="choice">
          <h3>Avec mon compte Google</h3>
          <p>Retrouve tes abonnements, vidéos aimées et playlists (lecture seule).</p>
          {available ? (
            <button className="btn" onClick={signIn}>
              Se connecter avec Google
            </button>
          ) : (
            <p className="muted">
              Nécessite un ID client OAuth : à renseigner dans les <Link to="/settings">Réglages</Link>.
            </p>
          )}
          {error && <p className="muted">{error}</p>}
        </div>
        <div className="choice">
          <h3>Sans compte</h3>
          <p>Abonne-toi aux chaînes localement, rien n’est envoyé à Google à ton nom.</p>
          <Link to="/settings" className="btn ghost">
            Ajouter une clé API
          </Link>
        </div>
      </div>
    </div>
  )
}
