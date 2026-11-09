// Client minimal de l'API YouTube Data v3.
import { accessToken } from './auth'
import { apiKey } from './config'
import { getSettings, type LocalChannel } from './storage'

const BASE = 'https://www.googleapis.com/youtube/v3/'

export interface Video {
  id: string
  title: string
  description: string
  channelId: string
  channelTitle: string
  publishedAt: string
  thumbnail: string
  durationSec: number
  views: number
  likes: number
  categoryId: string
  live: boolean
}

export interface Channel extends LocalChannel {
  description: string
  subscribers: number
  videoCount: number
  banner?: string
  uploadsPlaylist: string
}

export interface Comment {
  id: string
  author: string
  authorAvatar: string
  text: string
  likes: number
  publishedAt: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: 'nokey' | 'quota' | 'auth' | 'other',
  ) {
    super(message)
  }
}

export const hasCredentials = () => !!(apiKey() || accessToken())

async function call<T = any>(path: string, params: Record<string, string | number | undefined>, needAuth = false): Promise<T> {
  const url = new URL(BASE + path)
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, String(v)))
  const headers: Record<string, string> = {}
  const token = accessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  else if (needAuth) throw new ApiError('Connexion Google requise', 'auth')
  else if (apiKey()) url.searchParams.set('key', apiKey())
  else throw new ApiError('Aucune clé API configurée', 'nokey')

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const reason = body?.error?.errors?.[0]?.reason as string | undefined
    const msg = body?.error?.message || `Erreur ${res.status}`
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') throw new ApiError('Quota quotidien de l’API dépassé (remis à zéro à 9h, heure de Paris).', 'quota')
    if (res.status === 401) throw new ApiError('Session Google expirée, reconnecte-toi.', 'auth')
    throw new ApiError(msg, 'other')
  }
  return res.json()
}

export function parseDuration(iso = ''): number {
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  const [, d, h, mi, s] = m.map((x) => Number(x) || 0)
  return d * 86400 + h * 3600 + mi * 60 + s
}

const bestThumb = (t: any) => t?.maxres?.url || t?.high?.url || t?.medium?.url || t?.default?.url || ''

function toVideo(item: any): Video {
  const s = item.snippet ?? {}
  return {
    id: typeof item.id === 'string' ? item.id : item.id?.videoId,
    title: s.title ?? '',
    description: s.description ?? '',
    channelId: s.channelId ?? '',
    channelTitle: s.channelTitle ?? '',
    publishedAt: s.publishedAt ?? '',
    thumbnail: bestThumb(s.thumbnails),
    durationSec: parseDuration(item.contentDetails?.duration),
    views: Number(item.statistics?.viewCount ?? 0),
    likes: Number(item.statistics?.likeCount ?? 0),
    categoryId: s.categoryId ?? '',
    live: s.liveBroadcastContent === 'live' || s.liveBroadcastContent === 'upcoming',
  }
}

// Catégorie 20 = « Jeux vidéo ».
export const GAMING_CATEGORY = '20'

