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
Musique|m2_amapiano|Amapiano|amapiano|amapiano
Musique|m2_kompa|Afro-trap|afro trap|afro trap
Musique|m2_coupe|Coupé-décalé|coupé décalé|coupe decale
Musique|m2_bachata|Bachata|bachata|bachata
Musique|m2_tango|Tango|tango|tango
Musique|m2_samba|Samba & bossa|samba bossa nova|samba bossa nova
Musique|m2_chanson|Chanson à texte|chanson française à texte|french chanson
Musique|m2_acoustic|Acoustique|session acoustique|acoustic session
Musique|m2_piano|Piano relaxant|piano relaxant|relaxing piano
Musique|m2_sleep|Musique pour dormir|musique pour dormir|sleep music
Musique|m2_focus|Musique pour travailler|musique concentration|focus music
Musique|m2_workout|Musique de sport|musique sport motivation|workout music
Musique|m2_80s|Années 80|tubes années 80|80s hits
Musique|m2_90s|Années 90|tubes années 90|90s hits
Musique|m2_2000s|Années 2000|tubes années 2000|2000s hits
Musique|m2_charts|Top des ventes|top 50|top charts
Musique|m2_newmusic|Nouveautés musique|nouveautés musique|new music
Musique|m2_freestyle|Freestyles|freestyle rap|rap freestyle
Musique|m2_battle|Battles de rap|battle rap|rap battle
Musique|m2_producer|Producteurs|producteur musique|music producer
Musique|m2_theory|Théorie musicale|théorie musicale|music theory
Musique|m2_bass|Basse|basse tuto|bass guitar
Musique|m2_sax|Saxophone|saxophone|saxophone
Musique|m2_harp|Instruments rares|instrument rare|rare instruments
Musique|m2_orchestra|Orchestre|orchestre|orchestra
Sport|s2_nba_draft|NBA|nba|nba
Sport|s2_euro|Équipe de France|équipe de france foot|france national team
Sport|s2_worldcup|Coupe du monde|coupe du monde|world cup
Sport|s2_jo|Jeux olympiques|jeux olympiques|olympics
Sport|s2_tdf|Tour de France|tour de france|tour de france
Sport|s2_rg|Roland-Garros|roland garros|roland garros
Sport|s2_ufc|UFC|ufc|ufc
Sport|s2_boxing|Boxe anglaise|boxe anglaise|boxing
Sport|s2_kick|Kickboxing|kickboxing|kickboxing
Sport|s2_bodybuilding|Bodybuilding|bodybuilding|bodybuilding
Sport|s2_powerlifting|Force athlétique|powerlifting|powerlifting
Sport|s2_parkour|Parkour|parkour|parkour
Sport|s2_freestylefoot|Foot freestyle|football freestyle|football freestyle
Sport|s2_skills|Gestes techniques|gestes techniques football|football skills
Sport|s2_goals|Plus beaux buts|plus beaux buts|best goals
Sport|s2_trail|Trail|trail running|trail running
Sport|s2_triathlon|Triathlon|triathlon|triathlon
Sport|s2_rowing|Aviron & kayak|aviron kayak|rowing kayak
Sport|s2_sailing|Voile|voile régate|sailing
Sport|s2_kite|Kitesurf|kitesurf|kitesurfing
Sport|s2_esports_foot|Foot amateur|foot amateur|amateur football
Sport|s2_referee|Arbitrage|arbitrage|refereeing
Sport|s2_stretch|Étirements|étirements|stretching
Sport|s2_homegym|Sport à la maison|sport à la maison|home workout
Sport|s2_weightloss|Perte de poids|perte de poids|weight loss
Jeux|g2_zelda|Zelda|zelda|zelda
Jeux|g2_mario|Mario|mario|mario
Jeux|g2_apex|Apex Legends|apex legends|apex legends
Jeux|g2_cs|Counter-Strike|counter strike|counter strike
Jeux|g2_rocket|Rocket League|rocket league|rocket league
Jeux|g2_genshin|Genshin Impact|genshin impact|genshin impact
Jeux|g2_amongus|Among Us|among us|among us
Jeux|g2_sims|Les Sims|les sims|the sims
Jeux|g2_brawl|Brawl Stars|brawl stars|brawl stars
Jeux|g2_freefire|Free Fire|free fire|free fire
Jeux|g2_wow|World of Warcraft|world of warcraft|world of warcraft
Jeux|g2_elden|Elden Ring|elden ring|elden ring
Jeux|g2_zombie|Jeux de zombies|jeu zombie|zombie games
Jeux|g2_strategy|Stratégie|jeu de stratégie|strategy games
Jeux|g2_simulator|Simulateurs|simulateur|simulator games
Jeux|g2_vrgames|Jeux VR|jeu réalité virtuelle|vr games
Jeux|g2_lore|Histoire des jeux|histoire jeu vidéo|video game lore
Jeux|g2_news|Actu jeux vidéo|actualité jeux vidéo|gaming news
Jeux|g2_tests|Tests de jeux|test jeu vidéo|game review
Jeux|g2_letsplay|Let's play|let's play|lets play
Divertissement|f2_animals_funny|Animaux drôles|animaux drôles|funny animals
Divertissement|f2_babies|Bébés|bébés drôles|funny babies
Divertissement|f2_dance_trends|Danses tendance|danse tendance|dance trends
Divertissement|f2_lifehacks|Astuces de vie|astuces|life hacks
Divertissement|f2_experiments|Expériences|expérience|experiments
Divertissement|f2_build|Constructions|construction impressionnante|amazing builds
Divertissement|f2_records|Records du monde|record du monde|world records
Divertissement|f2_survival|Survie|survie|survival
Divertissement|f2_social|Expériences sociales|expérience sociale|social experiment
Divertissement|f2_dating|Rencards|rencard|dating
Divertissement|f2_family|Vlogs famille|vlog famille|family vlog
Divertissement|f2_couple|Vlogs couple|vlog couple|couple vlog
Divertissement|f2_dayinlife|Journée type|une journée avec|day in the life
Divertissement|f2_rich|Vie de luxe|vie de luxe|luxury life
Divertissement|f2_ranking|Classements|top 10|top 10
Divertissement|f2_facts|Le saviez-vous|le saviez vous|did you know
Divertissement|f2_drama|Drama YouTube|drama youtube|youtube drama
Divertissement|f2_gossip|People|people célébrités|celebrity news
Divertissement|f2_karting|Karting|karting|karting
Divertissement|f2_escape|Escape game|escape game|escape room
Cinéma & séries|c2_recap|Résumés de films|résumé film|movie recap
Cinéma & séries|c2_ending|Fins expliquées|fin expliquée|ending explained
Cinéma & séries|c2_easter|Easter eggs|easter eggs film|movie easter eggs
Cinéma & séries|c2_harrypotter|Harry Potter|harry potter|harry potter
Cinéma & séries|c2_lotr|Seigneur des anneaux|seigneur des anneaux|lord of the rings
Cinéma & séries|c2_dc|DC|dc comics|dc comics
Cinéma & séries|c2_pixar|Pixar|pixar|pixar
Cinéma & séries|c2_ghibli|Ghibli|studio ghibli|studio ghibli
Cinéma & séries|c2_jjk|Jujutsu Kaisen|jujutsu kaisen|jujutsu kaisen
Cinéma & séries|c2_aot|L'Attaque des Titans|attaque des titans|attack on titan
Cinéma & séries|c2_demon|Demon Slayer|demon slayer|demon slayer
Cinéma & séries|c2_simpsons|Simpson|les simpson|the simpsons
Cinéma & séries|c2_sitcom|Sitcoms|sitcom|sitcom
Cinéma & séries|c2_action|Films d'action|film d'action|action movies
Cinéma & séries|c2_romance|Films romantiques|film romantique|romance movies
Cinéma & séries|c2_bollywoodfilm|Films indiens|film indien|indian movies
Cinéma & séries|c2_nollywood|Films africains|film africain|african movies
Cinéma & séries|c2_casting|Castings & acteurs|acteur interview|actor interview
Cinéma & séries|c2_shortanim|Animations courtes|court métrage animation|animated short
Cinéma & séries|c2_trailers|Bandes-annonces|bande annonce|trailer
Savoir|k2_ocean|Océanographie|océanographie|oceanography
Savoir|k2_climate|Climat|réchauffement climatique|climate change
Savoir|k2_energy|Énergie|énergie nucléaire solaire|energy
Savoir|k2_brain|Mémoire & cerveau|mémoire cerveau|memory brain
Savoir|k2_sleep|Science du sommeil|science sommeil|sleep science
Savoir|k2_ancient_egypt|Égypte ancienne|egypte ancienne|ancient egypt
Savoir|k2_rome|Rome antique|rome antique|ancient rome
Savoir|k2_vikings|Vikings|vikings|vikings
Savoir|k2_napoleon|Napoléon|napoléon|napoleon
Savoir|k2_ww1|Première Guerre mondiale|première guerre mondiale|world war 1
Savoir|k2_coldwar|Guerre froide|guerre froide|cold war
Savoir|k2_geopolitics|Géopolitique|géopolitique|geopolitics
Savoir|k2_economics|Économie expliquée|économie expliquée|economics explained
Savoir|k2_logic|Logique & énigmes|énigme logique|logic puzzles
Savoir|k2_languages|Linguistique|linguistique|linguistics
Savoir|k2_flags|Drapeaux & pays|pays du monde|countries of the world
Savoir|k2_maps|Cartes|cartographie|maps
Savoir|k2_inventions|Inventions|inventions|inventions
Savoir|k2_disasters|Catastrophes|catastrophe naturelle|natural disasters
Savoir|k2_aliens|Vie extraterrestre|extraterrestre|alien life
Tech|t2_iphone|iPhone|iphone|iphone
Tech|t2_samsung|Samsung|samsung|samsung
Tech|t2_xiaomi|Xiaomi|xiaomi|xiaomi
Tech|t2_tablet|Tablettes|tablette|tablet
Tech|t2_laptop|Ordinateurs portables|ordinateur portable|laptop
Tech|t2_gamingpc|PC gaming|pc gaming|gaming pc
Tech|t2_console|Consoles|console|console
Tech|t2_watch|Montres connectées|montre connectée|smartwatch
Tech|t2_tv|TV & home cinéma|télévision home cinéma|tv home theater
Tech|t2_smarthome|Maison connectée|maison connectée|smart home
Tech|t2_chatgpt|ChatGPT & IA|chatgpt|chatgpt
Tech|t2_aiart|Images IA|image ia|ai art
Tech|t2_apps|Applications|application mobile|mobile apps
Tech|t2_tips|Astuces téléphone|astuces téléphone|phone tips
Tech|t2_privacy|Vie privée en ligne|vie privée internet|online privacy
Tech|t2_internet|Histoire d'internet|histoire internet|internet history
Tech|t2_retro|Rétro tech|vieille technologie|retro tech
Tech|t2_teardown|Démontages|démontage|teardown
Tech|t2_software|Logiciels|logiciel tutoriel|software tutorial
Tech|t2_excel|Excel & bureautique|excel tutoriel|excel tutorial
Vie pratique|l2_meal|Repas de la semaine|batch cooking|meal prep
Vie pratique|l2_healthyfood|Manger sain|manger sain|healthy eating
Vie pratique|l2_desserts|Desserts|dessert recette|dessert recipe
Vie pratique|l2_bread|Pain maison|pain maison|homemade bread
Vie pratique|l2_italian|Cuisine italienne|cuisine italienne|italian food
Vie pratique|l2_asian|Cuisine asiatique|cuisine asiatique|asian food
Vie pratique|l2_african|Cuisine africaine|cuisine africaine|african food
Vie pratique|l2_halal|Cuisine halal|recette halal|halal recipes
Vie pratique|l2_restaurant|Tests de restaurants|test restaurant|restaurant review
Vie pratique|l2_fastfood|Fast-food|fast food|fast food
Vie pratique|l2_budget|Budget & économies|économiser argent|saving money
Vie pratique|l2_side|Gagner de l'argent|gagner de l'argent|make money
Vie pratique|l2_entrepreneur|Entrepreneuriat|entrepreneur|entrepreneurship
Vie pratique|l2_marketing|Marketing|marketing|marketing
Vie pratique|l2_productivity|Productivité|productivité|productivity
Vie pratique|l2_selfcare|Prendre soin de soi|prendre soin de soi|self care
Vie pratique|l2_mental|Santé mentale|santé mentale|mental health
Vie pratique|l2_moving|Déménagement & rangement|rangement maison|home organization
Vie pratique|l2_renovation|Rénovation|rénovation maison|home renovation
Vie pratique|l2_plumbing|Plomberie & électricité|plomberie électricité|plumbing electrical
Voyage & nature|v2_spain|Espagne|voyage espagne|spain travel
Voyage & nature|v2_italy|Italie|voyage italie|italy travel
Voyage & nature|v2_morocco|Maroc|voyage maroc|morocco travel
Voyage & nature|v2_dubai|Dubaï|dubaï|dubai
Voyage & nature|v2_thailand|Thaïlande|voyage thaïlande|thailand travel
Voyage & nature|v2_canada|Canada|voyage canada|canada travel
Voyage & nature|v2_islands|Îles paradisiaques|île paradisiaque|tropical islands
Voyage & nature|v2_roadtrip|Road trip|road trip|road trip
Voyage & nature|v2_backpack|Sac à dos|voyage sac à dos|backpacking
Voyage & nature|v2_cheaptravel|Voyager pas cher|voyager pas cher|budget travel
Voyage & nature|v2_cats|Chats|chat|cats
Voyage & nature|v2_dogs|Chiens|chien|dogs
Voyage & nature|v2_horses|Chevaux|chevaux|horses
Voyage & nature|v2_wildlife_africa|Safari|safari|safari
Voyage & nature|v2_jungle|Jungle|jungle|jungle
Voyage & nature|v2_desert|Déserts|désert|desert
Voyage & nature|v2_polar|Pôles & glaciers|pôle glacier|polar glaciers
Voyage & nature|v2_storms|Orages & tempêtes|orage tempête|storms
Voyage & nature|v2_space_views|Terre vue de l'espace|terre vue de l'espace|earth from space
Voyage & nature|v2_relax_nature|Sons de la nature|sons de la nature|nature sounds
Art & création|a2_sketch|Croquis|croquis|sketching
Art & création|a2_watercolor|Aquarelle|aquarelle|watercolor
Art & création|a2_manga_draw|Dessin manga|dessiner manga|manga drawing
Art & création|a2_sculpture|Sculpture|sculpture|sculpture
Art & création|a2_resin|Résine|art résine|resin art
Art & création|a2_jewelry|Bijoux|bijoux fait main|jewelry making
Art & création|a2_candles|Bougies & savons|bougies savon fait maison|candle soap making
Art & création|a2_photoedit|Retouche photo|retouche photo|photo editing
Art & création|a2_thumbnail|Création YouTube|créer chaîne youtube|youtube tips
Art & création|a2_music_video|Clips & réalisation|réalisation clip|music video making
Art & création|a2_stopmotion|Stop motion|stop motion|stop motion
Art & création|a2_museums|Musées|musée visite|museum tour
Art & création|a2_artists|Grands peintres|peintre célèbre|famous painters
Art & création|a2_interior|Design d'intérieur|design intérieur|interior design
Art & création|a2_florist|Art floral|art floral|floral design
Info|i2_tech_news|Actu IA|actualité intelligence artificielle|ai news
Info|i2_space_news|Actu espace|actualité espace|space news
Info|i2_crypto_news|Actu crypto|actualité crypto|crypto news
Info|i2_auto_news|Actu auto|actualité automobile|car news
Info|i2_game_news|Actu jeux|actualité jeux|game news
Info|i2_explained|L'actu expliquée|actualité expliquée|news explained
Info|i2_history_now|Histoire et actualité|histoire actualité|history and news
Info|i2_elections|Élections|élections|elections
Enfants|e2_animals_kids|Animaux pour enfants|animaux enfants|animals for kids
Enfants|e2_science_kids|Sciences pour enfants|science enfants|science for kids
Enfants|e2_drawing_kids|Dessin pour enfants|dessin enfant|drawing for kids
Enfants|e2_songs_kids|Chansons pour enfants|chanson enfant|kids songs
Enfants|e2_cartoons_classic|Dessins animés classiques|dessin animé classique|classic cartoons
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
