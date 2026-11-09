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
Musique|m_reggae|Reggae|reggae|reggae
Musique|m_dancehall|Dancehall|dancehall|dancehall
Musique|m_drill|Drill|drill clip|drill music video
Musique|m_trap|Trap|trap clip|trap music
Musique|m_zouk|Zouk & kompa|zouk kompa|zouk kompa
Musique|m_rai|Raï|raï clip|rai music
Musique|m_arab|Musique arabe|musique arabe|arabic music
Musique|m_bollywood|Bollywood|chanson bollywood|bollywood songs
Musique|m_country|Country|country|country music
Musique|m_blues|Blues|blues|blues music
Musique|m_soul|Soul & funk|soul funk|soul funk
Musique|m_gospel|Gospel|gospel|gospel
Musique|m_opera|Opéra|opéra|opera
Musique|m_film|Musiques de films|musique de film|film score
Musique|m_gamemusic|Musiques de jeux|musique jeu vidéo|video game music
Musique|m_punk|Punk|punk rock|punk rock
Musique|m_indie|Indé|musique indépendante|indie music
Musique|m_folk|Folk|folk|folk music
Musique|m_dubstep|Dubstep|dubstep|dubstep
Musique|m_trance|Trance|trance|trance music
Musique|m_dnb|Drum & bass|drum and bass|drum and bass
Musique|m_jpop|J-pop|jpop|jpop
Musique|m_flamenco|Flamenco|flamenco|flamenco
Musique|m_salsa|Salsa|salsa|salsa
Musique|m_karaoke|Karaoké|karaoké|karaoke
Musique|m_beatmaking|Beatmaking|beatmaking|beat making
Musique|m_dj|DJ & mix|dj mix|dj mix
Musique|m_vocal|Chant|cours de chant|singing lessons
Musique|m_drums|Batterie|batterie|drums
Musique|m_violin|Violon|violon|violin
Sport|s_handball|Handball|handball|handball
Sport|s_volley|Volley|volley|volleyball
Sport|s_golf|Golf|golf|golf
Sport|s_nfl|Football américain|nfl|nfl highlights
Sport|s_baseball|Baseball|baseball|baseball
Sport|s_hockey|Hockey|hockey nhl|nhl hockey
Sport|s_motogp|MotoGP|motogp|motogp
Sport|s_rally|Rallye|rallye|rally
Sport|s_swim|Natation|natation|swimming
Sport|s_athle|Athlétisme|athlétisme|athletics
Sport|s_gym|Gymnastique|gymnastique|gymnastics
Sport|s_climb|Escalade|escalade|climbing
Sport|s_skate|Skate|skateboard|skateboarding
Sport|s_bmx|BMX & VTT|vtt bmx|mtb bmx
Sport|s_judo|Judo & karaté|judo karaté|judo karate
Sport|s_wrestling|Catch|catch wwe|wwe wrestling
Sport|s_horse|Équitation|équitation|horse riding
Sport|s_fishing|Pêche|pêche|fishing
Sport|s_hunting|Chasse|chasse|hunting
Sport|s_calisthenics|Street workout|street workout|calisthenics
Sport|s_crossfit|CrossFit|crossfit|crossfit
Sport|s_pilates|Pilates|pilates|pilates
Sport|s_ligue1|Ligue 1|ligue 1 résumé|ligue 1 highlights
Sport|s_champions|Ligue des champions|ligue des champions résumé|champions league highlights
Sport|s_premier|Premier League|premier league résumé|premier league highlights
Sport|s_liga|Liga|liga résumé|la liga highlights
Sport|s_transfer|Mercato|mercato|transfer news
Sport|s_womenfoot|Foot féminin|football féminin|women's football
Sport|s_paddle|Padel|padel|padel
Sport|s_petanque|Pétanque|pétanque|petanque
Jeux|g_gta|GTA|gta|gta
Jeux|g_cod|Call of Duty|call of duty|call of duty
Jeux|g_lol|League of Legends|league of legends|league of legends
Jeux|g_valorant|Valorant|valorant|valorant
Jeux|g_roblox|Roblox|roblox|roblox
Jeux|g_pokemon|Pokémon|pokémon|pokemon
Jeux|g_nintendo|Nintendo|nintendo|nintendo
Jeux|g_playstation|PlayStation|playstation|playstation
Jeux|g_xbox|Xbox|xbox|xbox
Jeux|g_mobile|Jeux mobiles|jeux mobile|mobile games
Jeux|g_speedrun|Speedrun|speedrun|speedrun
Jeux|g_indie|Jeux indés|jeu indépendant|indie games
Jeux|g_rpg|RPG|rpg|rpg
Jeux|g_horror|Jeux d'horreur|jeu d'horreur|horror games
Jeux|g_simracing|Simulation auto|simulation automobile|sim racing
Jeux|g_fc|EA FC|ea fc|ea fc
Jeux|g_clash|Clash Royale|clash royale|clash royale
Jeux|g_poker|Poker|poker|poker
Jeux|g_puzzle|Casse-têtes|casse tête énigme|puzzles riddles
Jeux|g_rubik|Rubik's cube|rubik's cube|rubik's cube
Divertissement|f_magic|Magie|tour de magie|magic tricks
Divertissement|f_satisfying|Satisfaisant|satisfaisant|oddly satisfying
Divertissement|f_fails|Fails|fails|fails
Divertissement|f_memes|Mèmes|mèmes|memes
Divertissement|f_vlog|Vlogs|vlog|vlog
Divertissement|f_storytime|Storytime|storytime|storytime
Divertissement|f_mystery|Mystères|mystère enquête|mystery
Divertissement|f_truecrime|Faits divers|faits divers enquête|true crime
Divertissement|f_paranormal|Paranormal|paranormal|paranormal
Divertissement|f_conspiracy|Légendes urbaines|légende urbaine|urban legends
Divertissement|f_talk|Talk-shows|talk show|talk show
Divertissement|f_quiz|Quiz|quiz|quiz
Divertissement|f_unboxing|Unboxing|unboxing|unboxing
Divertissement|f_mukbang|Mukbang|mukbang|mukbang
Divertissement|f_wholesome|Belles histoires|histoire émouvante|wholesome
Divertissement|f_impro|Impro|improvisation théâtre|improv
Divertissement|f_cosplay|Cosplay|cosplay|cosplay
Divertissement|f_puppets|Marionnettes|marionnettes|puppets
Divertissement|f_tvshows|Émissions TV|émission télé|tv show
Divertissement|f_streamers|Streamers|streamer best of|streamer highlights
Cinéma & séries|c_marvel|Marvel|marvel|marvel
Cinéma & séries|c_starwars|Star Wars|star wars|star wars
Cinéma & séries|c_disney|Disney|disney|disney
Cinéma & séries|c_netflix|Netflix|netflix|netflix
Cinéma & séries|c_scifi|Science-fiction|science fiction film|sci-fi movies
Cinéma & séries|c_thriller|Thrillers|thriller|thriller
Cinéma & séries|c_comedy|Comédies|comédie film|comedy movies
Cinéma & séries|c_docs|Documentaires|documentaire|documentary
Cinéma & séries|c_making|Making-of|making of tournage|behind the scenes
Cinéma & séries|c_vfx|Effets spéciaux|effets spéciaux|vfx
Cinéma & séries|c_theory|Théories de fans|théorie film|fan theory
Cinéma & séries|c_kdrama|K-drama|kdrama|kdrama
Cinéma & séries|c_frcine|Cinéma français|cinéma français|french cinema
Cinéma & séries|c_classic|Films classiques|film classique|classic movies
Cinéma & séries|c_onepiece|One Piece|one piece|one piece
Cinéma & séries|c_dbz|Dragon Ball|dragon ball|dragon ball
Cinéma & séries|c_naruto|Naruto|naruto|naruto
Cinéma & séries|c_bd|Bandes dessinées|bande dessinée|comics
Cinéma & séries|c_theatre|Théâtre|théâtre|theatre
Cinéma & séries|c_oscars|Cérémonies|cérémonie oscars césars|awards show
Savoir|k_chem|Chimie|chimie expérience|chemistry experiment
Savoir|k_eco|Écologie|écologie climat|climate ecology
Savoir|k_archeo|Archéologie|archéologie|archaeology
Savoir|k_myth|Mythologie|mythologie|mythology
Savoir|k_religion|Religions|religions histoire|religions history
Savoir|k_ww2|Seconde Guerre mondiale|seconde guerre mondiale|world war 2
Savoir|k_antiquity|Antiquité|antiquité rome egypte|ancient history
Savoir|k_medieval|Moyen Âge|moyen âge|middle ages
Savoir|k_medicine|Médecine|médecine|medicine
Savoir|k_neuro|Cerveau & neurosciences|cerveau neurosciences|neuroscience
Savoir|k_nutrition|Nutrition|nutrition|nutrition
Savoir|k_engineering|Ingénierie|ingénierie|engineering
Savoir|k_robot|Robotique|robotique|robotics
Savoir|k_quantum|Physique quantique|physique quantique|quantum physics
Savoir|k_dinos|Dinosaures|dinosaures|dinosaurs
Savoir|k_volcano|Volcans & séismes|volcan séisme|volcanoes earthquakes
Savoir|k_weather|Météo|météo|weather
Savoir|k_law|Droit|droit justice|law
Savoir|k_study|Méthodes d'étude|méthode révision|study tips
Savoir|k_english|Apprendre l'anglais|apprendre anglais|learn english
Tech|t_android|Android|android|android
Tech|t_windows|Windows|windows astuces|windows tips
Tech|t_linux|Linux|linux|linux
Tech|t_web|Développement web|développement web|web development
Tech|t_python|Python|python tutoriel|python tutorial
Tech|t_cyber|Cybersécurité|cybersécurité|cybersecurity
Tech|t_hack|Hacking éthique|hacking éthique|ethical hacking
Tech|t_electro|Électronique|électronique arduino|electronics arduino
Tech|t_3d|Impression 3D|impression 3d|3d printing
Tech|t_drone|Drones|drone|drones
Tech|t_vr|Réalité virtuelle|réalité virtuelle|virtual reality
Tech|t_ev|Voitures électriques|voiture électrique|electric cars
Tech|t_space|SpaceX & fusées|spacex fusée|spacex rockets
Tech|t_audio|Audio & casques|test casque audio|headphones review
Tech|t_camera|Appareils photo|test appareil photo|camera review
Tech|t_setup|Setups|setup bureau|desk setup
Tech|t_nocode|Automatisation|automatisation no code|automation
Tech|t_startup|Startups|startup|startups
Tech|t_news|Actu tech|actualité tech|tech news
Tech|t_repair|Réparation|réparation smartphone|phone repair
Vie pratique|l_bbq|Barbecue|barbecue|bbq
Vie pratique|l_vegan|Cuisine végétarienne|recette végétarienne|vegetarian recipes
Vie pratique|l_street|Street food|street food|street food
Vie pratique|l_wine|Vin & œnologie|vin dégustation|wine tasting
Vie pratique|l_coffee|Café|café barista|coffee barista
Vie pratique|l_cocktail|Cocktails|cocktail recette|cocktail recipe
Vie pratique|l_world|Cuisine du monde|cuisine du monde|world cuisine
Vie pratique|l_cheap|Cuisine pas chère|recette pas chère|cheap recipes
Vie pratique|l_clean|Ménage & organisation|ménage organisation|cleaning organization
Vie pratique|l_minimal|Minimalisme|minimalisme|minimalism
Vie pratique|l_haircut|Coiffure|coiffure|hairstyle
Vie pratique|l_barber|Barbier|barbier|barber
Vie pratique|l_sneakers|Sneakers|sneakers|sneakers
Vie pratique|l_streetwear|Streetwear|streetwear|streetwear
Vie pratique|l_skincare|Soin de la peau|soin visage|skincare
Vie pratique|l_tattoo|Tatouage|tatouage|tattoo
Vie pratique|l_immo|Immobilier|immobilier|real estate
Vie pratique|l_invest|Investissement|investir bourse|investing stocks
Vie pratique|l_career|Carrière & emploi|emploi carrière|career advice
Vie pratique|l_motivation|Motivation|motivation|motivation
Vie pratique|l_meditation|Méditation|méditation|meditation
Vie pratique|l_sleep|Sommeil|sommeil|sleep
Vie pratique|l_relation|Couple & relations|couple relation|relationships
Vie pratique|l_pets|Chiens & chats|chien chat|dogs cats
Vie pratique|l_aquarium|Aquariophilie|aquarium|aquarium
Vie pratique|l_wood|Travail du bois|travail du bois|woodworking
Vie pratique|l_sewing|Couture|couture|sewing
Vie pratique|l_knit|Tricot & crochet|tricot crochet|knitting crochet
Vie pratique|l_mecha|Mécanique auto|mécanique auto|car mechanic
Vie pratique|l_vanlife|Vanlife|vanlife|vanlife
Voyage & nature|v_japan|Japon|japon voyage|japan travel
Voyage & nature|v_usa|États-Unis|voyage usa|usa travel
Voyage & nature|v_africa|Afrique|voyage afrique|africa travel
Voyage & nature|v_asia|Asie|voyage asie|asia travel
Voyage & nature|v_france|France|voyage france|france travel
Voyage & nature|v_city|Villes du monde|visite ville|city tour
Voyage & nature|v_hiking|Randonnée|randonnée|hiking
Voyage & nature|v_mountain|Montagne|montagne|mountains
Voyage & nature|v_birds|Oiseaux|oiseaux|birds
Voyage & nature|v_insects|Insectes|insectes|insects
Voyage & nature|v_reptiles|Reptiles|reptiles|reptiles
Voyage & nature|v_sharks|Requins|requins|sharks
Voyage & nature|v_farm|Ferme & agriculture|agriculture ferme|farming
Voyage & nature|v_trains|Trains|train|trains
Voyage & nature|v_boats|Bateaux|bateau|boats
Voyage & nature|v_trucks|Camions & engins|camion engin chantier|trucks heavy machinery
Voyage & nature|v_supercars|Supercars|supercar|supercars
Voyage & nature|v_tuning|Tuning|tuning|car tuning
Voyage & nature|v_luxury|Luxe|luxe|luxury
Voyage & nature|v_food_travel|Voyage gastronomique|voyage culinaire|food travel
Art & création|a_paint|Peinture|peinture|painting
Art & création|a_digital|Art numérique|art numérique|digital art
Art & création|a_animation|Animation 2D/3D|animation 3d|3d animation
Art & création|a_edit|Montage vidéo|montage vidéo|video editing
Art & création|a_calligraphy|Calligraphie|calligraphie|calligraphy
Art & création|a_pottery|Poterie|poterie|pottery
Art & création|a_origami|Origami|origami|origami
Art & création|a_lego|LEGO|lego|lego
Art & création|a_miniature|Miniatures|miniature|miniatures
Art & création|a_archi|Architecture|architecture|architecture
Art & création|a_fashiondesign|Stylisme|stylisme mode|fashion design
Art & création|a_writing|Écriture|écriture roman|creative writing
Art & création|a_poetry|Poésie|poésie|poetry
Art & création|a_graffiti|Graffiti|graffiti|graffiti
Art & création|a_ballet|Danse classique|danse classique|ballet
Art & création|a_hiphopdance|Danse hip-hop|danse hip hop|hip hop dance
Info|i_science_news|Actu science|actualité science|science news
Info|i_sport_news|Actu sport|actualité sport|sports news
Info|i_finance_news|Actu bourse|bourse actualité|stock market news
Info|i_debate|Débats|débat|debate
Info|i_reportage|Reportages|reportage|investigative report
Info|i_africa|Actu Afrique|actualité afrique|africa news
Info|i_local|Actu régionale|actualité régionale|local news
Info|i_ecology_news|Climat|climat actualité|climate news
Enfants|e_comptines|Comptines|comptines|nursery rhymes
Enfants|e_learn|Apprendre en s'amusant|apprendre enfants|kids learning
Enfants|e_toys|Jouets|jouets|toys
Enfants|e_crafts|Bricolage enfants|bricolage enfant|kids crafts
Enfants|e_stories|Histoires|histoire pour enfants|kids stories
Enfants|e_teen|Ados|ado|teens
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