/** Applique les filtres utilisateur : Shorts et jeux vidéo. */
export function applyFilters(videos: Video[]): Video[] {
  const { hideShorts, hideGaming } = getSettings()
  return videos.filter((v) => {
    if (!v.id) return false
    if (hideShorts && !v.live && v.durationSec > 0 && v.durationSec <= 60) return false
    if (hideShorts && /#shorts?\b/i.test(v.title + ' ' + v.description.slice(0, 300))) return false
    if (hideGaming && v.categoryId === GAMING_CATEGORY) return false
    return true
  })
}

/** Détails complets de vidéos (50 max par appel, 1 unité de quota). */
export async function getVideos(ids: string[]): Promise<Video[]> {
  const out: Video[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    const data = await call('videos', { part: 'snippet,contentDetails,statistics', id: chunk.join(','), maxResults: 50 })
    out.push(...data.items.map(toVideo))
  }
  const order = new Map(ids.map((id, i) => [id, i]))
  return out.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

export async function getTrending(categoryId?: string, pageToken?: string) {
  const data = await call('videos', {
    part: 'snippet,contentDetails,statistics',
    chart: 'mostPopular',
    regionCode: getSettings().region,
    videoCategoryId: categoryId,
    maxResults: 36,
    pageToken,
  })
  return { videos: applyFilters(data.items.map(toVideo)), next: data.nextPageToken as string | undefined }
}

/** Recherche (100 unités de quota) + détails (1 unité). */
export async function search(q: string, pageToken?: string) {
  const data = await call('search', {
    part: 'snippet',
    type: 'video',
    q,
    maxResults: 30,
    regionCode: getSettings().region,
    safeSearch: 'none',
    pageToken,
  })
  const ids = data.items.map((i: any) => i.id.videoId).filter(Boolean)
  const videos = ids.length ? await getVideos(ids) : []
  return { videos: applyFilters(videos), next: data.nextPageToken as string | undefined }
}

export async function getChannel(id: string): Promise<Channel> {
  const data = await call('channels', { part: 'snippet,statistics,contentDetails,brandingSettings', id })
  const c = data.items?.[0]
  if (!c) throw new ApiError('Chaîne introuvable', 'other')
  return {
    id: c.id,
    title: c.snippet.title,
    description: c.snippet.description,
    thumbnail: bestThumb(c.snippet.thumbnails),
    subscribers: Number(c.statistics.subscriberCount ?? 0),
    videoCount: Number(c.statistics.videoCount ?? 0),
    banner: c.brandingSettings?.image?.bannerExternalUrl,
    uploadsPlaylist: c.contentDetails.relatedPlaylists.uploads,
  }
}

/** Les playlists d'uploads ont l'ID de la chaîne avec « UU » au lieu de « UC ». */
export const uploadsOf = (channelId: string) => 'UU' + channelId.slice(2)

export async function getPlaylistVideos(playlistId: string, max = 24, pageToken?: string) {
  const data = await call('playlistItems', { part: 'contentDetails', playlistId, maxResults: Math.min(max, 50), pageToken })
  const ids = data.items.map((i: any) => i.contentDetails.videoId)
  const videos = ids.length ? await getVideos(ids) : []
  return { videos, next: data.nextPageToken as string | undefined }
}

export async function getComments(videoId: string): Promise<Comment[]> {
  try {
    const data = await call('commentThreads', { part: 'snippet', videoId, maxResults: 30, order: 'relevance', textFormat: 'plainText' })
    return data.items.map((t: any) => {
      const s = t.snippet.topLevelComment.snippet
      return {
        id: t.id,
        author: s.authorDisplayName,
        authorAvatar: s.authorProfileImageUrl,
        text: s.textDisplay,
        likes: s.likeCount,
        publishedAt: s.publishedAt,
      }
    })
  } catch (e) {
    if ((e as ApiError).code === 'other') return [] // commentaires désactivés
    throw e
  }
}

// ---------- Compte Google

export async function getMySubscriptions(): Promise<LocalChannel[]> {
  const out: LocalChannel[] = []
  let pageToken: string | undefined
  do {
    const data = await call('subscriptions', { part: 'snippet', mine: 'true', maxResults: 50, order: 'alphabetical', pageToken }, true)
    out.push(
      ...data.items.map((s: any) => ({
        id: s.snippet.resourceId.channelId,
        title: s.snippet.title,
        thumbnail: bestThumb(s.snippet.thumbnails),
      })),
    )
    pageToken = data.nextPageToken
  } while (pageToken && out.length < 1000)
  return out
}

export async function getLikedVideos(pageToken?: string) {
  const data = await call('videos', { part: 'snippet,contentDetails,statistics', myRating: 'like', maxResults: 36, pageToken }, true)
  return { videos: data.items.map(toVideo) as Video[], next: data.nextPageToken as string | undefined }
}

export interface Playlist {
  id: string
  title: string
  thumbnail: string
  count: number
}
export async function getMyPlaylists(): Promise<Playlist[]> {
  const data = await call('playlists', { part: 'snippet,contentDetails', mine: 'true', maxResults: 50 }, true)
  return data.items.map((p: any) => ({ id: p.id, title: p.snippet.title, thumbnail: bestThumb(p.snippet.thumbnails), count: p.contentDetails.itemCount }))
}

// ---------- Fil d'abonnements chronologique (sans algorithme)

const FEED_CACHE = 'youfree:feed'
const FEED_TTL = 15 * 60 * 1000

async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++]
        try {
          results.push(await fn(item))
        } catch (e) {
          if ((e as ApiError).code === 'quota') throw e
        }
      }
    }),
  )
  return results
}

/**
 * Récupère les dernières vidéos de chaque chaîne (1 unité par chaîne)
 * et les trie par date de publication. Mis en cache 15 min.
 */
export async function getSubscriptionFeed(channels: LocalChannel[], force = false): Promise<Video[]> {
  const key = channels.map((c) => c.id).sort().join(',')
  if (!force) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(FEED_CACHE) || 'null')
      if (cached && cached.key === key && Date.now() - cached.at < FEED_TTL) return applyFilters(cached.videos)
    } catch {
      /* ignore */
    }
  }
  const lists = await pool(channels, 8, async (c) => {
    const data = await call('playlistItems', { part: 'contentDetails', playlistId: uploadsOf(c.id), maxResults: 6 })
    return data.items.map((i: any) => ({ id: i.contentDetails.videoId as string, at: i.contentDetails.videoPublishedAt as string }))
  })
  const recent = lists
    .flat()
    .filter((x) => x.at)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 150)
  const videos = await getVideos(recent.map((x) => x.id))
  try {
    sessionStorage.setItem(FEED_CACHE, JSON.stringify({ key, at: Date.now(), videos }))
  } catch {
    /* ignore */
  }
  return applyFilters(videos)
}
