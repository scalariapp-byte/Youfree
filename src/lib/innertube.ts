// Mode « sans clé » : le téléphone interroge YouTube directement (API interne InnerTube,
// via youtubei.js). Aucune clé, aucun quota, aucun serveur intermédiaire.
// Les réponses sont demandées en anglais pour pouvoir analyser dates et compteurs.
import { Innertube } from 'youtubei.js/web'
import { localFetch } from './nativeFetch'
import { getSettings, type LocalChannel } from './storage'
import type { Channel, Comment, Video } from './youtube'

/* eslint-disable @typescript-eslint/no-explicit-any */

let client: Promise<Innertube> | null = null
let clientRegion = ''
function yt() {
  const region = getSettings().region
  if (!client || clientRegion !== region) {
    clientRegion = region
    client = Innertube.create({
      lang: 'en',
      location: region,
      retrieve_player: false,
      generate_session_locally: true,
      fetch: localFetch,
    }).catch((e) => {
      client = null
      throw e
    })
  }
  return client
}

// ---------- Analyse des textes renvoyés par YouTube

const txt = (t: any): string => (t == null ? '' : typeof t === 'string' ? t : (t.text ?? t.toString?.() ?? ''))

export function parseCount(s = ''): number {
  const m = s.replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i)
  if (!m) return 0
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] ?? '').toUpperCase() as 'K' | 'M' | 'B'] ?? 1
  return Math.round(parseFloat(m[1]) * mult)
}

/** « 3 days ago », « Streamed 2 weeks ago » → horodatage ISO approximatif. */
export function parseRelative(s = ''): string {
  const m = s.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/i)
  if (!m) {
    const d = Date.parse(s.replace(/^(Premiered|Streamed live on|Started streaming on)\s*/i, ''))
    return isNaN(d) ? '' : new Date(d).toISOString()
  }
  const sec = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2592000, year: 31536000 }[
    m[2].toLowerCase() as 'day'
  ]
  return new Date(Date.now() - Number(m[1]) * sec * 1000).toISOString()
}

export function parseClock(s = ''): number {
  if (!/^\d+(:\d+)+$/.test(s.trim())) return 0
  return s
    .trim()
    .split(':')
    .reduce((a, x) => a * 60 + Number(x), 0)
}

/** Cherche dans un arbre de nœuds la première chaîne qui correspond. */
function findString(node: any, re: RegExp, depth = 0, seen = new Set<any>()): string {
  if (node == null || depth > 9) return ''
  if (typeof node === 'string') return re.test(node) ? node : ''
  if (typeof node !== 'object' || seen.has(node)) return ''
  seen.add(node)
  if (typeof node.text === 'string' && re.test(node.text)) return node.text
  for (const v of Object.values(node)) {
    const r = findString(v, re, depth + 1, seen)
    if (r) return r
  }
  return ''
}

/** Cherche un identifiant de chaîne (UC…) dans un nœud. */
function findChannelId(node: any): string {
  const s = findString(node, /^UC[\w-]{22}$/)
  return s
}

const thumbFor = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
const bestThumb = (arr: any): string => {
  if (!Array.isArray(arr) || !arr.length) return ''
  const t = [...arr].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
  const url: string = t.url ?? ''
  return url.startsWith('//') ? 'https:' + url : url
}

