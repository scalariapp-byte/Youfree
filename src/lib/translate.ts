// Traduction automatique (service public de Google Traduction, appelé par le téléphone).
import { localFetch } from './nativeFetch'

const cache = new Map<string, string>()
const SEP = '\n⁂\n'

/** Traduit une liste de textes vers `lang` ; renvoie les originaux en cas d'échec. */
export async function translateAll(texts: string[], lang: string): Promise<string[]> {
  const out = texts.map((t) => cache.get(lang + t) ?? '')
  const todo = texts.map((t, i) => [t, i] as const).filter(([t], i) => t.trim() && !out[i])
  // Lots d'environ 3 500 caractères.
  for (let k = 0; k < todo.length; ) {
    const batch: (readonly [string, number])[] = []
    let len = 0
    while (k < todo.length && len + todo[k][0].length < 3500) (batch.push(todo[k]), (len += todo[k][0].length + 3), k++)
    if (!batch.length) batch.push(todo[k++])
    try {
      const q = encodeURIComponent(batch.map(([t]) => t).join(SEP))
      const r = await localFetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${q}`)
      const data = JSON.parse(await r.text())
      const full: string = (data[0] ?? []).map((x: unknown[]) => x[0]).join('')
      const parts = full.split(/\s*⁂\s*/)
      batch.forEach(([t, i], j) => {
        const tr = (parts[j] ?? t).trim()
        cache.set(lang + t, tr)
        out[i] = tr
      })
    } catch {
      batch.forEach(([t, i]) => (out[i] = t))
    }
  }
  return out.map((t, i) => t || texts[i])
}
