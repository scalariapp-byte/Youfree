import { useMemo } from 'react'
import { useLocalSubs } from './storage'

/** Abonnements (gardés sur l'appareil), triés par nom. */
export function useAllSubs() {
  const local = useLocalSubs()
  const all = useMemo(() => [...local].sort((a, b) => a.title.localeCompare(b.title, 'fr')), [local])
  return { all, local, google: [] as typeof local, loading: false }
}
