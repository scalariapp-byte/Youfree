import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth'
import { useLocalSubs, type LocalChannel } from './storage'
import { getMySubscriptions } from './youtube'

let googleSubsCache: { token: string; subs: LocalChannel[] } | null = null

/** Abonnements Google (si connecté) + abonnements locaux, sans doublons. */
export function useAllSubs() {
  const { token } = useAuth()
  const local = useLocalSubs()
  const [google, setGoogle] = useState<LocalChannel[]>(token && googleSubsCache?.token === token ? googleSubsCache.subs : [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setGoogle([])
      return
    }
    if (googleSubsCache?.token === token) {
      setGoogle(googleSubsCache.subs)
      return
    }
    setLoading(true)
    getMySubscriptions()
      .then((subs) => {
        googleSubsCache = { token, subs }
        setGoogle(subs)
      })
      .catch(() => setGoogle([]))
      .finally(() => setLoading(false))
  }, [token])

  const all = useMemo(() => {
    const map = new Map<string, LocalChannel>()
    ;[...google, ...local].forEach((c) => map.set(c.id, c))
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title, 'fr'))
  }, [google, local])

  return { all, google, local, loading }
}
