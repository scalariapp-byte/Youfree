// Requêtes HTTP faites par le téléphone lui-même.
// - App Android (Capacitor) : la couche native fait la requête, donc pas de blocage CORS.
// - `npm run dev` sur ordinateur : passage par le proxy de développement de Vite (/__yt).
// - Site web publié : impossible (le navigateur bloque les requêtes vers youtube.com).
import { Capacitor, CapacitorHttp } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()
export const canUseLocal = () => isNative() || import.meta.env.DEV

function headersToObject(h: Headers) {
  const out: Record<string, string> = {}
  h.forEach((v, k) => (out[k] = v))
  return out
}

export const localFetch: typeof fetch = async (input, init) => {
  const req = new Request(input as RequestInfo, init)
  if (!isNative()) {
    // Dev : réécriture vers le proxy Vite, qui relaie vers youtube.com.
    const url = new URL(req.url)
    const proxied = url.host === 'www.youtube.com' ? `/__yt${url.pathname}${url.search}` : req.url
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text()
    return fetch(proxied, { method: req.method, headers: req.headers, body })
  }
  const headers = headersToObject(req.headers)
  let data: unknown
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const text = await req.text()
    const isJson = (headers['content-type'] ?? '').includes('json')
    try {
      data = isJson && text ? JSON.parse(text) : text
    } catch {
      data = text
    }
  }
  const res = await CapacitorHttp.request({ url: req.url, method: req.method, headers, data, responseType: 'text' })
  const body = res.data == null ? '' : typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
  // On ne recopie que des en-têtes sûrs : Android en renvoie certains (ligne de statut,
  // valeurs multiples) que le constructeur Response refuse.
  const outHeaders = new Headers()
  for (const [k, v] of Object.entries(res.headers ?? {})) {
    if (!k || k === 'null' || /encoding|length/i.test(k)) continue
    try {
      outHeaders.set(k, String(v))
    } catch {
      /* en-tête invalide ignoré */
    }
  }
  const status = res.status >= 200 && res.status <= 599 ? res.status : 500
  return new Response([101, 204, 205, 304].includes(status) ? null : body, { status, headers: outHeaders })
}
