// Lecture et téléchargement sans pub : le téléphone récupère lui-même les flux.
// Plusieurs clients InnerTube sont essayés : le premier qui renvoie des URL directes gagne.
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Fmt {
  url: string
  height: number
  mime: string
  bitrate: number
  audio: boolean
  video: boolean
}
export interface Streams {
  video: string
  audio?: string
  height: number
  qualities: { height: number; url: string }[]
  formats: Fmt[]
  client: string
  /** Flux HLS (vidéo + son, qualité adaptative jusqu'en 1080p et plus) si le lecteur sait le lire. */
  hls?: string
  /** Durée de chaque tentative de récupération des flux (diagnostic de lenteur). */
  timings: string[]
}

export const canHls = () => !!document.createElement('video').canPlayType('application/vnd.apple.mpegurl')

const CLIENTS = ['ANDROID_VR', 'IOS', 'ANDROID'] as const
const cache = new Map<string, Promise<Streams>>()
export let lastStreamError = ''

async function fetchStreams(id: string, skip?: string): Promise<Streams> {
  const yt = await (await import('./innertube')).getClient()
  const errors: string[] = []
  const timings: string[] = []
  const t0 = performance.now()
  const lap = (label: string) => timings.push(`${label} : ${Math.round(performance.now() - t0)} ms`)
  const best = localStorage.getItem('youfree:client')
  const order = (best ? [best, ...CLIENTS.filter((c) => c !== best)] : [...CLIENTS]).filter((c) => c !== skip)
  for (const client of order as (typeof CLIENTS)[number][]) {
    try {
      const info: any = await yt.getBasicInfo(id, { client })
      lap(`réponse ${client}`)
      const sd = info.streaming_data
      if (sd && !skip) localStorage.setItem('youfree:client', client)
      if (!sd) throw new Error(info.playability_status?.reason || info.playability_status?.status || 'pas de flux')
      const formats: Fmt[] = [...(sd.formats ?? []), ...(sd.adaptive_formats ?? [])]
        .filter((f: any) => f.url)
        .map((f: any) => ({ url: f.url, height: f.height ?? 0, mime: f.mime_type ?? '', bitrate: f.bitrate ?? 0, audio: !!f.has_audio, video: !!f.has_video }))
      const hls: string | undefined = sd.hls_manifest_url && canHls() ? sd.hls_manifest_url : undefined
      if (!formats.length && !hls) throw new Error('URL chiffrées')
      const audio = formats.filter((f) => f.audio && !f.video).sort((a, b) => (/mp4/.test(b.mime) ? 1 : 0) - (/mp4/.test(a.mime) ? 1 : 0) || b.bitrate - a.bitrate)[0]
      const byH = new Map<number, Fmt>()
      // Tous les codecs lisibles par le téléphone (H.264, VP9, AV1) ; à hauteur égale on préfère H.264 puis VP9.
      const probe = document.createElement('video')
      const rank = (f: Fmt) => (/avc1/.test(f.mime) ? 3 : /vp0?9/.test(f.mime) ? 2 : 1)
      formats
        .filter((f) => f.video && !f.audio && probe.canPlayType(f.mime.replace(/\+/g, ' ')))
        .forEach((f) => {
          const cur = byH.get(f.height)
          if (!cur || rank(f) > rank(cur) || (rank(f) === rank(cur) && f.bitrate > cur.bitrate)) byH.set(f.height, f)
        })
      const qualities = [...byH.values()].sort((a, b) => b.height - a.height).map((f) => ({ height: f.height, url: f.url }))
      if (audio && qualities.length) {
        const pick = qualities.find((q) => q.height <= 720) ?? qualities[qualities.length - 1]
        return { video: pick.url, audio: audio.url, height: pick.height, qualities, formats, client, hls, timings }
      }
      const prog = formats.filter((f) => f.audio && f.video).sort((a, b) => b.height - a.height)[0]
      if (!prog && !hls) throw new Error('aucun format lisible')
      return { video: prog?.url ?? hls!, height: prog?.height ?? 720, qualities: prog ? [{ height: prog.height, url: prog.url }] : [], formats, client, hls, timings }
    } catch (e) {
      errors.push(`${client}: ${(e as Error).message}`)
      lap(`échec ${client}`)
    }
  }
  lastStreamError = errors.join(' · ')
  throw new Error(lastStreamError)
}

export function getStreams(id: string): Promise<Streams> {
  if (!cache.has(id)) {
    const p = fetchStreams(id)
    cache.set(id, p)
    p.catch(() => cache.delete(id))
    if (cache.size > 80) cache.delete(cache.keys().next().value!)
    setTimeout(() => cache.delete(id), 4 * 3600_000)
  }
  return cache.get(id)!
}

/** Nouvelle récupération avec un autre client (pistes différentes), sans cache. */
export const getStreamsOther = (id: string, skip: string) => fetchStreams(id, skip)

/** Options de téléchargement : meilleure vidéo par hauteur (jusqu'à 4K) + piste audio compatible. */
export function downloadOptions(s: Streams) {
  const best = new Map<number, Fmt>()
  for (const f of s.formats.filter((f) => f.video && !f.audio)) {
    const cur = best.get(f.height)
    // VP9 (webm) au-delà de 1080p, H.264 (mp4) sinon : compatibles avec le multiplexeur Android.
    // H.264 puis VP9 puis AV1 (AV1 assemblé en MP4 : Android 14 et plus).
    const pref = (x: Fmt) => (/avc1/.test(x.mime) ? 3 : /vp0?9/.test(x.mime) ? 2 : 1)
    if (!cur || pref(f) > pref(cur) || (pref(f) === pref(cur) && f.bitrate > cur.bitrate)) best.set(f.height, f)
  }
  return [...best.values()]
    .sort((a, b) => b.height - a.height)
    .map((v) => {
      const webm = /webm/.test(v.mime)
      const audio = s.formats.filter((f) => f.audio && !f.video && (webm ? /webm/.test(f.mime) : /mp4/.test(f.mime))).sort((a, b) => b.bitrate - a.bitrate)[0]
      return { height: v.height, video: v, audio, ext: webm ? 'webm' : 'mp4' }
    })
    .filter((o) => o.audio)
}
