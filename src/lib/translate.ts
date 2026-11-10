// Traduction automatique (service public de Google Traduction, appelé par le téléphone).
// Textes regroupés par lots (peu de requêtes), cache persistant, pause automatique si Google limite (429).
import { localFetch } from './nativeFetch'
import { log } from './log'

const KEY = 'youfree:trc'
const cache: Record<string, string> = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
})()
let pausedUntil = 0
let saveT: number | undefined
const persist = () => {
  clearTimeout(saveT)
  saveT = window.setTimeout(() => {
    try {
      const k = Object.keys(cache)
      if (k.length > 4000) k.slice(0, 1500).forEach((x) => delete cache[x])
      localStorage.setItem(KEY, JSON.stringify(cache))
    } catch {
      /* ignore */
    }
  }, 1000)
}

const SEP = '\n¶¶\n'
async function batch(texts: string[], lang: string): Promise<string[]> {
  const r = await localFetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: `q=${encodeURIComponent(texts.join(SEP))}`,
  })
  if (r.status === 429) {
    pausedUntil = Date.now() + 3 * 60_000
    throw new Error('HTTP 429 (pause 3 min)')
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = JSON.parse(await r.text())
  const full: string = (data[0] ?? []).map((x: unknown[]) => x[0]).join('')
  const parts = full.split(/\s*¶¶\s*/)
  return parts.length === texts.length ? parts.map((p, i) => p.trim() || texts[i]) : texts
}

/** Traduit une liste de textes vers `lang` ; renvoie l'original pour ceux qui échouent. */
export async function translateAll(texts: string[], lang: string): Promise<string[]> {
  const out = texts.map((t) => cache[lang + t] ?? t)
  const todo = texts.map((t, i) => [t, i] as const).filter(([t]) => t.trim() && cache[lang + t] === undefined)
  if (!todo.length || Date.now() < pausedUntil) return out
  // Lots d'environ 3 500 caractères, 2 en parallèle au plus.
  const lots: (readonly [string, number])[][] = []
  let cur: (readonly [string, number])[] = []
  let len = 0
  for (const x of todo) {
    const t = x[0].slice(0, 2000)
    if (cur.length && len + t.length > 3500) (lots.push(cur), (cur = []), (len = 0))
    cur.push([t, x[1]])
    len += t.length + 4
  }
  if (cur.length) lots.push(cur)
  let i = 0
  const worker = async () => {
    while (i < lots.length && Date.now() >= pausedUntil) {
      const lot = lots[i++]
      try {
        const tr = await batch(
          lot.map(([t]) => t),
          lang,
        )
        lot.forEach(([, k], j) => ((cache[lang + texts[k]] = tr[j]), (out[k] = tr[j])))
        persist()
      } catch (e) {
        log('traduction', `échec : ${(e as Error).message}`)
        return
      }
    }
  }
  await Promise.all([worker(), worker()])
  return out
}