/** Convertit n'importe quel nœud « vidéo » (Video, GridVideo, CompactVideo, LockupView…) en Video. */
function toVideo(n: any, fallbackChannel?: { id: string; title: string }): Video | null {
  if (!n) return null
  const type: string = n.type ?? n.constructor?.type ?? ''
  if (type === 'ShortsLockupView' || type === 'ReelItem') {
    const id: string =
      n.on_tap_endpoint?.payload?.videoId ?? (type === 'ReelItem' ? n.id : String(n.entity_id ?? '').replace(/^shorts-shelf-item-/, ''))
    if (!id || id.length !== 11) return null
    const viewsTxt = txt(n.overlay_metadata?.secondary_text) || txt(n.views)
    return {
      id,
      title: txt(n.overlay_metadata?.primary_text) || txt(n.title) || String(n.accessibility_text ?? '').split(',')[0],
      description: '',
      channelId: fallbackChannel?.id ?? '',
      channelTitle: fallbackChannel?.title ?? '',
      publishedAt: '',
      thumbnail: `https://i.ytimg.com/vi/${id}/oar2.jpg`,
      durationSec: 0,
      views: parseCount(viewsTxt),
      likes: 0,
      categoryId: '',
      live: false,
      isShort: true,
    }
  }
  if (type === 'LockupView') {
    if (n.content_type !== 'VIDEO' || !n.content_id) return null
    const id: string = n.content_id
    const rows: any[] = n.metadata?.metadata?.metadata_rows ?? []
    const parts: string[] = rows.flatMap((r) => (r.metadata_parts ?? []).map((p: any) => txt(p.text))).filter(Boolean)
    const viewsTxt = parts.find((p) => /views?|watching/i.test(p)) ?? ''
    const agoTxt = parts.find((p) => /ago|Streamed|Premiered/i.test(p)) ?? ''
    const channelTitle = parts.find((p) => p !== viewsTxt && p !== agoTxt) ?? fallbackChannel?.title ?? ''
    const durationTxt = findString(n.content_image, /^\d+(:\d+)+$/)
    return {
      id,
      title: txt(n.metadata?.title),
      description: '',
      channelId: findChannelId(n.metadata) || fallbackChannel?.id || '',
      channelTitle,
      publishedAt: parseRelative(agoTxt),
      thumbnail: thumbFor(id),
      durationSec: parseClock(durationTxt),
      views: parseCount(viewsTxt),
      likes: 0,
      categoryId: '',
      live: /watching/i.test(viewsTxt) || !!findString(n.content_image, /^LIVE$/),
    }
  }
  const id: string = n.video_id ?? n.id
  if (!id || typeof id !== 'string' || id.length !== 11) return null
  const durationTxt = txt(n.length_text) || txt(n.duration?.text ?? n.duration) || findString(n.thumbnail_overlays, /^\d+(:\d+)+$/)
  const viewsTxt = txt(n.view_count) || txt(n.views) || txt(n.short_view_count)
  const durationSec = typeof n.duration?.seconds === 'number' && n.duration.seconds ? n.duration.seconds : parseClock(durationTxt)
  const liveBadge = (n.badges ?? []).some((b: any) => b?.style === 'BADGE_STYLE_TYPE_LIVE_NOW' || b?.label === 'LIVE')
  return {
    id,
    title: txt(n.title),
    description: txt(n.description_snippet) || (typeof n.description === 'string' ? n.description : ''),
    channelId: n.author?.id && n.author.id !== 'N/A' ? n.author.id : fallbackChannel?.id ?? '',
    channelTitle: n.author?.name && n.author.name !== 'N/A' ? n.author.name : fallbackChannel?.title ?? '',
    publishedAt: parseRelative(txt(n.published)),
    thumbnail: thumbFor(id),
    durationSec,
    views: parseCount(viewsTxt),
    likes: 0,
    categoryId: '',
    live: !durationSec && (liveBadge || /watching/i.test(viewsTxt)),
    channelAvatar: bestThumb(n.author?.thumbnails) || undefined,
  }
}

function toVideos(nodes: any[] | undefined, fallbackChannel?: { id: string; title: string }): Video[] {
  const seen = new Set<string>()
  const out: Video[] = []
  for (const n of nodes ?? []) {
    const v = toVideo(n, fallbackChannel)
    if (v && !seen.has(v.id)) {
      seen.add(v.id)
      out.push(v)
    }
  }
  return out
}

// ---------- Pagination : youtubei.js garde l'état dans des objets, on les indexe par jeton.

