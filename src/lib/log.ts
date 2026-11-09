// Journal de l'appli (erreurs, lectures, son) : joint au rapport envoyé depuis les paramètres.
const KEY = 'youfree:log'
let lines: string[] = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
})()
let t: number | undefined

export function log(cat: string, msg: string) {
  const d = new Date()
  lines.push(`${d.toTimeString().slice(0, 8)} [${cat}] ${msg}`.slice(0, 400))
  if (lines.length > 250) lines = lines.slice(-250)
  clearTimeout(t)
  t = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {
      /* ignore */
    }
  }, 500)
}
export const getLog = () => lines.slice()
export const clearLog = () => ((lines = []), localStorage.removeItem(KEY))

// Erreurs non interceptées.
window.addEventListener('error', (e) => log('erreur', `${e.message} @ ${(e.filename || '').split('/').pop()}:${e.lineno}`))
window.addEventListener('unhandledrejection', (e) => log('promesse', String((e.reason as Error)?.message ?? e.reason)))
