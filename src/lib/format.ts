const nf = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })
export const compact = (n: number) => nf.format(n)

export function duration(sec: number) {
  if (!sec) return ''
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const pad = (x: number) => String(x).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
export function ago(iso: string | number) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u)
  return 'à l’instant'
}

/** Décode les entités HTML renvoyées par l'API (ex. &#39;). */
export function decode(s: string) {
  const t = document.createElement('textarea')
  t.innerHTML = s
  return t.value
}
