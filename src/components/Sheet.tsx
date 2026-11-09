import { createPortal } from 'react-dom'
import { useRef, useState, type ReactNode } from 'react'

/** Feuille qui monte du bas : se ferme en glissant vers le bas (depuis le haut du contenu). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const start = useRef<number | null>(null)
  const [dy, setDy] = useState(0)
  if (!open) return null
  const onStart = (y: number) => {
    // On ne capte le geste que si le contenu est déjà tout en haut.
    start.current = (ref.current?.scrollTop ?? 0) <= 0 ? y : null
  }
  const onMove = (y: number) => {
    if (start.current === null) return
    const d = y - start.current
    if (d > 0) setDy(d)
    else if (d < -10) start.current = null
  }
  const onEnd = () => {
    if (dy > 110) onClose()
    setDy(0)
    start.current = null
  }
  return createPortal(
    <div className="sheet-back" onClick={onClose} style={{ opacity: dy ? Math.max(0.3, 1 - dy / 400) : undefined }}>
      <div
        ref={ref}
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => onStart(e.touches[0].clientY)}
        onTouchMove={(e) => onMove(e.touches[0].clientY)}
        onTouchEnd={onEnd}
        style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}
      >
        <div className="sheet-grip" />
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>,
    document.body,
  )
}
