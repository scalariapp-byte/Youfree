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
  }
  return cache.get(url)!
}
