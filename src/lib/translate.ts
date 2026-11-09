// Traduction automatique (service public de Google Traduction, appelé par le téléphone).
// Un texte par requête (POST), 6 en parallèle : fiable même pour les longs commentaires.
import { localFetch } from './nativeFetch'
import { log } from './log'

const cache = new Map<string, string>()

async function one(text: string, lang: string): Promise<string> {
  const key = lang + text
  if (cache.has(key)) return cache.get(key)!
  const r = await localFetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: `q=${encodeURIComponent(text.slice(0, 4500))}`,
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = JSON.parse(await r.text())
  // Si le texte est déjà dans la langue voulue, on le garde tel quel.
  const out = data[2] === lang ? text : (data[0] ?? []).map((x: unknown[]) => x[0]).join('')
  cache.set(key, out || text)
  return out || text
}

/** Traduit une liste de textes vers `lang` ; renvoie l'original pour ceux qui échouent. */
export async function translateAll(texts: string[], lang: string): Promise<string[]> {
  const out = texts.slice()
  let i = 0
  let failed = 0
  const worker = async () => {
    while (i < texts.length) {
      const k = i++
      if (!texts[k].trim()) continue
      try {
        out[k] = await one(texts[k], lang)
      } catch (e) {
        if (!failed++) log('traduction', `échec : ${(e as Error).message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, texts.length) }, worker))
  return out
}
