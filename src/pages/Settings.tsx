import { useState, type ChangeEvent } from 'react'
import { useAuth } from '../lib/auth'
import { exportAll, importAll, importLocalSubs, saveSettings, useLocalSubs, useSettings } from '../lib/storage'
import { canUseLocal, isNative } from '../lib/nativeFetch'

const REGIONS = ['FR', 'BE', 'CH', 'CA', 'LU', 'MA', 'SN', 'US', 'GB', 'DE', 'ES', 'IT']

function download(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Lit le subscriptions.csv de Google Takeout (ID, URL, titre). */
function parseTakeout(csv: string) {
  return csv
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(','))
    .filter((cols) => /^UC[\w-]{22}$/.test(cols[0]?.trim()))
    .map((cols) => ({ id: cols[0].trim(), title: cols.slice(2).join(',').trim(), thumbnail: '' }))
}

export function Settings() {
  const s = useSettings()
  const subs = useLocalSubs()
  const { user, signOut } = useAuth()
  const [apiKey, setApiKey] = useState(s.apiKey)
  const [clientId, setClientId] = useState(s.clientId)
  const [msg, setMsg] = useState('')

  const onFile = (kind: 'takeout' | 'backup') => async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      if (kind === 'takeout') {
        const list = parseTakeout(text)
        importLocalSubs(list)
        setMsg(`${list.length} abonnements importés.`)
      } else {
        importAll(text)
        setMsg('Sauvegarde restaurée.')
      }
    } catch {
      setMsg('Fichier illisible.')
    }
    e.target.value = ''
  }

  return (
    <div className="page settings">
      <h1>Réglages</h1>

      <section>
        <h2>Source des vidéos</h2>
        <label className="toggle">
          <input type="radio" name="source" checked={s.source === 'auto'} onChange={() => saveSettings({ source: 'auto' })} />
          Automatique (clé API ou compte Google si disponible, sinon sans clé)
        </label>
        <label className="toggle">
          <input type="radio" name="source" checked={s.source === 'local'} disabled={!canUseLocal()} onChange={() => saveSettings({ source: 'local' })} />
          Sans clé : le téléphone interroge YouTube directement (gratuit, sans quota)
        </label>
        <label className="toggle">
          <input type="radio" name="source" checked={s.source === 'api'} onChange={() => saveSettings({ source: 'api' })} />
          API officielle YouTube (clé API ou compte Google)
        </label>
        <p className="muted">
          {isNative()
            ? 'Mode sans clé disponible dans cette application.'
            : canUseLocal()
              ? 'Mode sans clé disponible (serveur de développement).'
              : 'Mode sans clé indisponible dans un navigateur : le navigateur bloque les requêtes vers youtube.com. Installe l’application Android.'}
        </p>
        <a href="#/diagnostic" className="btn ghost">
          Diagnostic
        </a>
      </section>

      <section>
        <h2>Accès à YouTube</h2>
        <p className="muted">
          Les données (recherche, tendances, chaînes) viennent de l’API officielle YouTube Data v3. Sans compte, une clé API est nécessaire ;
          connecté avec Google, ton jeton suffit.
        </p>
        <label>
          Clé API YouTube Data v3
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza…" autoComplete="off" />
        </label>
        <label>
          ID client OAuth Google (pour « Se connecter »)
          <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" />
        </label>
        <button
          className="btn"
          onClick={() => {
            saveSettings({ apiKey: apiKey.trim(), clientId: clientId.trim() })
            setMsg('Enregistré. Recharge la page si la connexion Google ne s’affiche pas.')
          }}
        >
          Enregistrer
        </button>
        <details>
          <summary>Comment obtenir ces identifiants (5 min, gratuit)</summary>
          <ol>
            <li>
              Ouvre <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">console.cloud.google.com</a> et crée un projet.
            </li>
            <li>« API et services » → « Bibliothèque » → active <em>YouTube Data API v3</em>.</li>
            <li>« Identifiants » → « Créer » → <em>Clé API</em>. Restreins-la à l’API YouTube et à l’adresse de ton site.</li>
            <li>
              Pour la connexion : « Écran de consentement OAuth » (type Externe, ajoute ton adresse en utilisateur test), puis « Créer » →{' '}
              <em>ID client OAuth</em> → Application Web → origine autorisée : <code>{location.origin}</code>.
            </li>
          </ol>
        </details>
        {user && (
          <p>
            Connecté : <strong>{user.email}</strong> <button className="link" onClick={signOut}>Se déconnecter</button>
          </p>
        )}
      </section>

      <section>
        <h2>Ce que tu ne veux pas voir</h2>
        <label className="toggle">
          <input type="checkbox" checked={s.hideShorts} onChange={(e) => saveSettings({ hideShorts: e.target.checked })} />
          Masquer les Shorts (vidéos ≤ 60 s ou marquées #shorts)
        </label>
        <label className="toggle">
          <input type="checkbox" checked={s.hideGaming} onChange={(e) => saveSettings({ hideGaming: e.target.checked })} />
          Masquer les vidéos de la catégorie « Jeux vidéo »
        </label>
        <p className="muted">Les jeux intégrés (Playables), les publicités dans le flux et les Shorts forcés n’existent pas dans Youfree.</p>
      </section>

      <section>
        <h2>Lecture</h2>
        <label>
          Région des tendances
          <select value={s.region} onChange={(e) => saveSettings({ region: e.target.value })}>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="toggle">
          <input type="radio" name="player" checked={s.player === 'nocookie'} onChange={() => saveSettings({ player: 'nocookie' })} />
          Lecteur YouTube sans cookies (fiable, reprise de lecture ; YouTube peut encore insérer une pub sur certaines vidéos)
        </label>
        <label className="toggle">
          <input type="radio" name="player" checked={s.player === 'invidious'} onChange={() => saveSettings({ player: 'invidious' })} />
          Lecteur Invidious (zéro pub, mais dépend d’un serveur tiers parfois lent ou hors ligne)
        </label>
        {s.player === 'invidious' && (
          <label>
            Instance Invidious
            <input value={s.invidiousInstance} onChange={(e) => saveSettings({ invidiousInstance: e.target.value })} placeholder="https://…" />
          </label>
        )}
      </section>

      <section>
        <h2>Données locales</h2>
        <p className="muted">{subs.length} abonnements locaux. Historique et listes restent dans ce navigateur.</p>
        <div className="row-btns">
          <label className="btn ghost">
            Importer Google Takeout (subscriptions.csv)
            <input type="file" accept=".csv" hidden onChange={onFile('takeout')} />
          </label>
          <button className="btn ghost" onClick={() => download('youfree-sauvegarde.json', exportAll())}>
            Exporter une sauvegarde
          </button>
          <label className="btn ghost">
            Restaurer une sauvegarde
            <input type="file" accept=".json" hidden onChange={onFile('backup')} />
          </label>
        </div>
      </section>
      {msg && <p className="toast">{msg}</p>}
    </div>
  )
}
