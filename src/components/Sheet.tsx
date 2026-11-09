import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/** Feuille qui monte du bas de l'écran (menus, commentaires, téléchargement). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null
  return createPortal(
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>,
    document.body,
  )
}
