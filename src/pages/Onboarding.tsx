import { Logo } from '../components/Layout'

const APK_URL = 'https://github.com/scalariapp-byte/Youtmusic/releases/download/android-latest/youfree.apk'

/** Affiché dans un navigateur : Youtmusic fonctionne dans l'application Android. */
export function Onboarding() {
  return (
    <div className="page onboarding">
      <Logo />
      <h1>YouTube, sans pubs ni distractions.</h1>
      <ul className="pitch">
        <li>Sans compte, sans clé, sans pub : le téléphone fait tout.</li>
        <li>Accueil chronologique, Shorts, recherche instantanée.</li>
        <li>Historique et abonnements gardés sur ton appareil.</li>
      </ul>
      <a className="btn" href={APK_URL}>
        Télécharger l’application Android
      </a>
    </div>
  )
}