const continuations = new Map<string, any>()
let tokenSeq = 0
function remember(feed: any): string | undefined {
  if (!feed?.has_continuation) return undefined
  const token = `c${++tokenSeq}`
  continuations.set(token, feed)
  return token
}
async function resume(token: string) {
  const feed = continuations.get(token)
  continuations.delete(token)
  if (!feed) throw new Error('Page suivante expirée')
  return feed.getContinuation()
}

// ---------- API publique (mêmes signatures que le mode clé API)

// « Tendances » n'existe plus côté YouTube : on prend les vidéos les plus populaires
// de la semaine pour un thème donné.
const THEME_QUERIES: Record<string, string> = {
  '': 'vidéo',
  '10': 'musique clip officiel',
  '25': 'actualités',
  '28': 'science technologie',
  '27': 'éducation documentaire',
  '17': 'sport résumé',
  '24': 'divertissement',
  '23': 'humour sketch',
  '1': 'film bande annonce',
  '26': 'cuisine recette',
  '2': 'auto essai',
}

/** Ouvre la session à l'avance pour que la première requête soit immédiate. */
export const warm = () => yt()
export const getClient = () => yt()

export async function trending(categoryId?: string, pageToken?: string) {
  if (pageToken && continuations.has(pageToken)) {
    const r = await resume(pageToken)
    return { videos: toVideos(r.videos), next: remember(r) }
  }
  const q = THEME_QUERIES[categoryId ?? ''] ?? THEME_QUERIES['']
  const r = await (await yt()).search(q, { upload_date: 'week', type: 'video', prioritize: 'popularity' })
  return { videos: toVideos(r.videos), next: remember(r) }
}

export async function suggest(q: string) {
  return (await yt()).getSearchSuggestions(q).catch(() => [] as string[])
}

export async function search(q: string, pageToken?: string, filter = '') {
  const f: any = { type: 'video' }
  if (filter === 'short') f.duration = 'under_three_mins'
  if (filter === 'long') f.duration = 'over_twenty_mins'
  if (filter === 'today' || filter === 'week' || filter === 'month') f.upload_date = filter
  if (filter === 'popular') f.prioritize = 'popularity'
  const r = pageToken && continuations.has(pageToken) ? await resume(pageToken) : await (await yt()).search(q, f)
  return { videos: toVideos(r.videos), next: remember(r) }
}

export async function shorts(q: string, pageToken?: string) {
  const r = pageToken && continuations.has(pageToken) ? await resume(pageToken) : await (await yt()).search(q, { type: 'shorts' })
  // On ne garde que de vrais formats courts (la recherche peut mêler des vidéos classiques).
  const videos = toVideos(r.videos)
    .filter((v) => v.isShort || (v.durationSec > 0 && v.durationSec <= 180))
    .map((v) => ({ ...v, isShort: true }))
  return { videos, next: remember(r) }
}

export async function channelShorts(channelId: string) {
  const c: any = await rawChannel(channelId)
  if (!c.has_shorts) return { videos: [] as Video[], next: undefined as string | undefined }
  const tab = await c.getShorts()
  const fallback = { id: channelId, title: c.metadata?.title ?? '' }
  return { videos: toVideos(tab.videos, fallback).map((v) => ({ ...v, isShort: true })), next: remember(tab) }
}

