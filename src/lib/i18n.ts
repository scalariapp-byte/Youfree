// Langue des vidéos : oriente la région YouTube et les mots-clés des thèmes.
export const LANGS: { code: string; label: string; flag: string; region: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', region: 'FR' },
  { code: 'en', label: 'English', flag: '🇺🇸', region: 'US' },
  { code: 'es', label: 'Español', flag: '🇪🇸', region: 'ES' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', region: 'DE' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', region: 'IT' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', region: 'BR' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦', region: 'MA' },
]

// Ordre : Tout, Musique, Actualités, Science, Éducation, Sport, Divertissement, Humour, Films, Cuisine, Auto
const CATS = ['', '10', '25', '28', '27', '17', '24', '23', '1', '26', '2']
const WORDS: Record<string, string[]> = {
  fr: ['vidéo', 'musique clip officiel', 'actualités', 'science technologie', 'éducation documentaire', 'sport résumé', 'divertissement', 'humour sketch', 'film bande annonce', 'cuisine recette', 'auto essai'],
  en: ['video', 'music official video', 'news', 'science technology', 'education documentary', 'sports highlights', 'entertainment', 'comedy sketch', 'movie trailer', 'cooking recipe', 'car review'],
  es: ['video', 'música videoclip oficial', 'noticias', 'ciencia tecnología', 'documental educación', 'deportes resumen', 'entretenimiento', 'humor sketch', 'película tráiler', 'cocina receta', 'coches prueba'],
  de: ['video', 'musik offizielles video', 'nachrichten', 'wissenschaft technik', 'doku bildung', 'sport highlights', 'unterhaltung', 'comedy sketch', 'film trailer', 'kochen rezept', 'auto test'],
  it: ['video', 'musica video ufficiale', 'notizie', 'scienza tecnologia', 'documentario', 'sport highlights', 'intrattenimento', 'comicità sketch', 'film trailer', 'cucina ricetta', 'auto prova'],
  pt: ['vídeo', 'música clipe oficial', 'notícias', 'ciência tecnologia', 'documentário educação', 'esporte melhores momentos', 'entretenimento', 'humor esquete', 'filme trailer', 'culinária receita', 'carro avaliação'],
  ar: ['فيديو', 'فيديو كليب', 'أخبار', 'علوم تكنولوجيا', 'وثائقي', 'ملخص مباراة', 'ترفيه', 'كوميدي', 'فيلم إعلان', 'وصفة طبخ', 'مراجعة سيارة'],
}

export function themeQuery(lang: string, cat?: string, shorts = false) {
  const w = (WORDS[lang] ?? WORDS.fr)[Math.max(0, CATS.indexOf(cat ?? ''))]
  return shorts ? `${cat ? w : ''} shorts`.trim() : w
}
