import { useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { askPermission } from '../lib/notify'
import { APK, BUILD, checkUpdate, useUpdate } from '../lib/update'
import { exportAll, importAll, importLocalSubs, saveSettings, toggleBlock, useBlocked, useLocalSubs, useSettings } from '../lib/storage'
import { canUseLocal } from '../lib/nativeFetch'
import { LANGS } from '../lib/i18n'
import { cloudState, connect, disconnect, sync } from '../lib/cloud'
import { isNative } from '../lib/nativeFetch'
import { ago } from '../lib/format'
import { Sheet } from '../components/Sheet'
import { Icon } from '../components/Icon'
import { InterestPicker } from '../components/InterestPicker'
import { DragList } from '../components/DragList'

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
    <section className="plain">
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

function UpdatePane() {
  const s = useSettings()
  const u = useUpdate()
  return (
    <>
      <label>Mises à jour</label>
      <div className="pref">
        <span>
          <strong>Version installée : {BUILD || 'dev'}</strong>
          <small>
            {u.checking
              ? 'Vérification…'
              : u.error
                ? u.error
                : u.checkedAt
                  ? u.latest > BUILD
                    ? `Version ${u.latest} disponible${u.notes ? ' · ' + u.notes : ''}`
                    : `À jour · vérifié ${ago(u.checkedAt)}`
                  : 'Pas encore vérifié'}
          </small>
        </span>
        {u.latest > BUILD ? (
          <a className="btn small" href={APK}>
            Installer
          </a>
        ) : (
          <button className="btn small ghost" disabled={u.checking} onClick={checkUpdate}>
            Vérifier
          </button>
        )}
      </div>
      <Toggle on={s.autoUpdate} set={(v) => saveSettings({ autoUpdate: v })} label="Vérifier automatiquement" hint="Au lancement, au retour dans l’appli et toutes les 30 min" />
    </>
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

const Toggle = ({ on, set, label, hint }: { on: boolean; set: (v: boolean) => void; label: string; hint?: string }) => (
  <div className="pref">
    <span>
      <strong>{label}</strong>
      {hint && <small>{hint}</small>}
    </span>
    <button className={`switch ${on ? 'on' : ''}`} onClick={() => set(!on)} aria-label={label} />
  </div>
)

function Choice<T extends string | number>({ value, set, options }: { value: T; set: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="segmented wrap">
      {options.map(([v, l]) => (
        <button key={String(v)} className={value === v ? 'on' : ''} onClick={() => set(v)}>
          {l}
        </button>
      ))}
    </div>
  )
}

const TAB_LIST: [string, string][] = [
  ['/shorts', 'Shorts'],
  ['/music', 'Musique'],
  ['/subscriptions', 'Abonnements'],
  ['/library', 'Bibliothèque'],
]

const SECTION_LABELS: Record<string, string> = { continue: 'Reprendre', shorts: 'Shorts', subs: 'Nouveautés des abonnements', popular: 'Pour toi / Populaire' }

type Pane = 'shorts' | 'notifs' | 'interests' | 'content' | 'home' | 'look' | 'play' | 'music' | 'cloud' | 'data' | 'help' | null

export function Settings() {
  const s = useSettings()
  const subs = useLocalSubs()
  const blocked = useBlocked()
  const [msg, setMsg] = useState('')
  const [params] = useSearchParams()
  const [pane, setPane] = useState<Pane>((params.get('pane') as Pane) || null)

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
  const order = s.homeOrder.filter((k) => SECTION_LABELS[k])

  const GROUPS: [string, [Pane, string, string, string][]][] = [
    [
      'Contenu',
      [
        ['interests', 'music', 'Centres d’intérêt', `${s.interests.length} sélectionnés`],
        ['content', 'search', 'Langue, région, chaînes masquées', `${LANGS.find((l) => l.code === s.lang)?.label ?? ''} · ${blocked.length} masquée(s)`],
        ['shorts', 'shorts', 'Shorts', s.showShorts ? 'Activés · boutons et côté' : 'Désactivés'],
        ['notifs', 'bell', 'Notifications', `${s.notifyChannels.length} chaîne(s)`],
      ],
    ],
    [
      'Affichage',
      [
        ['home', 'home', 'Accueil et onglets', 'Sections, ordre, onglets visibles'],
        ['look', 'settings', 'Apparence', 'Thème, couleur, fond, texte, animations'],
      ],
    ],
    [
      'Lecture',
      [
        ['play', 'play', 'Vidéos', 'Lecteur, qualité, vitesse, sous-titres, traduction'],
        ['music', 'music', 'Musique', 'Qualité audio'],
      ],
    ],
    [
      'Compte et données',
      [
        ['cloud', 'user', 'Sauvegarde Google', cloudState().email || 'Non connecté'],
        ['data', 'download', 'Données', `${subs.length} abonnements · import, export, cache`],
      ],
    ],
    ['Aide', [['help', 'chart', 'Mises à jour, aide et diagnostic', `Version ${import.meta.env.VITE_BUILD ?? 'dev'}`]]],
  ]
  const MENU = GROUPS.flatMap((g) => g[1])
  const title = MENU.find((m) => m[0] === pane)?.[2]

  return (
    <div className="page settings">
      <h1 className="page-title">Paramètres</h1>
      {GROUPS.map(([group, items]) => (
        <div key={group} className="settings-group">
          <h4>{group}</h4>
          <div className="settings-menu">
            {items.map(([k, icon, label, hint]) => (
              <button key={k} onClick={() => setPane(k)}>
                <span className="sm-icon">
                  <Icon name={icon} size={20} />
                </span>
                <span className="sm-text">
                  <strong>{label}</strong>
                  <small>{hint}</small>
                </span>
                <Icon name="fwd" size={18} />
              </button>
            ))}
          </div>
        </div>
      ))}

      <Sheet open={!!pane} onClose={() => setPane(null)} title={title}>
        <div className="pane">
          {pane === 'shorts' && (
            <>
              <Toggle on={s.showShorts} set={(v) => saveSettings({ showShorts: v })} label="Shorts" hint="Onglet et rangées de Shorts" />
              <label>Boutons des Shorts</label>
              {(
                [
                  ['like', 'J’aime'],
                  ['details', 'Détails et commentaires'],
                  ['download', 'Télécharger'],
                  ['more', 'Plus'],
                ] as const
              ).map(([k, l]) => (
                <Toggle key={k} on={s.shortsButtons[k]} label={l} set={(v) => saveSettings({ shortsButtons: { ...s.shortsButtons, [k]: v } })} />
              ))}
              <label>Côté des boutons</label>
              <Choice value={s.shortsSide} set={(v) => saveSettings({ shortsSide: v })} options={[['right', 'Droite'], ['left', 'Gauche']]} />
            </>
          )}

          {pane === 'notifs' && (
            <>
              <p className="muted">Une notification quand une chaîne publie une vidéo (vérifié toutes les 30 min tant que l’appli tourne).</p>
              {subs.length === 0 && <p className="muted">Abonne-toi d’abord à des chaînes (onglet Abonnements).</p>}
              {subs.map((c) => (
                <Toggle
                  key={c.id}
                  on={s.notifyChannels.includes(c.id)}
                  label={c.title}
                  set={async (v) => {
                    if (v) await askPermission()
                    saveSettings({ notifyChannels: v ? [...s.notifyChannels, c.id] : s.notifyChannels.filter((x) => x !== c.id) })
                  }}
                />
              ))}
            </>
          )}

          {pane === 'interests' && <InterestPicker value={s.interests} onChange={(v) => saveSettings({ interests: v })} />}

          {pane === 'content' && (
            <>
              <label>Langue des vidéos</label>
              <div className="lang-grid">
                {LANGS.map((l) => (
                  <button key={l.code} className={`lang ${s.lang === l.code ? 'on' : ''}`} onClick={() => saveSettings({ lang: l.code, region: l.region })}>
                    <span className="flag">{l.flag}</span>
                    {l.label}
                  </button>
                ))}
              </div>
              <Toggle on={s.strictLang} set={(v) => saveSettings({ strictLang: v })} label="Uniquement ma langue" hint="Accueil, Shorts et tendances : écarte les vidéos détectées dans une autre langue" />
              <label>Région</label>
              <select value={s.region} onChange={(e) => saveSettings({ region: e.target.value })}>
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <BlockedSection />
            </>
          )}

          {pane === 'home' && (
            <>
              <label>Sections de l’accueil (glisser ⠿ pour réordonner)</label>
              <DragList
                items={order}
                keyOf={(k) => k}
                onChange={(o) => saveSettings({ homeOrder: o })}
                render={(k) => (
                  <div className="pref grow">
                    <span>
                      <strong>{SECTION_LABELS[k]}</strong>
                    </span>
                    <button
                      className={`switch ${s.sections[k as keyof typeof s.sections] ? 'on' : ''}`}
                      onClick={() => saveSettings({ sections: { ...s.sections, [k]: !s.sections[k as keyof typeof s.sections] } })}
                      aria-label={SECTION_LABELS[k]}
                    />
                  </div>
                )}
              />
              <label>Onglets (glisser pour réordonner, interrupteur pour afficher)</label>
              <DragList
                items={TAB_LIST.map((t) => t[0]).sort((x, y) => (s.tabs.indexOf(x) + 99 * +!s.tabs.includes(x)) - (s.tabs.indexOf(y) + 99 * +!s.tabs.includes(y)))}
                keyOf={(t) => t}
                onChange={(l) => saveSettings({ tabs: l.filter((t) => s.tabs.includes(t)) })}
                render={(t) => (
                  <div className="pref grow">
                    <span>
                      <strong>{TAB_LIST.find((x) => x[0] === t)?.[1]}</strong>
                    </span>
                    <button className={`switch ${s.tabs.includes(t) ? 'on' : ''}`} onClick={() => saveSettings({ tabs: s.tabs.includes(t) ? s.tabs.filter((x) => x !== t) : [...s.tabs, t] })} aria-label="Afficher" />
                  </div>
                )}
              />
              <label>Onglet au démarrage</label>
              <Choice value={s.startTab} set={(v) => saveSettings({ startTab: v })} options={[['/', 'Accueil'], ['/shorts', 'Shorts'], ['/music', 'Musique'], ['/subscriptions', 'Abonnements']]} />
              <label>Taille des vignettes</label>
              <Choice value={s.density} set={(v) => saveSettings({ density: v })} options={[['comfort', 'Grandes'], ['compact', 'Compactes']]} />
            </>
          )}

          {pane === 'look' && (
            <>
              <label>Thème</label>
              <Choice value={s.theme} set={(v) => saveSettings({ theme: v })} options={[['dark', 'Sombre'], ['light', 'Clair'], ['system', 'Système']]} />
              <label>Couleur principale</label>
              <div className="swatches">
                {ACCENTS.map((c) => (
                  <button key={c} className={s.accent === c ? 'on' : ''} style={{ background: c }} onClick={() => saveSettings({ accent: c })} aria-label={c} />
                ))}
              </div>
              <label>Taille du texte</label>
              <Choice value={s.textScale} set={(v) => saveSettings({ textScale: v })} options={[[90, 'Petit'], [100, 'Normal'], [110, 'Grand'], [120, 'Très grand']]} />
              <label>Fond</label>
              <Choice
                value={s.background}
                set={(v) => saveSettings({ background: v })}
                options={[['halo', 'Halos'], ['aurora', 'Aurore'], ['gradient', 'Dégradé'], ['sunset', 'Coucher de soleil'], ['plain', 'Uni']]}
              />
              <label>Coins</label>
              <Choice value={s.radius} set={(v) => saveSettings({ radius: v })} options={[['round', 'Arrondis'], ['square', 'Droits']]} />
              <Toggle on={s.animations} set={(v) => saveSettings({ animations: v })} label="Animations" />
              <Toggle on={s.tabLabels} set={(v) => saveSettings({ tabLabels: v })} label="Noms sous les onglets" />
            </>
          )}

          {pane === 'play' && (
            <>
              <label>Lecteur</label>
              <Choice
                value={s.player}
                set={(v) => saveSettings({ player: v })}
                options={[['direct', 'Sans pub'], ['nocookie', 'YouTube intégré'], ['invidious', 'Invidious']]}
              />
              {s.player === 'direct' && !canUseLocal() && <p className="muted">Lecture sans pub : application Android uniquement.</p>}
              {s.player === 'invidious' && <input value={s.invidiousInstance} onChange={(e) => saveSettings({ invidiousInstance: e.target.value })} placeholder="https://…" />}
              <label>Qualité préférée</label>
              <Choice value={s.quality} set={(v) => saveSettings({ quality: v })} options={[[360, '360p'], [480, '480p'], [720, '720p'], [1080, '1080p'], [2160, '4K']]} />
              <label>Vitesse par défaut</label>
              <Choice value={s.speed} set={(v) => saveSettings({ speed: v })} options={[[0.75, '0,75×'], [1, '1×'], [1.25, '1,25×'], [1.5, '1,5×'], [2, '2×']]} />
              <label>Image</label>
              <Choice value={s.fit} set={(v) => saveSettings({ fit: v })} options={[['contain', 'Ajuster'], ['cover', 'Remplir']]} />
              <Toggle on={s.autoNext} set={(v) => saveSettings({ autoNext: v })} label="Enchaîner la vidéo suivante" />
              <Toggle on={s.captions} set={(v) => saveSettings({ captions: v })} label="Sous-titres" hint="Lecteur YouTube intégré" />
              <Toggle on={s.translateTitles} set={(v) => saveSettings({ translateTitles: v })} label="Traduire titres et descriptions" hint="Sauf titres de musique et textes déjà dans ta langue" />
              <Toggle on={s.showStats} set={(v) => saveSettings({ showStats: v })} label="Statistiques de lecture" hint="Affiche ce qui ralentit le démarrage" />
            </>
          )}

          {pane === 'music' && (
            <>
              <label>Qualité audio</label>
              <Choice value={s.audioQuality} set={(v) => saveSettings({ audioQuality: v })} options={[['high', 'Haute'], ['low', 'Économie de données']]} />
            </>
          )}

          {pane === 'cloud' && <CloudSection />}

          {pane === 'data' && (
            <div className="row-btns">
              <label className="btn ghost">
                Importer Google Takeout
                <input type="file" accept=".csv" hidden onChange={onFile('takeout')} />
              </label>
              <button className="btn ghost" onClick={() => download('youtmusic-sauvegarde.json', exportAll())}>
                Exporter une sauvegarde
              </button>
              <label className="btn ghost">
                Restaurer une sauvegarde
                <input type="file" accept=".json" hidden onChange={onFile('backup')} />
              </label>
              <button
                className="btn ghost"
                onClick={() => {
                  Object.keys(localStorage)
                    .filter((k) => k.startsWith('youfree:cache:'))
                    .forEach((k) => localStorage.removeItem(k))
                  setMsg('Cache vidé.')
                }}
              >
                Vider le cache
              </button>
            </div>
          )}

          {pane === 'help' && <UpdatePane />}
          {pane === 'help' && (
            <div className="row-btns">
              <a href="#/diagnostic" className="btn ghost">
                Diagnostic
              </a>
              <button className="btn ghost" onClick={() => saveSettings({ onboarded: false })}>
                Revoir l’accueil
              </button>
              <p className="muted version">Youtmusic · version {import.meta.env.VITE_BUILD ?? 'dev'}</p>
            </div>
          )}
        </div>
      </Sheet>
      {msg && <p className="toast" onClick={() => setMsg('')}>{msg}</p>}
    </div>
  )
}
