// Adaptation à la connexion : qualité de départ et préchargement selon le débit mesuré par le téléphone.
import { getSettings } from './storage'

/* eslint-disable @typescript-eslint/no-explicit-any */
const conn = () => (navigator as any).connection as { effectiveType?: string; downlink?: number; saveData?: boolean } | undefined

/** Connexion lente (ou économie de données) : pas de préchargement. */
export const isSlow = () => {
  const c = conn()
  return getSettings().dataSaver || !!c?.saveData || ['slow-2g', '2g', '3g'].includes(c?.effectiveType ?? '') || (c?.downlink ?? 10) < 1.5
}

/** Hauteur maximale de départ selon la connexion. */
export function netCap(): number {
  if (getSettings().dataSaver) return 360
  const c = conn()
  if (!c) return 4320
  if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g') return 144
  if (c.effectiveType === '3g' || (c.downlink ?? 10) < 1) return 240
  if ((c.downlink ?? 10) < 2.5) return 360
  if ((c.downlink ?? 10) < 5) return 480
  return 4320
}
