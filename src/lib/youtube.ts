// Point d'entrée des données : tout passe par le téléphone (InnerTube via youtubei.js),
// sans clé ni quota. Le module lourd est chargé une seule fois, dès le démarrage.
import { getSettings, type LocalChannel } from './storage'
import { canUseLocal } from './nativeFetch'

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
  /** Format vertical court (Shorts). */
  isShort?: boolean
  channelAvatar?: string
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

export type SearchFilter = '' | 'short' | 'long' | 'today' | 'week' | 'month' | 'popular'

const local = () => import('./innertube')
/** Préchauffage : charge le module et ouvre la session YouTube pendant l'affichage. */
export const warmUp = () => canUseLocal() && local().then((m) => m.warm()).catch(() => {})

export const isAvailable = canUseLocal
export const uploadsOf = (channelId: string) => 'UU' + channelId.slice(2)

export const GAMING_CATEGORY = '20'
export function applyFilters(videos: Video[]): Video[] {
  const { hideGaming } = getSettings()
  return videos.filter((v) => v.id && !(hideGaming && v.categoryId === GAMING_CATEGORY))
}

export const isShortVideo = (v: Video) =>
  !!v.isShort || (!v.live && v.durationSec > 0 && v.durationSec <= 60) || /#shorts?\b/i.test(v.title)

/** Sépare Shorts et vidéos classiques, sans doublons. */
export function splitShorts(list: Video[]) {
  const videos: Video[] = []
  const shorts: Video[] = []
  const seen = new Set<string>()
  for (const v of list) {
    if (seen.has(v.id)) continue
    seen.add(v.id)
    ;(isShortVideo(v) ? shorts : videos).push(v)
  }
  return { videos, shorts }
}

const SHORTS_QUERIES: Record<string, string> = {
  '': 'shorts', '10': 'musique shorts', '25': 'actualité shorts', '28': 'tech shorts', '27': 'apprendre shorts',
  '17': 'sport shorts', '24': 'drôle shorts', '23': 'humour shorts', '1': 'film shorts', '26': 'recette shorts', '2': 'voiture shorts',
}

const filtered = async (p: Promise<{ videos: Video[]; next?: string }>) => {
  const r = await p
  return { videos: applyFilters(r.videos), next: r.next }
}

export const getVideos = async (ids: string[]) => {
  const l = await local()
  return Promise.all(ids.map((id) => l.video(id)))
}
export const getTrending = async (cat?: string, token?: string) => filtered((await local()).trending(cat, token))
export const search = async (q: string, token?: string, filter: SearchFilter = '') => filtered((await local()).search(q, token, filter))
export const suggest = async (q: string) => (q.trim() ? (await local()).suggest(q) : [])
export const getChannel = async (id: string) => (await local()).channel(id)
export const getPlaylistVideos = async (id: string, max = 30, token?: string) => (await local()).playlistVideos(id, max, token)
export const getComments = async (id: string) => (await local()).comments(id)
export const getShorts = async (cat?: string, token?: string) => filtered((await local()).shorts(SHORTS_QUERIES[cat ?? ''] ?? 'shorts', token))
export const getChannelShorts = async (id: string) => (await local()).channelShorts(id)

const FEED_CACHE = 'youfree:feed'
/** Fil d'abonnements chronologique, mis en cache 15 min. */
export async function getSubscriptionFeed(channels: LocalChannel[], force = false): Promise<Video[]> {
  const key = channels.map((c) => c.id).sort().join(',')
  if (!force) {
    try {
      const c = JSON.parse(sessionStorage.getItem(FEED_CACHE) || 'null')
      if (c?.key === key && Date.now() - c.at < 15 * 60_000) return applyFilters(c.videos)
    } catch {
      /* ignore */
    }
  }
  const videos = await (await local()).subscriptionFeed(channels)
  try {
    sessionStorage.setItem(FEED_CACHE, JSON.stringify({ key, at: Date.now(), videos }))
  } catch {
    /* ignore */
  }
  return applyFilters(videos)
}
