// Traduction automatique des titres et descriptions, regroupée en lots et mise en cache.
// Les titres de musique ne sont pas traduits ; ce qui est déjà dans la langue choisie non plus.
import { useEffect, useState } from 'react'
import { getSettings, useSettings } from './storage'
import { langScore } from './i18n'
import { translateAll } from './translate'

const MUSIC = /(official (music )?video|clip officiel|lyrics?|paroles|audio officiel|official audio|music video|\bft\.|\bfeat\.|\bremix\b|\(live\)|visualizer|\bprod\.?)/i
export const isMusicTitle = (t: string) => MUSIC.test(t) || /^[^-–]{2,40}\s[-–]\s[^-–]{2,60}$/.test(t)

export function needsTranslation(text: string, lang: string, music = false) {
  if (!text || !getSettings().translateTitles) return false
  if (music || isMusicTitle(text)) return false
  const letters = text.replace(/[^\p{L}]/gu, '')
  if (letters.length < 8) return false
  return langScore(text, lang) <= 0
}

const KEY = 'youfree:tr'
const mem: Record<string, string> = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
})()
let queue: { text: string; lang: string; done: (t: string) => void }[] = []
let timer: number | undefined
function flush() {
  const batch = queue
  queue = []
  const byLang = new Map<string, typeof batch>()
  batch.forEach((q) => byLang.set(q.lang, [...(byLang.get(q.lang) ?? []), q]))
  byLang.forEach((items, lang) =>
    translateAll(
      items.map((i) => i.text),
      lang,
    ).then((out) => {
      items.forEach((it, i) => ((mem[lang + it.text] = out[i]), it.done(out[i])))
      try {
        const keys = Object.keys(mem)
        if (keys.length > 3000) keys.slice(0, 1000).forEach((k) => delete mem[k])
        localStorage.setItem(KEY, JSON.stringify(mem))
      } catch {
        /* ignore */
      }
    }),
  )
}

/** Texte traduit si nécessaire (l'original s'affiche d'abord). */
export function useTr(text: string, music = false) {
  const { lang, translateTitles } = useSettings()
  const need = translateTitles && needsTranslation(text, lang, music)
  const [out, setOut] = useState(need ? mem[lang + text] ?? text : text)
  useEffect(() => {
    if (!need) return setOut(text)
    if (mem[lang + text]) return setOut(mem[lang + text])
    let ok = true
    queue.push({ text, lang, done: (t) => ok && setOut(t) })
    clearTimeout(timer)
    timer = window.setTimeout(flush, 60)
    return () => {
      ok = false
    }
  }, [text, lang, need])
  return out
}
