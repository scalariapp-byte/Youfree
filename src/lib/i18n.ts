import { INTERESTS } from './interests'
// Langue des vidéos : région YouTube, mots-clés des thèmes, et priorité aux vidéos dans cette langue.
export const LANGS: { code: string; label: string; flag: string; region: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', region: 'FR' },
  { code: 'en', label: 'English', flag: '🇺🇸', region: 'US' },
  { code: 'es', label: 'Español', flag: '🇪🇸', region: 'ES' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', region: 'DE' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', region: 'IT' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', region: 'BR' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦', region: 'MA' },
]

// Thèmes : [clé, libellé, mots-clés fr | en | es | de | it | pt | ar]
const T: [string, string, string][] = [
  ['all', 'Tout', 'vidéo|video|video|video|video|vídeo|فيديو'],
  ['music', 'Musique', 'musique clip officiel|music official video|música videoclip oficial|musik offizielles video|musica video ufficiale|música clipe oficial|فيديو كليب'],
  ['news', 'Actualités', 'actualités|news|noticias|nachrichten|notizie|notícias|أخبار'],
  ['science', 'Science & tech', 'science technologie|science technology|ciencia tecnología|wissenschaft technik|scienza tecnologia|ciência tecnologia|علوم تكنولوجيا'],
  ['edu', 'Éducation', 'documentaire éducatif|education documentary|documental educativo|doku bildung|documentario|documentário|وثائقي'],
  ['sport', 'Sport', 'sport résumé|sports highlights|deportes resumen|sport highlights|sport highlights|esporte melhores momentos|ملخص مباراة'],
  ['football', 'Football', 'football résumé match|soccer highlights|fútbol resumen|fußball highlights|calcio highlights|futebol gols|كرة القدم'],
  ['fun', 'Divertissement', 'divertissement|entertainment|entretenimiento|unterhaltung|intrattenimento|entretenimento|ترفيه'],
  ['humor', 'Humour', 'humour sketch|comedy sketch|humor sketch|comedy sketch|comicità sketch|humor esquete|كوميدي'],
  ['movies', 'Films & séries', 'film bande annonce|movie trailer|película tráiler|film trailer|film trailer|filme trailer|فيلم إعلان'],
  ['anime', 'Animés', 'animé|anime|anime|anime|anime|anime|أنمي'],
  ['cooking', 'Cuisine', 'recette cuisine|cooking recipe|receta cocina|rezept kochen|ricetta cucina|receita culinária|وصفة طبخ'],
  ['travel', 'Voyage', 'voyage vlog|travel vlog|viaje vlog|reise vlog|viaggio vlog|viagem vlog|سفر'],
  ['animals', 'Animaux', 'animaux|animals|animales|tiere|animali|animais|حيوانات'],
  ['fitness', 'Fitness', 'musculation entraînement|workout fitness|entrenamiento fitness|training fitness|allenamento fitness|treino fitness|تمارين رياضية'],
  ['beauty', 'Mode & beauté', 'mode beauté|fashion beauty|moda belleza|mode beauty|moda bellezza|moda beleza|موضة'],
  ['diy', 'Bricolage & DIY', 'bricolage diy|diy how to|bricolaje diy|heimwerken diy|fai da te|faça você mesmo|اصنعها بنفسك'],
  ['business', 'Business & finance', 'business finance|business finance|negocios finanzas|business finanzen|business finanza|negócios finanças|مال وأعمال'],
  ['history', 'Histoire', 'histoire|history|historia|geschichte|storia|história|تاريخ'],
  ['podcast', 'Podcasts', 'podcast|podcast|podcast|podcast|podcast|podcast|بودكاست'],
  ['art', 'Art & dessin', 'dessin art|drawing art|dibujo arte|zeichnen kunst|disegno arte|desenho arte|رسم'],
  ['cars', 'Auto & moto', 'essai voiture|car review|prueba coche|auto test|prova auto|carro avaliação|مراجعة سيارة'],
  ['kids', 'Enfants', 'dessin animé enfants|kids cartoons|dibujos animados|kinder zeichentrick|cartoni animati|desenho infantil|رسوم متحركة'],
]
export const THEMES: [string, string][] = T.map(([k, l]) => [l, k])
const IDX: Record<string, number> = { fr: 0, en: 1, es: 2, de: 3, it: 4, pt: 5, ar: 6 }
// Anciennes clés (catégories YouTube) des versions précédentes.
const OLD: Record<string, string> = { '10': 'music', '25': 'news', '28': 'science', '27': 'edu', '17': 'sport', '24': 'fun', '23': 'humor', '1': 'movies', '26': 'cooking', '2': 'cars' }
export const themeKey = (k?: string) => (k ? OLD[k] ?? k : 'all')

export function themeQuery(lang: string, key?: string, shorts = false) {
  const k = themeKey(key)
  const row = T.find((t) => t[0] === k)
  const x = row ? undefined : INTERESTS.find((i) => i.key === k)
  const w = row ? row[2].split('|')[IDX[lang] ?? 0] : x ? (lang === 'fr' ? x.fr : x.en) : T[0][2].split('|')[IDX[lang] ?? 0]
  if (!row && !x) return shorts ? 'shorts' : w
  return shorts ? (k === 'all' ? 'shorts' : `${w} shorts`) : w
}

// Détection rapide de langue par mots fréquents : sert à remonter les vidéos dans la langue choisie.
const STOP: Record<string, RegExp> = {
  fr: /\b(le|la|les|des|une|est|et|pour|pas|que|qui|dans|sur|avec|je|tu|nous|vous|mon|ce|cette|du|au|aux|c'est|j'ai|quand|comment|pourquoi|vraiment|meilleur|voici)\b|[éèêàçùœ]/gi,
  en: /\b(the|and|you|is|for|with|this|how|what|why|my|your|best|of|in|to|on)\b/gi,
  es: /\b(el|los|las|una|es|por|para|con|que|cómo|qué|mejor|del|muy|esto)\b|[ñáíóú¿¡]/gi,
  de: /\b(der|die|das|und|ist|nicht|mit|ich|du|wie|was|ein|eine|für|auf)\b|[äöüß]/gi,
  it: /\b(il|lo|gli|una|è|per|con|che|come|perché|della|questo|sono|molto)\b|[àèìòù]/gi,
  pt: /\b(o|os|as|uma|é|para|com|que|como|por|não|muito|isso|melhor|você)\b|[ãõçáéí]/gi,
  ar: /[؀-ۿ]/g,
}
export function langScore(text: string, lang: string) {
  const re = STOP[lang]
  if (!re) return 0
  const mine = (text.match(re) ?? []).length
  const other = lang === 'en' ? 0 : (text.match(STOP.en) ?? []).length * 0.6
  return mine - other
}

/** Remonte les vidéos dans la langue choisie, sans casser l'ordre de pertinence entre elles. */
export function prioritize<T extends { title: string; channelTitle?: string }>(list: T[], lang: string): T[] {
  return list
    .map((v, i) => ({ v, i, s: langScore(`${v.title} ${v.channelTitle ?? ''}`, lang) > 0 ? 0 : 1 }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.v)
}

/** Accueil : uniquement les vidéos détectées dans la langue choisie (s'il en reste assez). */
export function onlyLang<T extends { title: string; channelTitle?: string }>(list: T[], lang: string, min = 6): T[] {
  const mine = list.filter((v) => langScore(`${v.title} ${v.channelTitle ?? ''}`, lang) > 0)
  return mine.length >= min ? mine : prioritize(list, lang)
}
