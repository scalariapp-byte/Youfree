// Premier lancement : 4 étapes animées pour régler ses préférences.
import { useState } from 'react'
import { LANGS } from '../lib/i18n'
import { saveSettings, useSettings } from '../lib/storage'
import { THEMES } from '../components/Themes'
import { Icon } from '../components/Icon'

const STEPS = 4

export function Welcome() {
  const s = useSettings()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [interests, setInterests] = useState<string[]>(s.interests)
  const go = (n: number) => (setDir(n > step ? 1 : -1), setStep(n))
  const toggle = (id: string) => setInterests((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  const finish = () => saveSettings({ interests, onboarded: true })

  return (
    <div className="welcome">
      <div className="welcome-bg" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="welcome-dots">
        {Array.from({ length: STEPS }, (_, i) => (
          <i key={i} className={i === step ? 'on' : i < step ? 'done' : ''} />
        ))}
      </div>

      <div key={step} className={`welcome-step ${dir > 0 ? 'fwd' : 'back'}`}>
        {step === 0 && (
          <>
            <div className="welcome-logo">
              <svg viewBox="0 0 64 64" width="96" height="96" aria-hidden>
                <rect width="64" height="64" rx="18" fill="var(--accent)" />
                <circle cx="32" cy="32" r="16" fill="none" stroke="#fff" strokeWidth="5" className="ring" />
                <path d="M28 24v16l12-8z" fill="#fff" />
              </svg>
            </div>
            <h1>
              Bienvenue sur <span className="grad">Youfree</span>
            </h1>
            <p className="lead">Tes vidéos, sans pub ni compte. Réglons l’essentiel en 30 secondes.</p>
            <ul className="perks">
              <li style={{ ['--i' as string]: 0 }}>
                <Icon name="check" /> Zéro publicité
              </li>
              <li style={{ ['--i' as string]: 1 }}>
                <Icon name="check" /> Aucune donnée envoyée à ton nom
              </li>
              <li style={{ ['--i' as string]: 2 }}>
                <Icon name="check" /> Shorts, recherche instantanée, abonnements
              </li>
            </ul>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Dans quelle langue veux-tu tes vidéos ?</h2>
            <p className="lead">Elle oriente l’accueil, les thèmes et les Shorts.</p>
            <div className="lang-grid">
              {LANGS.map((l, i) => (
                <button
                  key={l.code}
                  style={{ ['--i' as string]: i }}
                  className={`lang ${s.lang === l.code ? 'on' : ''}`}
                  onClick={() => saveSettings({ lang: l.code, region: l.region })}
                >
                  <span className="flag">{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Qu’est-ce qui t’intéresse ?</h2>
            <p className="lead">Choisis-en quelques-uns : ton accueil sera composé avec.</p>
            <div className="interest-grid">
              {THEMES.filter(([, id]) => id).map(([label, id], i) => (
                <button key={id} style={{ ['--i' as string]: i }} className={`interest ${interests.includes(id!) ? 'on' : ''}`} onClick={() => toggle(id!)}>
                  {interests.includes(id!) && <Icon name="check" size={16} />}
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Dernières préférences</h2>
            <div className="pref">
              <span>
                <strong>Shorts</strong>
                <small>Onglet dédié et rangées sur l’accueil</small>
              </span>
              <button className={`switch ${s.showShorts ? 'on' : ''}`} onClick={() => saveSettings({ showShorts: !s.showShorts })} aria-label="Shorts" />
            </div>
            <div className="pref">
              <span>
                <strong>Vidéos de jeux vidéo</strong>
                <small>Les masquer partout</small>
              </span>
              <button className={`switch ${s.hideGaming ? 'on' : ''}`} onClick={() => saveSettings({ hideGaming: !s.hideGaming })} aria-label="Masquer les jeux" />
            </div>
            <div className="pref">
              <span>
                <strong>Thème</strong>
              </span>
              <div className="segmented">
                {(['dark', 'light'] as const).map((t) => (
                  <button key={t} className={s.theme === t ? 'on' : ''} onClick={() => saveSettings({ theme: t })}>
                    {t === 'dark' ? 'Sombre' : 'Clair'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="welcome-nav">
        {step > 0 ? (
          <button className="btn ghost" onClick={() => go(step - 1)}>
            Retour
          </button>
        ) : (
          <span />
        )}
        {step < STEPS - 1 ? (
          <button className="btn big" onClick={() => go(step + 1)}>
            {step === 0 ? 'C’est parti' : 'Continuer'}
          </button>
        ) : (
          <button className="btn big" onClick={finish}>
            Découvrir mes vidéos
          </button>
        )}
      </div>
    </div>
  )
}
