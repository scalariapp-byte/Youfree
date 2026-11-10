// Piste audio téléchargée par la couche native puis lue depuis la mémoire :
// contourne le refus du lecteur du téléphone sur les URL audio directes.
import { CapacitorHttp } from '@capacitor/core'
import { isNative } from './nativeFetch'

const cache = new Map<string, Promise<string>>()
const CHUNK = 2 << 20

async function range(url: string, from: number, to: number) {
  const r = await CapacitorHttp.request({ url, method: 'GET', headers: { Range: `bytes=${from}-${to}` }, responseType: 'arraybuffer' })
  if (r.status >= 400) throw new Error(`HTTP ${r.status}`)
  const bin = atob(typeof r.data === 'string' ? r.data : '')
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  const cr = (r.headers['Content-Range'] ?? r.headers['content-range'] ?? '') as string
  return { bytes: out, total: Number(cr.split('/')[1]) || out.length }
}

/** Renvoie une URL blob: lisible par <audio>, téléchargée en morceaux parallèles. */
export function audioBlobUrl(url: string, mime: string): Promise<string> {
  if (!isNative()) return Promise.reject(new Error('natif requis'))
  if (!cache.has(url)) {
    const p = (async () => {
      const first = await range(url, 0, CHUNK - 1)
      const parts: Uint8Array[] = [first.bytes]
      const jobs: Promise<void>[] = []
      for (let i = 1, from = CHUNK; from < first.total; i++, from += CHUNK) {
        const k = i
        const f = from
        jobs.push(range(url, f, Math.min(f + CHUNK, first.total) - 1).then((r) => void (parts[k] = r.bytes)))
      }
      await Promise.all(jobs)
      return URL.createObjectURL(new Blob(parts as BlobPart[], { type: mime.split(';')[0] }))
    })()
    cache.set(url, p)
    p.catch(() => cache.delete(url))
    // Mémoire bornée : on ne garde que les 6 pistes les plus récentes (les autres sont libérées).
    while (cache.size > 6) {
      const [oldUrl, old] = cache.entries().next().value!
      cache.delete(oldUrl)
      old.then((u) => setTimeout(() => URL.revokeObjectURL(u), 60_000), () => {})
    }
  } else {
    // Rafraîchit l'ordre (la piste redevient la plus récente).
    const p = cache.get(url)!
    cache.delete(url)
    cache.set(url, p)
  }
  return cache.get(url)!
}

/**
 * Lecture progressive (MediaSource) : le son démarre dès le premier morceau téléchargé
 * (≈ 256 Ko) au lieu d'attendre la piste entière. Renvoie null si non pris en charge.
 */
export function streamAudioUrl(url: string, mime: string, onError: (e: Error) => void): string | null {
  if (!isNative() || typeof MediaSource === 'undefined' || !MediaSource.isTypeSupported(mime)) return null
  const ms = new MediaSource()
  const obj = URL.createObjectURL(ms)
  ms.addEventListener(
    'sourceopen',
    async () => {
      try {
        const sb = ms.addSourceBuffer(mime)
        const append = (b: Uint8Array) =>
          new Promise<void>((ok, ko) => {
            sb.addEventListener('updateend', () => ok(), { once: true })
            sb.addEventListener('error', () => ko(new Error('ajout refusé')), { once: true })
            sb.appendBuffer(b as BufferSource)
          })
        let from = 0
        let total = Infinity
        let size = 256 << 10
        while (from < total && ms.readyState === 'open') {
          const r = await range(url, from, from + size - 1)
          total = r.total
          await append(r.bytes)
          from += r.bytes.length
          size = 1 << 20
        }
        if (ms.readyState === 'open') ms.endOfStream()
      } catch (e) {
        onError(e as Error)
      }
    },
    { once: true },
  )
  return obj
}
