import { useState, type ChangeEvent } from 'react'
import { exportAll, importAll, importLocalSubs, saveSettings, toggleBlock, useBlocked, useLocalSubs, useSettings } from '../lib/storage'
import { canUseLocal } from '../lib/nativeFetch'
import { LANGS } from '../lib/i18n'
import { cloudState, connect, disconnect, sync } from '../lib/cloud'
import { isNative } from '../lib/nativeFetch'
import { ago } from '../lib/format'

const REGIONS = ['FR', 'BE', 'CH', 'CA', 'LU', 'MA', 'DZ', 'TN', 'SN', 'US', 'GB', 'DE', 'ES', 'IT', 'PT', 'BR', 'MX']

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

const ACCENTS = ['#19c3ae', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e']

function BlockedSection() {
  const list = useBlocked()
  if (!list.length) return null
  return (
    <section>
      <h2>Chaînes masquées</h2>
      {list.map((c) => (
        <div key={c.id + c.title} className="channel-row">
          <span>{c.title}</span>
          <button className="btn ghost small" onClick={() => toggleBlock(c)}>
            Réafficher
          </button>
        </div>
      ))}
    </section>
  )
}

function CloudSection() {
  const s = useSettings()
  const [st, setSt] = useState(cloudState())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const run = (f: () => Promise<unknown>) => async () => {
    setBusy(true)
    setErr('')
    try {
      await f()
    } catch (e) {
      setErr((e as Error).message)
    }
    setSt(cloudState())
    setBusy(false)
  }
  return (
    <section>
      <h2>Sauvegarde Google</h2>
      <p className="muted">Connecte-toi avec Google pour sauvegarder et synchroniser tes abonnements, ton historique et tes réglages sur ton Google Drive (espace privé de l’appli). Aucun accès à ton compte YouTube.</p>
      {st.email ? (
        <>
          <div className="cloud-user">
            {st.picture && <img src={st.picture} alt="" referrerPolicy="no-referrer" />}
            <div>
              <strong>{st.name || st.email}</strong>
              <small>{st.lastSync ? `Synchronisé ${ago(st.lastSync)}` : 'Jamais synchronisé'}</small>
            </div>
          </div>
          <div className="row-btns">
            <button className="btn" disabled={busy} onClick={run(sync)}>
              {busy ? 'Synchronisation…' : 'Synchroniser maintenant'}
            </button>
            <button className="btn ghost" onClick={run(disconnect)}>
              Se déconnecter
            </button>
          </div>
        </>
      ) : (
        <button className="btn google" disabled={busy || !isNative()} onClick={run(connect)}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6H1.4a12 12 0 0 0 0 10.8z" />
            <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
          </svg>
          {busy ? 'Connexion…' : 'Se connecter avec Google'}
        </button>
      )}
      {err && <p className="cloud-err">{err}</p>}
      <details>
        <summary>Configuration (une seule fois)</summary>
        <ol>
          <li>Sur console.cloud.google.com, crée un projet et active l’API Google Drive.</li>
          <li>Écran de consentement OAuth : type Externe, ajoute ton adresse en utilisateur test.</li>
          <li>
            Identifiants → ID client OAuth → <em>Android</em> : package <code>app.youfree</code>, SHA-1 <code>7E:F0:BC:13:B4:71:A0:EF:05:D1:AB:5D:90:40:7E:CD:16:73:6A:3D</code>.
          </li>
          <li>Identifiants → ID client OAuth → <em>Application Web</em> (sans rien remplir), puis colle son ID ci-dessous.</li>
        </ol>
        <label>
          ID client Web
          <input value={s.googleClientId} onChange={(e) => saveSettings({ googleClientId: e.target.value })} placeholder="xxxx.apps.googleusercontent.com" />
        </label>
      </details>
    </section>
  )
}

export function Settings() {
  const s = useSettings()
  const subs = useLocalSubs()
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

      <CloudSection />

      <section>
        <h2>Contenu</h2>
        <label className="toggle">
          <input type="checkbox" checked={s.showShorts} onChange={(e) => saveSettings({ showShorts: e.target.checked })} />
          Afficher les Shorts (onglet dédié et étagères, séparés des vidéos classiques)
        </label>
        <p className="muted">Les jeux intégrés (Playables) et les publicités dans le flux n’existent pas dans Youfree.</p>
      </section>

      <section>
        <h2>Personnalisation</h2>
        <label>Couleur principale</label>
        <div className="swatches">
          {ACCENTS.map((c) => (
            <button key={c} className={s.accent === c ? 'on' : ''} style={{ background: c }} onClick={() => saveSettings({ accent: c })} aria-label={c} />
          ))}
        </div>
        <label>Taille des vignettes</label>
        <div className="segmented">
          <button className={s.density === 'comfort' ? 'on' : ''} onClick={() => saveSettings({ density: 'comfort' })}>Grandes</button>
          <button className={s.density === 'compact' ? 'on' : ''} onClick={() => saveSettings({ density: 'compact' })}>Compactes</button>
        </div>
        <label>Sections de l’accueil</label>
        {(
          [
            ['continue', 'Reprendre'],
            ['shorts', 'Shorts'],
            ['subs', 'Nouveautés des abonnements'],
            ['popular', 'Pour toi / Populaire'],
          ] as const
        ).map(([k, l]) => (
          <label key={k} className="toggle">
            <input type="checkbox" checked={s.sections[k]} onChange={(e) => saveSettings({ sections: { ...s.sections, [k]: e.target.checked } })} /> {l}
          </label>
        ))}
        <label className="toggle">
          <input type="checkbox" checked={s.autoNext} onChange={(e) => saveSettings({ autoNext: e.target.checked })} /> Enchaîner automatiquement la vidéo suivante
        </label>
      </section>

      <BlockedSection />

      <section>
        <h2>Apparence</h2>
        <div className="segmented">
          {(['dark', 'light', 'system'] as const).map((t) => (
            <button key={t} className={s.theme === t ? 'on' : ''} onClick={() => saveSettings({ theme: t })}>
              {t === 'dark' ? 'Sombre' : t === 'light' ? 'Clair' : 'Système'}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Lecture</h2>
        <label>
          Langue des vidéos
          <select value={s.lang} onChange={(e) => saveSettings({ lang: e.target.value, region: LANGS.find((l) => l.code === e.target.value)?.region ?? s.region })}>
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Région des tendances
          <select value={s.region} onChange={(e) => saveSettings({ region: e.target.value })}>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="toggle">
          <input type="radio" name="player" checked={s.player === 'direct'} disabled={!canUseLocal()} onChange={() => saveSettings({ player: 'direct' })} />
          Lecteur Youfree sans pub (le téléphone lit les flux directement ; app Android)
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
        <h2>Aide</h2>
        <div className="row-btns">
          <a href="#/diagnostic" className="btn ghost">
            Diagnostic
          </a>
          <button className="btn ghost" onClick={() => saveSettings({ onboarded: false })}>
            Revoir l’accueil
          </button>
        </div>
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
      <p className="muted version">Youfree · version {import.meta.env.VITE_BUILD ?? 'dev'}</p>
      {msg && <p className="toast">{msg}</p>}
    </div>
  )
}
