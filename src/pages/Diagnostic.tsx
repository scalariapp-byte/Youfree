// Diagnostic du mode sans clé : exécute chaque étape et affiche ce qui se passe,
// pour comprendre une page vide sur un téléphone sans outils de débogage.
import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { localFetch, canUseLocal, isNative } from '../lib/nativeFetch'
import { getSettings } from '../lib/storage'

interface Step {
  name: string
  status: 'ok' | 'ko' | 'run'
  detail: string
  ms?: number
}

const errText = (e: unknown) => {
  const err = e as Error
  return `${err?.name ?? 'Erreur'}: ${err?.message ?? String(e)}${err?.stack ? '\n' + err.stack.split('\n').slice(0, 4).join('\n') : ''}`
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const typesOf = (nodes: any[] = []) => {
  const counts: Record<string, number> = {}
  nodes.forEach((n) => {
    const t = n?.type ?? n?.constructor?.type ?? '?'
    counts[t] = (counts[t] ?? 0) + 1
  })
  return Object.entries(counts)
    .map(([t, c]) => `${t}×${c}`)
    .join(', ')
}

export function Diagnostic() {
  const [steps, setSteps] = useState<Step[]>([])
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    const list: Step[] = []
    const push = (s: Step) => {
      list.push(s)
      setSteps([...list])
    }
    const step = async (name: string, fn: () => Promise<string>) => {
      const s: Step = { name, status: 'run', detail: '' }
      push(s)
      const t0 = performance.now()
      try {
        s.detail = await fn()
        s.status = 'ok'
      } catch (e) {
        s.detail = errText(e)
        s.status = 'ko'
      }
      s.ms = Math.round(performance.now() - t0)
      setSteps([...list])
      return s.status === 'ok'
    }

    const st = getSettings()
    push({
      name: 'Environnement',
      status: 'ok',
      detail: [
        `plateforme=${Capacitor.getPlatform()} natif=${isNative()} sansCléPossible=${canUseLocal()}`,
        `région=${st.region} lecteur=${st.player}`,
        `shorts=${st.showShorts}`,
        `navigateur=${navigator.userAgent}`,
      ].join('\n'),
    })

    await step('Requête HTTP brute vers youtube.com', async () => {
      const r = await localFetch('https://www.youtube.com/youtubei/v1/config?prettyPrint=false', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: '2.20251101.00.00', hl: 'en', gl: st.region } } }),
      })
      const text = await r.text()
      return `HTTP ${r.status}, ${text.length} caractères\n${text.slice(0, 200)}`
    })

    let yt: any
    const okSession = await step('Création de la session youtubei.js', async () => {
      const { Innertube } = await import('youtubei.js/web')
      yt = await Innertube.create({ lang: 'en', location: st.region, retrieve_player: false, generate_session_locally: true, fetch: localFetch })
      return `client=${yt.session.context?.client?.clientName} version=${yt.session.context?.client?.clientVersion}`
    })

    if (okSession) {
      await step('Recherche « musique »', async () => {
        const r = await yt.search('musique', { type: 'video' })
        const local = await import('../lib/innertube')
        const vids = await local.search('musique')
        return `nœuds bruts: ${typesOf(r.results)}\nvidéos lues par la librairie: ${r.videos?.length ?? 0} (${typesOf(r.videos)})\nvidéos affichables: ${vids.videos.length}\n${vids.videos
          .slice(0, 3)
          .map((v) => `- ${v.title} | ${v.channelTitle} | ${v.durationSec}s | ${v.views} vues`)
          .join('\n')}`
      })
      await step('Page vidéo (/next)', async () => {
        const local = await import('../lib/innertube')
        const v = await local.video('jNQXAC9IVRw')
        return `${v.title} | ${v.channelTitle} | ${v.views} vues`
      })
      await step('Chaîne et ses vidéos', async () => {
        const local = await import('../lib/innertube')
        const c = await local.channel('UC4QobU6STFB0P71PMvOGN5A')
        const v = await local.playlistVideos('UU4QobU6STFB0P71PMvOGN5A')
        return `${c.title} | ${c.subscribers} abonnés | ${v.videos.length} vidéos`
      })
      await step('Flux vidéo (lecture sans pub, téléchargement)', async () => {
        const { getStreams, downloadOptions } = await import('../lib/stream')
        const st = await getStreams('jNQXAC9IVRw')
        const r = await localFetch(st.video, { headers: { Range: 'bytes=0-1023' } })
        return `client=${st.client} qualités=${st.qualities.map((q) => q.height).join(',')} téléchargement=${downloadOptions(st).map((o) => o.height).join(',')}\naccès au flux : HTTP ${r.status}`
      })
    }
    setRunning(false)
  }

  const report = steps.map((s) => `[${s.status.toUpperCase()}] ${s.name}${s.ms != null ? ` (${s.ms} ms)` : ''}\n${s.detail}`).join('\n\n')

  return (
    <div className="page settings">
      <h1>Diagnostic</h1>
      <p className="muted">Teste chaque étape du mode sans clé. Si quelque chose échoue, copie le rapport et envoie-le.</p>
      <div className="row-btns">
        <button className="btn" onClick={run} disabled={running}>
          {running ? 'Test en cours…' : 'Lancer le diagnostic'}
        </button>
        {steps.length > 0 && !running && (
          <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(report)}>
            Copier le rapport
          </button>
        )}
      </div>
      {steps.map((s, i) => (
        <section key={i} className={`diag ${s.status}`}>
          <strong>
            {s.status === 'ok' ? '✅' : s.status === 'ko' ? '❌' : '⏳'} {s.name}
            {s.ms != null && <small className="muted"> · {s.ms} ms</small>}
          </strong>
          {s.detail && <pre>{s.detail}</pre>}
        </section>
      ))}
    </div>
  )
}
