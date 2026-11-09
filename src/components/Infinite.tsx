import { useEffect, useRef, useState } from 'react'

/** Charge la suite automatiquement quand on approche du bas de la liste. */
export function Infinite({ hasMore, onMore }: { hasMore: boolean; onMore: () => Promise<unknown> }) {
  const ref = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const [error, setError] = useState(false)
  const more = useRef(onMore)
  more.current = onMore
  useEffect(() => {
    const el = ref.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || busy.current) return
        busy.current = true
        more
          .current()
          .then(() => setError(false), () => setError(true))
          .finally(() => (busy.current = false))
      },
      { rootMargin: '1200px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, error])
  if (!hasMore) return null
  return (
    <div ref={ref} className="infinite">
      {error ? (
        <button className="btn ghost" onClick={() => setError(false)}>
          Réessayer
        </button>
      ) : (
        <span className="spinner" />
      )}
    </div>
  )
}
