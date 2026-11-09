// 100 centres d'intérêt, groupés. Mots-clés fr | en (les autres langues utilisent l'anglais + la région).
const RAW = `
Musique|music_pop|Pop|pop clip officiel|pop music video
Musique|music_rap|Rap français|rap français clip|rap music video
Musique|music_hiphop|Hip-hop US|hip hop us clip|hip hop music video
Musique|music_rnb|R&B|rnb clip|rnb music video
Musique|music_rock|Rock|rock live|rock music
Musique|music_metal|Metal|metal live|metal music
Musique|music_electro|Électro|musique électronique mix|electronic music mix
Musique|music_house|House & techno|house techno set|house techno set
Musique|music_jazz|Jazz|jazz concert|jazz live
Musique|music_classical|Classique|musique classique concert|classical music concert
Musique|music_afro|Afro|afrobeat clip|afrobeats music video
Musique|music_latino|Latino|reggaeton clip|reggaeton music video
Musique|music_kpop|K-pop|kpop mv|kpop mv
Musique|music_variete|Variété française|chanson française|french songs
Musique|music_lofi|Lo-fi & chill|lofi chill|lofi chill beats
Musique|music_live|Concerts|concert live complet|full live concert
Musique|music_cover|Reprises|reprise chanson cover|song cover
Musique|music_instru|Instruments & tutos|tuto guitare piano|guitar piano tutorial
Sport|football|Football|football résumé match|soccer highlights
Sport|sport_basket|Basket|basket nba résumé|nba highlights
Sport|sport_tennis|Tennis|tennis résumé|tennis highlights
Sport|sport_rugby|Rugby|rugby résumé|rugby highlights
Sport|sport_f1|Formule 1|formule 1 résumé|formula 1 highlights
Sport|sport_mma|MMA & boxe|mma boxe combat|mma boxing fight
Sport|sport_cycling|Cyclisme|cyclisme étape résumé|cycling highlights
Sport|sport_running|Course à pied|course à pied marathon|running marathon
Sport|sport_extreme|Sports extrêmes|sport extrême|extreme sports
Sport|sport_ski|Ski & glisse|ski snowboard|ski snowboard
Sport|sport_surf|Surf|surf vagues|surfing waves
Sport|fitness|Fitness|musculation entraînement|workout fitness
Sport|sport_yoga|Yoga|yoga séance|yoga session
Sport|sport|Sport (tout)|sport résumé|sports highlights
Jeux|game_gaming|Jeux vidéo|jeux vidéo|video games
Jeux|game_minecraft|Minecraft|minecraft|minecraft
Jeux|game_fortnite|Fortnite|fortnite|fortnite
Jeux|game_esport|E-sport|esport|esports
Jeux|game_retro|Rétro gaming|rétro gaming|retro gaming
Jeux|game_chess|Échecs|échecs partie|chess game
Jeux|game_board|Jeux de société|jeux de société|board games
Divertissement|fun|Divertissement|divertissement|entertainment
Divertissement|humor|Humour|humour sketch|comedy sketch
Divertissement|fun_standup|Stand-up|stand up spectacle|stand up comedy
Divertissement|fun_prank|Caméras cachées|caméra cachée|prank
Divertissement|fun_challenge|Défis|défi challenge|challenge
Divertissement|fun_reaction|Réactions|réaction vidéo|reaction video
Divertissement|fun_asmr|ASMR|asmr|asmr
Divertissement|podcast|Podcasts|podcast|podcast
Divertissement|fun_interview|Interviews|interview|interview
Divertissement|fun_reality|Télé-réalité|télé réalité|reality tv
Cinéma & séries|movies|Films & séries|film bande annonce|movie trailer
Cinéma & séries|cine_review|Critiques ciné|critique film|movie review
Cinéma & séries|cine_series|Séries|série analyse|tv series breakdown
Cinéma & séries|anime|Animés|animé|anime
Cinéma & séries|cine_manga|Mangas|manga|manga
Cinéma & séries|cine_cartoon|Animation|film d'animation|animation
Cinéma & séries|cine_short|Courts-métrages|court métrage|short film
Cinéma & séries|cine_horror|Horreur|horreur|horror
Savoir|science|Science & tech|science technologie|science technology
Savoir|edu|Éducation|documentaire éducatif|education documentary
Savoir|history|Histoire|histoire|history
Savoir|know_space|Espace & astronomie|espace astronomie|space astronomy
Savoir|know_physics|Physique|physique expliquée|physics explained
Savoir|know_math|Maths|mathématiques|mathematics
Savoir|know_bio|Biologie & santé|biologie santé|biology health
Savoir|know_geo|Géographie|géographie|geography
Savoir|know_philo|Philosophie|philosophie|philosophy
Savoir|know_lang|Langues|apprendre langue|learn language
Savoir|know_psy|Psychologie|psychologie|psychology
Tech|tech_phone|Smartphones|test smartphone|smartphone review
Tech|tech_pc|PC & hardware|pc gamer montage|pc build
Tech|tech_ai|Intelligence artificielle|intelligence artificielle|artificial intelligence
Tech|tech_code|Programmation|programmation tutoriel|programming tutorial
Tech|tech_apple|Apple|apple|apple
Tech|tech_gadgets|Gadgets|gadget high tech|tech gadgets
Tech|tech_crypto|Crypto|crypto bitcoin|crypto bitcoin
Vie pratique|cooking|Cuisine|recette cuisine|cooking recipe
Vie pratique|life_pastry|Pâtisserie|pâtisserie recette|baking recipe
Vie pratique|life_diy|Bricolage & DIY|bricolage diy|diy how to
Vie pratique|life_garden|Jardinage|jardinage|gardening
Vie pratique|life_deco|Déco & maison|décoration maison|home decor
Vie pratique|beauty|Mode & beauté|mode beauté|fashion beauty
Vie pratique|life_makeup|Maquillage|maquillage tuto|makeup tutorial
Vie pratique|life_parent|Parentalité|parentalité|parenting
Vie pratique|life_money|Finances perso|finances personnelles|personal finance
Vie pratique|business|Business & finance|business finance|business finance
Vie pratique|life_health|Bien-être|bien être santé|wellness
Voyage & nature|travel|Voyage|voyage vlog|travel vlog
Voyage & nature|animals|Animaux|animaux|animals
Voyage & nature|nature_wild|Nature sauvage|documentaire nature|wildlife documentary
Voyage & nature|nature_ocean|Océans|océan mer|ocean sea
Voyage & nature|nature_camping|Camping & survie|camping bushcraft|camping bushcraft
Voyage & nature|nature_moto|Moto|moto|motorcycle
Voyage & nature|cars|Auto|essai voiture|car review
Voyage & nature|nature_plane|Aviation|aviation avion|aviation planes
Art & création|art|Art & dessin|dessin art|drawing art
Art & création|art_photo|Photo & vidéo|photographie tuto|photography tutorial
Art & création|art_design|Design|design graphique|graphic design
Art & création|art_dance|Danse|danse chorégraphie|dance choreography
Art & création|art_books|Livres|livres lecture|books
Info|news|Actualités|actualités|news
Info|info_politics|Politique|politique débat|politics debate
Info|info_eco|Économie|économie|economy
Info|info_world|International|actualité internationale|world news
Enfants|kids|Enfants|dessin animé enfants|kids cartoons
`
export interface Interest {
  key: string
  label: string
  group: string
  fr: string
  en: string
}
export const INTERESTS: Interest[] = RAW.trim()
  .split('\n')
  .map((l) => {
    const [group, key, label, fr, en] = l.split('|')
    return { group, key, label, fr, en }
  })
export const GROUPS = [...new Set(INTERESTS.map((i) => i.group))]
