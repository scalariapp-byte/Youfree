import { useEffect, useState, type DependencyList } from 'react'

// Cache « instantané » : on affiche tout de suite la dernière réponse connue (mémoire,
// puis localStorage après un redémarrage), et on rafraîchit en arrière-plan si elle a vieilli.
const mem = new Map<string, { at: number; data: unknown }>()
const pending = new Map<string, Promise<unknown>>()
const LS = 'youfree:cache:'
const FRESH = 3 * 60_000

function load(key: string) {
  const m = mem.get(key)
  if (m) return m
  try {
    const raw = localStorage.getItem(LS + key)
    if (raw) {
      const v = JSON.parse(raw)
      mem.set(key, v)
      return v as { at: number; data: unknown }
    }
  } catch {
    /* ignore */
  }
  return undefined
}

const MAX_ENTRIES = 80

function store(key: string, data: unknown) {
  const v = { at: Date.now(), data }
  mem.set(key, v)
  if (mem.size > MAX_ENTRIES) mem.delete(mem.keys().next().value!)
  try {
    // Cache disque plafonné : on supprime les entrées les plus anciennes.
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(LS))
    if (keys.length >= MAX_ENTRIES) {
      keys
        .map((k) => [k, JSON.parse(localStorage.getItem(k) || '{"at":0}').at as number] as const)
        .sort((a, b) => a[1] - b[1])
        .slice(0, keys.length - MAX_ENTRIES + 10)
        .forEach(([k]) => localStorage.removeItem(k))
    }
    localStorage.setItem(LS + key, JSON.stringify(v))
  } catch {
    // Stockage plein : on vide l'ancien cache.
    Object.keys(localStorage)
      .filter((k) => k.startsWith(LS))
      .forEach((k) => localStorage.removeItem(k))
  }
}

export function fetchCached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!pending.has(key)) {
    const p = fn().then((d) => (store(key, d), d))
    pending.set(key, p)
    p.finally(() => pending.delete(key)).catch(() => {})
  }
  return pending.get(key) as Promise<T>
}

/** Précharge une donnée (ex. au toucher d'une vignette) pour que la page s'ouvre instantanément. */
export function prefetch<T>(key: string, fn: () => Promise<T>) {
  const c = load(key)
  if (!c || Date.now() - c.at > FRESH) fetchCached(key, fn).catch(() => {})
}

export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList, key?: string) {
  const initial = key ? (load(key)?.data as T | undefined) : undefined
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ data: initial, loading: !initial })
  useEffect(() => {
    let alive = true
    const cached = key ? load(key) : undefined
    if (cached) setState({ data: cached.data as T, loading: false })
    else setState((s) => ({ data: key ? undefined : s.data, loading: true }))
    if (cached && Date.now() - cached.at < FRESH) return
    ;(key ? fetchCached(key, fn) : fn()).then(
      (data) => alive && setState({ data, loading: false }),
      (error) => alive && !cached && setState({ error, loading: false }),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps])
  return state
}