export async function video(id: string): Promise<Video> {
  const y = await yt()
  // /next suffit pour les métadonnées et ne déclenche pas la vérification anti-robot du lecteur.
  const res: any = await y.actions.execute('/next', { videoId: id, parse: true })
  const memo = res.contents_memo
  const primary: any = memo?.get('VideoPrimaryInfo')?.[0]
  const secondary: any = memo?.get('VideoSecondaryInfo')?.[0]
  if (!primary) throw new Error('Vidéo introuvable ou indisponible')
  const owner = secondary?.owner?.author
  const likeTxt = findString(primary.menu, /^[\d.,]+[KMB]?$/) || findString(primary.menu, /like this video along with ([\d,]+)/i)
  const viewsTxt = txt(primary.view_count?.original_view_count) || txt(primary.view_count?.view_count) || txt(primary.view_count?.short_view_count)
  return {
    id,
    title: txt(primary.title),
    description: txt(secondary?.description),
    channelId: owner?.id ?? '',
    channelTitle: owner?.name ?? '',
    publishedAt: parseRelative(txt(primary.published)) || parseRelative(txt(primary.relative_date)),
    thumbnail: thumbFor(id),
    durationSec: 0,
    views: parseCount(viewsTxt),
    likes: parseCount(likeTxt.replace(/^.*along with /i, '')),
    categoryId: '',
    live: /watching/i.test(viewsTxt),
  }
}

const channelCache = new Map<string, any>()
async function rawChannel(id: string) {
  if (!channelCache.has(id)) {
    const p = (await yt()).getChannel(id)
    channelCache.set(id, p)
    p.catch(() => channelCache.delete(id))
  }
  return channelCache.get(id)
}

export async function channel(id: string): Promise<Channel> {
  const c: any = await rawChannel(id)
  const meta = c.metadata ?? {}
  const header = c.header
  const banner = bestThumb(header?.banner?.image ?? header?.content?.banner?.image ?? header?.banner)
  return {
    id,
    title: meta.title ?? '',
    description: meta.description ?? '',
    thumbnail: bestThumb(meta.avatar ?? meta.thumbnail),
    subscribers: parseCount(findString(header, /subscribers?$/i)),
    videoCount: parseCount(findString(header, /videos?$/i)),
    banner: banner || undefined,
    uploadsPlaylist: 'UU' + id.slice(2),
  }
}

/** Vidéos d'une chaîne (onglet « Vidéos » : les Shorts n'y figurent pas) ou d'une playlist. */
export async function playlistVideos(playlistId: string, _max = 30, pageToken?: string) {
  if (pageToken && continuations.has(pageToken)) {
    const r = await resume(pageToken)
    return { videos: toVideos(r.videos), next: remember(r) }
  }
  if (playlistId.startsWith('UU')) {
    const channelId = 'UC' + playlistId.slice(2)
    const c: any = await rawChannel(channelId)
    const fallback = { id: channelId, title: c.metadata?.title ?? '' }
    const tab = await c.getVideos()
    return { videos: toVideos(tab.videos, fallback), next: remember(tab) }
  }
  const p: any = await (await yt()).getPlaylist(playlistId)
  return { videos: toVideos(p.videos), next: remember(p) }
}

export async function comments(id: string): Promise<Comment[]> {
  try {
    const r: any = await (await yt()).getComments(id)
    return (r.contents ?? [])
      .map((t: any) => t.comment)
      .filter(Boolean)
      .map((c: any) => ({
        id: c.comment_id,
        author: c.author?.name ?? '',
        authorAvatar: bestThumb(c.author?.thumbnails),
        text: txt(c.content),
        likes: parseCount(c.like_count ?? ''),
        publishedAt: parseRelative(c.published_time ?? ''),
      }))
  } catch {
    return []
  }
}

/** Fil d'abonnements : dernières vidéos de chaque chaîne, triées par date. */
export async function subscriptionFeed(channels: LocalChannel[]): Promise<Video[]> {
  const results: Video[][] = []
  let i = 0
  const worker = async () => {
    while (i < channels.length) {
      const c = channels[i++]
      try {
        results.push((await playlistVideos('UU' + c.id.slice(2))).videos.slice(0, 8).map((v) => ({ ...v, channelId: c.id, channelTitle: v.channelTitle || c.title })))
      } catch {
        /* chaîne indisponible : on l'ignore */
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, channels.length) }, worker))
  return results
    .flat()
    .filter((v) => v.publishedAt)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 150)
}
