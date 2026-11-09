import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/Layout'

const APK_URL = 'https://github.com/scalariapp-byte/Youfree/releases/tag/android-latest'

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
          <h3>Sans compte, sans clé</h3>
          <p>Installe l’application Android : le téléphone interroge YouTube directement, sans clé ni quota.</p>
          <a className="btn" href={APK_URL} target="_blank" rel="noreferrer">
            Télécharger l’APK
          </a>
        </div>
        <div className="choice">
          <h3>Sans compte, avec clé API</h3>
          <p>Dans le navigateur, une clé API YouTube gratuite est nécessaire. Abonnements gardés sur l’appareil.</p>
          <Link to="/settings" className="btn ghost">
            Ajouter une clé API
          </Link>
        </div>
      </div>
    </div>
  )
}
