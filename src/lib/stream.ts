// Lecture sans pub : le téléphone récupère lui-même les flux vidéo/audio (client ANDROID_VR,
// qui renvoie des URL directes) et les lit dans des balises <video>/<audio>. Pas de lecteur YouTube.
import { Innertube } from 'youtubei.js/web'
import { localFetch } from './nativeFetch'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Streams {
  video: string
  audio?: string
  height: number
  qualities: { height: number; url: string }[]
}

let yt: Promise<Innertube> | null = null
const cache = new Map<string, Promise<Streams>>()

export function getStreams(id: string): Promise<Streams> {
  if (!cache.has(id)) {
    const p = (async () => {
      yt ??= Innertube.create({ retrieve_player: false, generate_session_locally: true, fetch: localFetch })
      const info: any = await (await yt).getBasicInfo(id, { client: 'ANDROID_VR' })
      const sd = info.streaming_data
      if (!sd) throw new Error(info.playability_status?.reason || 'Flux indisponible')
      const adaptive: any[] = (sd.adaptive_formats ?? []).filter((f: any) => f.url)
      const audio = adaptive
        .filter((f) => f.has_audio && !f.has_video && /mp4/.test(f.mime_type) && !f.is_drc)
        .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0]
      const byHeight = new Map<number, any>()
      adaptive
        .filter((f) => f.has_video && !f.has_audio && /avc1/.test(f.mime_type) && (f.height ?? 0) <= 1080)
        .forEach((f) => {
          const cur = byHeight.get(f.height)
          if (!cur || (f.fps ?? 30) > (cur.fps ?? 30)) byHeight.set(f.height, f)
        })
      const qualities = [...byHeight.values()].sort((a, b) => b.height - a.height).map((f) => ({ height: f.height, url: f.url }))
      if (audio && qualities.length) {
        const pick = qualities.find((q) => q.height <= 720) ?? qualities[qualities.length - 1]
        return { video: pick.url, audio: audio.url, height: pick.height, qualities }
      }
      const prog = (sd.formats ?? []).filter((f: any) => f.url).sort((a: any, b: any) => (b.height ?? 0) - (a.height ?? 0))[0]
      if (!prog) throw new Error('Aucun flux lisible')
      return { video: prog.url, height: prog.height ?? 360, qualities: [{ height: prog.height ?? 360, url: prog.url }] }
    })()
    cache.set(id, p)
    p.catch(() => cache.delete(id))
    setTimeout(() => cache.delete(id), 4 * 3600_000) // les URL expirent après ~6 h
  }
  return cache.get(id)!
}
