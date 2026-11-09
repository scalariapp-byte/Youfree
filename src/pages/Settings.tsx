import { useState, type ChangeEvent } from 'react'
import { exportAll, importAll, importLocalSubs, saveSettings, useLocalSubs, useSettings } from '../lib/storage'
import { canUseLocal } from '../lib/nativeFetch'

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
        <h2>Contenu</h2>
        <label className="toggle">
          <input type="checkbox" checked={s.showShorts} onChange={(e) => saveSettings({ showShorts: e.target.checked })} />
          Afficher les Shorts (onglet dédié et étagères, séparés des vidéos classiques)
        </label>
        <label className="toggle">
          <input type="checkbox" checked={s.hideGaming} onChange={(e) => saveSettings({ hideGaming: e.target.checked })} />
          Masquer les vidéos de la catégorie « Jeux vidéo »
        </label>
        <p className="muted">Les jeux intégrés (Playables) et les publicités dans le flux n’existent pas dans Youfree.</p>
      </section>

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
        <a href="#/diagnostic" className="btn ghost">
          Diagnostic
        </a>
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
