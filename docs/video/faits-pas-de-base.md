# Fiche de faits — le pas de base sur place, d'un style à l'autre

Fiche établie le 21 novembre 2026 à partir du dépôt seul (branche `arcodange/video-pas-de-base`, état
committé `cff90fa`). Elle sert de base à une vidéo éducative de 4 à 6 minutes
(`docs/spec-video-pas-de-base.md:34-35`). La narration ne dit que ce qui est écrit ici. Rien n'est ajouté
de mémoire.

Conventions de lecture :

- Chaque fait des sections 1 à 6 porte un identifiant (**F001**, **F002**…). Le scénario de la vidéo
  (`scripts/video/narration.json`) cite ces identifiants ; `scripts/test_video.mjs` vérifie qu'ils existent.
  Les lignes de cette fiche dépassent donc parfois 100 caractères.
- Chaque fait est suivi de sa référence `fichier:ligne`, chemin depuis la racine du dépôt.
- Les numéros de ligne valent pour l'état committé `cff90fa`. Pendant la rédaction, `src/App.tsx` et
  `src/components/GuidageApp.tsx` portaient des modifications non committées qui décalent leurs lignes.
- Les angles sont en radians, comme dans le code. Les degrés sont ceux du dépôt quand il les donne.
  Sinon ils portent la mention « conversion » (1 rad ≈ 57,3°).
- `a` est l'amplitude réglable, 1 par défaut (`src/pose.ts:78`). Les valeurs d'un style sont
  multipliées par `a`, sauf mention « fixe ».
- Le texte du dépôt et les mots du propriétaire sont cités mot pour mot, entre guillemets.
- Les compléments du 23 novembre 2026 (F338 à F355) décrivent les pas élus du kompa et du semba. Leurs
  mesures, en centimètres et en degrés, viennent de `scripts/video/mesurer_pas.mjs` et de
  `scripts/tracer_hanches.mjs` ; les règles du propriétaire y sont dites sans citation.
- Les citations de tiers que le dépôt reproduit (sites, articles, manuels) sont résumées en français.
  La fiche donne leur langue d'origine et la ligne où le dépôt les donne mot pour mot. Une seule est
  recopiée (section 2.1). Pour citer un tiers à l'écran, reprendre le texte à la ligne indiquée.
- Niveaux de preuve du dépôt pour la musique : « documenté » = lu dans une source référencée ;
  « faible » = source commerciale, anonyme ou sans référence ; « proposition » = choix de l'auteur de la
  recherche, à valider à l'oreille (`docs/musique/README.md:38-42`).
- Les documents sur les pas (`docs/styles-de-danse.md`, `docs/ginga-angolana.md`,
  `docs/posture-contraposition.md`) n'attribuent pas de niveau de preuve à leurs sources.

## 1. Ce qu'est le pas de base sur place dans ce projet

- **F001** L'application compare six styles : kizomba, semba, kompa, tarraxinha, suave, zouk brésilien. Le dépôt
  la décrit ainsi : « Animation paramétrique illustrative, sans mocap ni calibration chorégraphique
  validée. » (`README.md:3-5`).
- **F002** Elle montre un squelette réel du bassin au pied (os coxaux, sacrum, fémurs, patellas, tibias, fibulas,
  os des pieds) et un buste stylisé en transparence au-dessus du sacrum. Une couche de muscles est
  optionnelle (`src/App.tsx:710-715`).
- **F003** Objectif premier : discerner les isolations du bas du corps. Au-dessus du bassin, le haut du tronc
  compense le roulis du bassin. L'inclinaison avant-arrière du style est conservée (`README.md:7-10`,
  `AGENTS.md:64-66`). Ce réglage, `iso=1`, est actif par défaut (`src/pose.ts:78`,
  `src/styles.ts:287-303`).
- **F004** Chaque style est une fonction du temps musical `b`, compté en temps. Elle règle le bassin, les
  hanches, les genoux et le tronc (`src/styles.ts:13`, `src/styles.ts:20-25`,
  `docs/adr/001-rig-parametrique-biodynamique.md:11-15`). Trois ondes servent de base : `S1` de période
  1 temps, `S2` de période 2 temps, `S4` de période 4 temps (`src/anatomy.ts:4-6`).
- **F005** « Sur place » veut dire curseur Déplacement à 0. Les pieds restent alors plantés au sol, à leur place
  de repos, sans se lever (`README.md:356-360`, `src/pose.ts:233-235`).
- **F006** Pieds plantés, les angles de hanche et de genou affichés sont recalculés pour que les pieds restent
  posés. La flexion écrite dans le style fixe la portée des jambes, donc la hauteur du bassin
  (`src/pose.ts:509`, `src/pose.ts:539-540`, `src/pose.ts:566`, `src/pose.ts:578-580`).
- **F007** Le transfert de poids se lit par la charge du pied droit, de −1 (tout à gauche) à +1 (tout à droite)
  (`src/styles.ts:14-17`). L'option « Appuis indicatifs » affiche des pastilles de charge sous les
  pieds, la chaîne pied, genou, hanche, la charge gauche et droite en %, la flexion des genoux et le
  roulis du bassin en degrés (`README.md:337-339`). Ces pourcentages « sont illustratifs » et « ne
  mesurent pas de forces » (`.vibe/CONVENTIONS.md:103-104`).
- **F008** Sur place, le mouvement tourne un demi-temps derrière l'horloge, pour que le plein appui tombe sur le
  temps de la musique (`src/pose.ts:335-340`, `docs/spec-temps-transferts.md:26-30`). Le tempo de
  l'application est global : un curseur de 24 à 140 bpm, 32 bpm par défaut, pas un tempo par style
  (`docs/musique/README.md:115-117`, `src/App.tsx:71`).

## 2. Les six styles

Lecture des paramètres du moteur, valable pour les six styles :

- **F009** Roulis du bassin = rotation autour de l'axe avant-arrière (`pelvis.rotation.z`). Lacet = rotation
  autour de l'axe vertical (`pelvis.rotation.y`). Bascule avant-arrière, ou tilt = `pelvis.rotation.x`
  (`src/styles.ts:287-290`, `src/styles.ts:305-307`,
  `docs/recherche-biomecanique/confrontation-modele.md:39-40`).
- **F010** Posture : `lean` est l'inclinaison du buste vers l'avant, négative pour un cambré ; `knee` est la
  flexion de base des genoux (`src/styles.ts:7-11`).
- **F011** Un déplacement du corps vers la gauche correspond à un appui qui passe à gauche
  (`src/styles.ts:16`).
- **F012** Les valeurs de hanche et de genou sont des consignes : pieds plantés, les angles affichés sont
  recalculés (`src/pose.ts:578-580`).
- **F013** Avec `iso=1`, la colonne annule le roulis et la bascule du bassin, et le buste et la tête perdent
  leur lacet et leur inclinaison latérale (`src/styles.ts:291-303`).
- **F014** `src/styles.ts` ne contient aucun tempo. Le seul chiffre de tempo y est une puce du semba
  (`src/styles.ts:74`). Le « tempo conseillé » de chaque style vient de `src/music/patterns.ts`.
- **F015** La confrontation musique et moteur décrit le code du 19 novembre 2026
  (`docs/musique/confrontation-moteur.md:5-7`). Le moteur a changé le 20 novembre
  (`docs/spec-temps-transferts.md:5`, `docs/spec-temps-transferts.md:24-44`). Les réserves ci-dessous
  disent lesquelles restent ouvertes.

### 2.1 Kizomba

#### Origine, filiation, influences

- **F016** Angola, fin des années 1970 et années 1980 (`docs/musique/kizomba.md:7`). Wikipédia EN place les
  origines à la fin des années 1970 ; son encadré donne 1984. Wikipédia FR la fait naître en 1980 d'une
  fusion du zouk antillais et du semba, avec un tempo plus lent. Niveau : documenté, encyclopédique
  (`docs/musique/kizomba.md:7-9`). Sources : Wikipédia EN, « Kizomba »,
  https://en.wikipedia.org/wiki/Kizomba ; Wikipédia FR, « Kizomba »,
  https://fr.wikipedia.org/wiki/Kizomba (`docs/musique/kizomba.md:167-169`).
- **F017** Eduardo Paim est présenté comme le « père » de la musique kizomba par Wikipédia EN, qui cite ses
  entretiens de 2012–2013 (`docs/musique/kizomba.md:10-11`).
- **F018** Selon Discovering Kizomba, Paim date le début vers 1979, avant l'arrivée du zouk. Il cite comme
  influences le konpa et le kadans haïtiens. Niveau : documenté, mais blog de pédagogue
  (`docs/musique/kizomba.md:11-13`). Source : Discovering Kizomba, « What is Ghetto Zouk? What is the
  connection to Kizomba and Zouk? », https://discoveringkizomba.com/?p=92
  (`docs/musique/kizomba.md:170-171`).
- **F019** L'explication la plus courante, zouk de Kassav' plus semba, est dite « discutée » : la tournée de
  Kassav' en Afrique arrive après les débuts décrits par Paim. Wikipédia FR attribue l'arrivée du zouk en
  Angola à cette tournée (`docs/musique/kizomba.md:14-16`).
- **F020** Le chanteur Waldemar Bastos, cité par Baratti (2020), voit la kizomba comme le produit de l'hégémonie
  des musiques antillaises après 1977, une musique de danse sans message politique
  (`docs/musique/kizomba.md:17-18`). Source : Baratti, Nina (2020), « Between Genre and Generations:
  Analyzing Angolan Popular Music », Etnografie Sonore / Sound Ethnographies, III/2,
  https://www.soundethnographies.it/wp-content/uploads/2022/02/03-BARATTI.pdf
  (`docs/musique/kizomba.md:172-174`).
- **F021** Le semba est le prédécesseur direct de la kizomba et du kuduro, selon Wikipédia PT
  (`docs/musique/semba.md:19`).
- **F022** Pour la danse, le dépôt cite en anglais : « Kizomba the dance is simply Semba danced to the rhythm of
  Kizomba music » (SOS Dance, « Kizomba Footwork Manual », PDF,
  https://sosadance.co.uk/wp-content/uploads/2017/07/Kizomba-Footwork-Manual-2.pdf)
  (`docs/ginga-angolana.md:75-76`, `docs/ginga-angolana.md:82`).
- **F023** Wikipédia EN présente la kizomba comme le versant social du semba. Texte anglais mot pour mot :
  `docs/ginga-angolana.md:106-107`.
- **F024** Le mot : dans l'usage local de Luanda, le mot kimbundu « kizomba » désigne une configuration sociale,
  le groupe, plutôt qu'une pratique du corps seul (thèse d'anthropologie de Toldo, 2017,
  https://theses.fr/2017PA100184) (`docs/recherche-biomecanique/danse-de-couple.md:18-20`,
  `docs/recherche-biomecanique/danse-de-couple.md:81`).
- **F025** Une revue académique (Mulemba, OpenEdition, en portugais) oppose la kizomba angolaise, posture basse et
  genoux fléchis, à la kizomba européenne, plus droite. https://journals.openedition.org/mulemba/951
  (`docs/ginga-angolana.md:118-120`).

#### Musique

- **F026** Tempo, source par source : Kizomba Seattle 80–120 bpm, faible ; Melodigging 86–100, environ 90
  courant, faible ; BeatKey 80–100, « traditionnelle » 82–95, faible ; Angola Travel Guide 60–80,
  faible ; spec d'origine du projet ≈ 90, interne (`docs/musique/kizomba.md:27-31`).
- **F027** Synthèse du dépôt : les sources se recouvrent autour de 85–95 bpm. Seul Angola Travel Guide descend à
  60–80, peut-être en comptant à la blanche ; c'est une hypothèse (`docs/musique/kizomba.md:33-34`).
- **F028** Mesure : 4/4 binaire (Wikipédia FR ; Melodigging) (`docs/musique/kizomba.md:40-41`). Selon Wikipédia
  FR, la rythmique ressemble à celle du zouk (`docs/musique/kizomba.md:42`).
- **F029** Accent : divergence entre trois sources faibles. Deuxième temps pour Angola Travel Guide, temps 3
  pour Melodigging, temps 2 et 4 pour BeatKey (`docs/musique/kizomba.md:43-45`).
- **F030** Cellule rythmique : figure 3-3-2 héritée du zouk ; percussions électroniques peu denses ; grosse
  caisse douce sur les temps forts selon Melodigging (`docs/musique/kizomba.md:49-52`). La grille écrite
  par le dépôt est une « simplification pédagogique », niveau proposition
  (`docs/musique/kizomba.md:54-55`).
- **F031** Instruments : guitares, percussions, batterie, synthétiseur (encadré de Wikipédia FR) ; instruments
  réels dans la kizomba « old school » (Kizomba Seattle) ; synthétiseurs et boîtes à rythmes (Angola
  Travel Guide) ; nappes, claviers doux, guitare claire (Melodigging, faible)
  (`docs/musique/kizomba.md:59-65`).
- **F032** Basse plus forte que dans le semba : Wikipédia EN, documenté (`docs/musique/kizomba.md:72`). La même
  source décrit un rythme lent, insistant, un peu âpre et sensuel, dû aux percussions électroniques.
  Texte anglais mot pour mot : `docs/musique/kizomba.md:19-21`.
- **F033** Harmonie : mineur ou modal, boucles de 2 à 4 accords. Niveau faible : aucune source académique
  consultée (`docs/musique/kizomba.md:80-81`).
- **F034** Piste jouée par l'application : une boucle générée par IA, fusion kizomba et semba, 102 bpm, 96 temps
  (`README.md:38-39`, `docs/musique/enregistrements.md:20`). Les sources situent la kizomba vers
  85–95 bpm ; 102 vient du prompt d'origine. Point « À confirmer »
  (`docs/spec-musique-elevenlabs.md:352-353`).

#### Le pas selon les sources du dépôt

- **F035** Le « 2 temps » : l'homme déplace sa partenaire sur la gauche, marque le sol (« marqua ») en joignant
  les pieds, puis fait de même à droite (Wikipédia FR, « Kizomba »)
  (`docs/styles-de-danse.md:82-84`).
- **F036** Le pied qui rejoint touche sans poids. Le pas ne dépasse pas la largeur du bassin. Source :
  cours-kizomba.com,
  https://cours-kizomba.com/blog/kizomba-pour-debutant-novice-le-guide-complet
  (`docs/styles-de-danse.md:84-86`).
- **F037** Angola Travel Guide : côté, ensemble, côté sur 2 temps, puis avant ou arrière sur 2 temps
  (`docs/musique/kizomba.md:97`).
- **F038** O'Dance Events, « Débuter la kizomba », https://odanceevents.com/blog/debuter-la-kizomba : la danse
  part de la marche, avec des pas courts près du sol, des genoux souples, et un centre que le guideur
  déplace juste avant de poser le pied. Texte français mot pour mot : `docs/styles-de-danse.md:136-138`.
- **F039** Saida Dance (article d'András Gulácsi, d'après la classe en ligne de Paulo Isidoro Dos Reis, avec les
  remarques d'Eddy Vents), https://saidadance.com/ginga-in-kizomba-and-semba/
  (`docs/ginga-angolana.md:33-36`) :
  - dans la kizomba et le semba, les mouvements sous les hanches dominent, pas ceux du haut du corps.
    Texte anglais : `docs/ginga-angolana.md:52-56` ;
  - la ginga n'est pas seulement le mouvement des hanches. Texte anglais : `docs/ginga-angolana.md:43-44` ;
  - selon Paulo Isidoro, la partie la plus importante de la ginga est la légère flexion des genoux.
    Texte anglais : `docs/ginga-angolana.md:63-64` ;
  - les pieds restent très près du sol. Texte anglais : `docs/ginga-angolana.md:65-69`.
- **F040** Posture : buste légèrement vers l'avant, genoux légèrement fléchis et détendus (SOS Dance ; Saida
  Dance). Textes anglais : `docs/posture-contraposition.md:10-24`.
- **F041** Udansa (page en anglais) : la kizomba repose sur une petite bascule verticale du bassin, vers l'avant
  et vers l'arrière.
  https://udansa.com/en/dance-guide/kizomba-guide/kizomba-styling-advanced/learn-kizomba-hip-movement
  (`docs/ginga-angolana.md:83-88`).
- **F042** Désaccord entre sources sur la ginga. Wikipédia FR : mouvement de hanche des filles, en 8 au sol ; le
  banga est celui des garçons (`docs/ginga-angolana.md:102-105`). Saida Dance : la ginga est unisexe, et
  « banga » désigne l'apparence soignée, pas un jeu de jambes (`docs/ginga-angolana.md:70-71`).

#### Ce que le moteur anime (`src/styles.ts:42-65`)

- **F043** Posture : buste incliné de 0,10 rad vers l'avant (≈ 5,7°, conversion) ; flexion de base des genoux
  0,30 rad (≈ 17°, conversion) (`src/styles.ts:45`).
- **F044** Appui : `support = −S2(b)`. Le poids passe entièrement d'un pied à l'autre à chaque temps. Un
  aller-retour gauche-droite dure 2 temps (`src/styles.ts:52`, `docs/musique/kizomba.md:101-102`).
- **F045** Translation : le corps se déplace de 7 cm de chaque côté, vers le pied d'appui, sur 2 temps
  (`src/styles.ts:55`, `src/styles.ts:16`).
- **F046** Niveau : consigne de 2 cm sous le repère, avec ±1 cm une fois par temps (`src/styles.ts:56`).
- **F047** Roulis du bassin : ±0,05 rad, soit ±2,9°, sur 2 temps (`src/styles.ts:57`,
  `docs/recherche-biomecanique/confrontation-modele.md:37`).
- **F048** Lacet du bassin : ±0,03 rad (≈ 1,7°, conversion), sur 2 temps (`src/styles.ts:58`).
- **F049** Bascule avant-arrière : ±0,02 rad (≈ 1,1°, conversion), une fois par temps (`src/styles.ts:59`).
- **F050** Hanches : ±0,24 rad, alternées (`src/styles.ts:60-61`). Genoux : de 0,10 à 0,24 rad ; le genou d'appui
  plie le plus (`src/styles.ts:62-63`, `docs/musique/confrontation-moteur.md:41-42`).
- **F051** Tronc : aucune courbe propre (`src/styles.ts:53-64`). Puce affichée par l'application : « Bassin
  souple, sous-produit de la marche — haut du corps calme » (`src/styles.ts:49`).
- **F052** Période du cycle : 2 temps (`src/styles.ts:54-59`). Tempo conseillé : 90 bpm, plage 80–100
  (`src/music/patterns.ts:137-138`). En vitrine, le tempo est celui de la piste, 102 bpm
  (`docs/spec-vitrine-danse-auto.md:43-44`).

#### Ce qui la distingue, selon le dépôt

- **F053** « Bassin neutre : le mouvement pelvien est un sous-produit du transfert de poids, pas une
  isolation. » Niveau constant, pas courts, pauses longues (`docs/styles-de-danse.md:33-36`).

#### Réserves signalées

- **F054** Phase : le 19 novembre, le plein appui tombait entre les temps ; verdict « à revoir »
  (`docs/musique/confrontation-moteur.md:27`, `docs/musique/confrontation-moteur.md:40-42`). Corrigé le
  20 novembre par le décalage d'un demi-temps (`docs/spec-temps-transferts.md:26-30`). État mesuré :
  règle respectée sur place, six styles, à 0,045 temps près (`docs/regles-proprietaire.md:65`).
- **F055** Marqua : le moteur transfère le poids à chaque temps. Si la marqua est sans poids, comme le dit
  cours-kizomba.com, le poids reste deux temps du même côté et le cycle dure 4 temps. Question ouverte
  au propriétaire (`docs/musique/confrontation-moteur.md:43-46`,
  `docs/musique/confrontation-moteur.md:130`).
- **F056** Tempo : « cohérent » avec les sources (`docs/musique/confrontation-moteur.md:38-39`).
- **F057** Roulis : ±2,9° est « cohérent » avec l'obliquité du bassin à la marche, 6 à 9° crête à crête
  (`docs/recherche-biomecanique/confrontation-modele.md:37`,
  `docs/recherche-biomecanique/README.md:16-17`).
- **F058** La spec d'origine donnait un roulis de ±0,045 rad et des genoux à ≈ 0,10 rad
  (`docs/styles-de-danse.md:35-36`) ; le code donne 0,05 et 0,10 à 0,24 (`src/styles.ts:57`,
  `src/styles.ts:62-63`).

### 2.2 Semba

#### Origine, filiation, influences

- **F059** Musique et danse de Luanda, très populaires dans les années 1950 (Wikipédia PT ; Kizombalove). Le mot
  signifie « umbigada », coup de nombril, en kimbundu (`docs/musique/semba.md:7-8`). Sources :
  Wikipédia PT, « Semba », https://pt.wikipedia.org/wiki/Semba ; Kizombalove Academy, « Semba history:
  music », https://kizombalove.com/en/semba-history/music/ (`docs/musique/semba.md:187`,
  `docs/musique/semba.md:190-191`).
- **F060** Une école angolaise, joinangola.com, donne le même sens au mot et appelle le semba classique la danse
  des « kotas ». https://joinangola.com/semba/ (`docs/ginga-angolana.md:116-117`).
- **F061** Racines : la massemba, danse de couple à umbigada (le chanteur Carlos Burity, cité par Kuschick et
  Zattera 2013 et par Wikipédia PT) ; les rythmes de carnaval kazukuta et kabetula (Kizombalove ;
  Baratti 2020 parle de « semba kazukuta ») (`docs/musique/semba.md:9-12`).
- **F062** Passage à la guitare : le groupe N'gola Ritmos, fondé en 1947 (Liceu Vieira Dias, José Maria, Nino
  Ndongo, Amadeu Amorim), a porté la massemba sur les guitares. Source : Wikipédia EN, « Ngola Ritmos »,
  https://en.wikipedia.org/wiki/Ngola_Ritmos, phrase sans référence directe selon le dépôt. Le groupe
  utilisait guitare, dikanza, ngomas, accordéon (`docs/musique/semba.md:13-16`,
  `docs/musique/semba.md:188-189`).
- **F063** Charge politique : musique de revendication avant l'indépendance de 1975 (témoignages d'Amadeu Amorim
  et de Carlos Lamartine, recueillis par Kuschick et Zattera 2013) (`docs/musique/semba.md:17-18`).
  Source : Kuschick et Zattera (2013), « O semba nos musseques de Angola: estudos preliminares », Anais
  do XXIII Congresso da ANPPOM,
  https://anppom.org.br/anais/anaiscongresso_anppom_2013/2406/public/2406-6908-1-PB.pdf
  (`docs/musique/semba.md:184-186`).
- **F064** Descendance : prédécesseur direct de la kizomba et du kuduro (Wikipédia PT). Dans les années 1970, la
  rumba congolaise associée au semba donne la rumba angolaise (`docs/musique/semba.md:19-20`).
- **F065** Le dépôt qualifie la samba de « fille du semba », sans source citée à cet endroit
  (`docs/styles-de-danse.md:139`).
- **F066** Point de méthode : Amadeu Amorim regrette que le genre ne soit ni écrit ni structuré. Conclusion du
  dépôt : « Il n'existe donc pas un motif canonique du semba. » (`docs/musique/semba.md:21-23`).

#### Musique

- **F067** Tempo, source par source : Kizomba Seattle 90–150 bpm, faible ; BeatKey 100–125, faible ; Angola
  Travel Guide « mid-tempo », sans chiffre, faible ; moteur et spec d'origine ≈ 130, interne ; SongBPM
  95 ou 190 pour un titre de Bonga, estimation algorithmique (`docs/musique/semba.md:27-33`).
- **F068** « Les sources ne s'accordent pas. » Une partie de l'écart vient du comptage, à la noire ou à la
  blanche. Proposition du dépôt : 120 bpm à la noire (`docs/musique/semba.md:35-37`).
- **F069** Mesure : 2/4, premier temps appuyé, second plus discret (African Music Library, source anonyme,
  faible, https://africanmusiclibrary.org/genre/Semba) (`docs/musique/semba.md:41-42`,
  `docs/musique/semba.md:192-193`).
- **F070** Caractère : syncopé, sur le contretemps, rebondissant, qualifié de « shuffle » (African Music
  Library). Kizomba Seattle parle d'une syncope « galopante » et précise qu'il n'y a pas de rythme zouk
  dans le semba (`docs/musique/semba.md:43-46`).
- **F071** Cellule rythmique : la source la plus précise est l'analyse par Baratti (2020) de « João Domingu »
  (N'gola Ritmos, 1965). Deux ngomas, une grave et une aiguë. La ngoma aiguë renforce la cellule de la
  dikanza, sur toutes les doubles-croches. La ngoma grave marque le temps fort
  (`docs/musique/semba.md:50-56`).
- **F072** Documenté : la grille de doubles-croches pleine et le grave sur le temps fort. Non documenté : la
  place des accents de la dikanza ; les accents « galop » sont une proposition
  (`docs/musique/semba.md:58-60`).
- **F073** Instruments par période, d'après Baratti (2020) : années 1950–1960, ngomas, dikanza (racleur en
  bambou), deux guitares, trois voix, accordéon chez N'gola Ritmos ; fin des années 1960 et années
  1970, guitare basse et congas, guitares électriques influencées par la guitare congolaise ; semba
  contemporain, congas avec batterie, tambourin, clavier (`docs/musique/semba.md:64-68`).
- **F074** Harmonie : simple, surtout tonique–dominante (Baratti 2020) (`docs/musique/semba.md:84-86`).
- **F075** Caractère : festif et collectif (Baratti 2020) ; rebondissant, extraverti, avec plus de distance entre
  guideur et suiveur que dans la kizomba (Kizomba Seattle) (`docs/musique/semba.md:92-94`).

#### Le pas selon les sources du dépôt

- **F076** Angola Travel Guide, « Angola Music and Dance », https://angolatravelguide.com/angola-music-dance/ :
  le pas de base est un triple pas vite-vite-lent, compté « 1-2-3, pause », avec un petit rebond de
  hanche à chaque temps ; sur place sur les temps 1 et 2, avec un léger mouvement de hanche d'un côté à
  l'autre ; un petit pas avant ou arrière sur le temps 3 ; le rebond vient des genoux. Texte anglais mot
  pour mot : `docs/styles-de-danse.md:102-104`. Source anonyme, faible
  (`docs/musique/semba.md:196-197`).
- **F077** O'Dance Events, https://odanceevents.com/blog/kizomba-semba-urban-kiz : plus rapide que la kizomba,
  rebond marqué, changements de direction nets sur musique vive (`docs/styles-de-danse.md:97-98`).
- **F078** La même page d'Angola Travel Guide dit le semba rebondissant et de tempo moyen, la kizomba lente
  (60 à 80 bpm), le kuduro rapide (130 à 145 bpm). Texte anglais : `docs/styles-de-danse.md:99-100`.
- **F079** Reddit r/kizomba décrit une même marche de base pour le semba et la kizomba : les hanches absorbent le
  mouvement, les épaules restent immobiles. https://www.reddit.com/r/kizomba/comments/2vwo4u/
  (`docs/ginga-angolana.md:98-101`).

#### Ce que le moteur anime (`src/styles.ts:66-92`)

- **F080** Posture : buste incliné de 0,06 rad vers l'avant (≈ 3,4°, conversion) ; genoux 0,24 rad (≈ 14°,
  conversion) (`src/styles.ts:69`).
- **F081** Appui : `support = −S2(b)`, transfert complet à chaque temps (`src/styles.ts:76`).
- **F082** Translation : ±5 cm, sur 2 temps (`src/styles.ts:79`).
- **F083** Rebond : le corps descend jusqu'à 5,5 cm puis remonte, deux fois par temps (`src/styles.ts:80`,
  `docs/musique/confrontation-moteur.md:56-57`).
- **F084** Roulis du bassin : ±0,09 rad, soit ±5,2°, sur 2 temps (`src/styles.ts:81`,
  `docs/recherche-biomecanique/confrontation-modele.md:38`).
- **F085** Bascule avant-arrière : ±0,04 rad, une fois par temps (`src/styles.ts:82`). Pas de lacet du bassin
  (`src/styles.ts:77-91`).
- **F086** Hanches : ±0,40 rad (`src/styles.ts:83-84`). Genoux : de 0,15 à 0,45 rad, genou d'appui
  (`src/styles.ts:85-86`).
- **F087** Pieds : bascule du pied jusqu'à 0,25 rad, un pied puis l'autre, une fois par pied et par temps
  (`src/styles.ts:87-88`, `docs/musique/confrontation-moteur.md:62-63`).
- **F088** Tronc : buste redressé de 0,08 rad vers l'arrière et tête de 0,04 rad, fixes
  (`src/styles.ts:89-90`). La posture de 0,06 rad vers l'avant s'y ajoute (`src/pose.ts:495`).
- **F089** Période du cycle : 2 temps ; rebond : un demi-temps (`src/styles.ts:78-80`). Tempo conseillé :
  120 bpm, plage 100–135, mesure 2/4 comptée à la noire (`src/music/patterns.ts:175-177`).

#### Ce qui le distingue, selon le dépôt

- **F090** « Rebond vertical dominant (bounce) par pompage des genoux et chevilles ». Posture dressée,
  déplacements amples, déhanché de marche amplifié, aucune isolation (`docs/styles-de-danse.md:40-43`).
- **F091** Puce affichée : « Plus rapide et ludique que la kizomba (≈130 bpm vs ≈90) » (`src/styles.ts:74`).

#### Réserves signalées

- **F092** Rebond : le moteur fait deux rebonds par temps ; la source en décrit un par temps. À 130 bpm, cela
  fait 4,3 rebonds par seconde (`docs/musique/confrontation-moteur.md:56-58`).
- **F093** Le « 1-2-3, pause » n'est pas représenté. Le motif complet dure 8 temps, au-delà des 4 temps que le
  moteur accorde aux styles (`docs/musique/confrontation-moteur.md:59-61`). Reste à faire au 20 novembre
  (`docs/spec-temps-transferts.md:53-54`).
- **F094** Pieds : la bascule du pied suit un rythme différent de celui des pas. « Incohérence interne mineure. »
  (`docs/musique/confrontation-moteur.md:62-63`).
- **F095** Tempo : 130 est dans la plage des sources, « à condition de compter à la noire »
  (`docs/musique/confrontation-moteur.md:54-55`). Le tempo conseillé du code est 120
  (`src/music/patterns.ts:177`).
- **F096** La « réception sur l'avant-pied » vient de la spec d'origine, « pas d'une source externe »
  (`docs/styles-de-danse.md:106-107`). Aucune source scientifique ne la confirme
  (`docs/recherche-biomecanique/pied-et-appuis.md:83-86`). Question posée au propriétaire
  (`docs/recherche-biomecanique/confrontation-modele.md:93-94`).
- **F097** Roulis ±5,2° : « non documenté (plausible pour un déhanché amplifié) »
  (`docs/recherche-biomecanique/confrontation-modele.md:38`).

#### Complément du 22 novembre 2026 : paroles du propriétaire

- **F320** Le propriétaire, après la troisième version de la vidéo : « En semba le 2e rebond est fait comme un
  chacha en refaisant rapidement un petit rond du "8" de ginga avant de reprendre le mouvement de "8" plus
  grand. » (`docs/recherche-danse/README.md`, « Paroles du propriétaire »).
- **F321** Le modèle ne trace pas de « 8 » en semba : sur place, le bassin va et vient en ligne droite, 10,0 cm
  de côté et 0 cm d'avant en arrière, mesurés en mode film (`docs/recherche-danse/README.md`, « Ce que le
  modèle fait aujourd'hui »).
- **F336** Le propriétaire, le même jour, précise : « Le double rebond du semba c'est le doublement de transfert
  vers le meme coté en initiant un transfert vers le coté opposé et en re-transferant vers le coté initial a
  la place » (`docs/recherche-danse/README.md`, « Le même jour, après la quatrième version »).

#### Complément du 23 novembre 2026 : le pas de base élu

Mesures : `node scripts/video/mesurer_pas.mjs` (danseur seul, sur place, sur le GLB) et
`MESURES=1 node scripts/tracer_hanches.mjs /dev/null aujourdhui seul base semba`.

- **F338** Depuis le 23 novembre 2026, le pas de base du semba, danseur seul sur place, est celui que le
  propriétaire a élu sur films (variante `parCote`). En couple et en déplacement, le modèle d'avant reste
  (chantier #187). Les faits F081 à F089, F092 à F094 et F321 décrivent le modèle d'avant, visible par
  `?semba=ancien` (`docs/spec-ginga-huit.md`, « Les pas élus deviennent les pas de base » ;
  `docs/elections/ginga-huit.md`, dixième tour).
- **F339** Appuis : le poids arrive deux fois de suite sur chaque pied (gauche, gauche, droite, droite), cycle
  de quatre temps. Avant la deuxième arrivée, un quart du poids repart vers l'autre pied, n'y arrive pas et
  revient : c'est le double rebond, un temps sur deux. Le poids change donc de pied tous les deux temps
  (`src/styles.ts`, `sembaSupport` ; mesure).
- **F340** Rebond : la hanche s'assoit à chaque arrivée du poids, une fois par temps. Le bassin monte et descend
  de 2,4 cm ; chaque hanche de 5,7 cm. Dans le modèle d'avant : 10,3 cm, deux fois par temps
  (`docs/elections/ginga-huit.md`, dixième tour ; mesure).
- **F341** Bassin : 9 cm d'un côté à l'autre, 3 cm d'avant en arrière ; il pivote de 8° de chaque côté ; il
  n'est jamais à l'arrêt. Vu de dessus, son trajet entoure 15 cm² (0,2 cm² dans le modèle d'avant, une ligne)
  (mesure ; `docs/elections/ginga-huit.md`, dixième tour).
- **F342** Buste et jambes : le buste suit le bassin (6,8 cm de côté) et le tronc penche de 15° vers l'avant ;
  genoux de 30° à 49° ; le talon du pied libre se lève de 6°, la pointe reste au sol
  (`docs/elections/ginga-huit.md`, dixième tour ; mesure).
- **F343** Écart aux sources : ce motif d'appuis est le choix du propriétaire. Les sources écrites décrivent
  « un, deux, trois, pause » (F076), visible par `?semba=pause`. Le rebond, un par temps, rejoint la source
  (la réserve F092 ne vaut plus pour le pas élu). Le tronc penché n'est pas la posture dressée de F090
  (`docs/styles-de-danse.md`, semba ; `docs/spec-ginga-huit.md`).

### 2.3 Kompa

#### Origine, filiation, influences

- **F098** Créé par le saxophoniste Nemours Jean-Baptiste à Port-au-Prince (`docs/musique/kompa.md:7`).
- **F099** Les dates divergent. WXPN : premier concert de son Conjunto International le 26 juillet 1955, date
  retenue comme anniversaire du konpa. Wikipédia EN : Ensemble aux Callebasses (1955), devenu Ensemble
  Nemours Jean-Baptiste en 1957. Wikipédia FR, citant France Info (2014) : invention graduelle du
  compas direct vers 1957 (`docs/musique/kompa.md:7-11`). Sources : WXPN, Nathalie « Talie » Cerin
  (26 juillet 2021), « The birth of Konpa! », https://xpn.org/birth-of-konpa/ ; Wikipédia EN,
  « Compas », https://en.wikipedia.org/wiki/Compas ; Wikipédia FR, « Compas direct »,
  https://fr.wikipedia.org/wiki/Compas_direct (`docs/musique/kompa.md:182-187`).
- **F100** Filiation : une méringue ralentie mêlée aux percussions d'héritage africain (le producteur Fabrice
  Rouzier, cité par WXPN) ; une méringue modernisée avec des éléments latins et jazz (Wikipédia EN)
  (`docs/musique/kompa.md:12-14`).
- **F101** « Konpa dirèk » : selon Nemours lui-même, rapporté par WXPN, « direct » renvoie à l'harmonie, deux
  accords seulement (`docs/musique/kompa.md:15-16`).
- **F102** Milieu des années 1960 : les mini-jazz, lancés par Shleu-Shleu, jouent avec deux guitares
  électriques, basse électrique, batterie, congas, timbales et deux cloches (Wikipédia EN)
  (`docs/musique/kompa.md:17-18`).
- **F103** Années 1980 : la boîte à rythmes remplace les percussionnistes, le synthétiseur remplace les
  cuivres ; un motif de guitare répétitif devient la signature, appelé kite'l maché (Wikipédia FR,
  citant Plume-Evasion) (`docs/musique/kompa.md:19-21`).
- **F104** Descendance : le zouk antillais en dérive en partie ; le zouk love est décrit comme un compas enrichi
  en MIDI (Wikipédia EN « Zouk », citant Occo 2019 et Ellingham 1999) (`docs/musique/kompa.md:22-23`).
- **F105** Inscription par l'UNESCO au patrimoine culturel immatériel le 10 décembre 2025 : le dépôt la note
  comme un « résultat de recherche, non vérifié sur le site de l'UNESCO »
  (`docs/musique/kompa.md:24-25`).

#### Musique

- **F106** Tempo, source par source : Haitian Music Zone 110–130 bpm, tempo moyen constant, faible (anonyme) ;
  spec d'origine 110–130, interne ; SongBPM, dix titres de Nemours Jean-Baptiste, 91 à 129 bpm,
  estimation algorithmique ; Tabou Combo « New York City » 120 bpm, estimation algorithmique
  (`docs/musique/kompa.md:31-34`).
- **F107** Aucune source académique consultée ne chiffre le tempo. Proposition du dépôt : 120 bpm
  (`docs/musique/kompa.md:36-37`).
- **F108** Mesure : 4/4 régulier, constant dans un morceau (Haitian Music Zone ; Wikipédia EN)
  (`docs/musique/kompa.md:41-42`).
- **F109** Cellule rythmique selon Haitian Music Zone : grosse caisse sur 1 et 3, caisse claire ou tanbou sur 2
  et 4, cloche ou güira en croches, basse calée sur la grosse caisse. Source faible, « à prendre comme
  une description d'ensemble, pas comme une transcription » (`docs/musique/kompa.md:43-46`).
- **F110** Héritage de la méringue : une figure syncopée de cinq coups, le cinquillo (Wikipédia EN « Méringue »,
  citant Averill 1997, p. 33–34) (`docs/musique/kompa.md:47-50`). Source sérieuse, mais pour la
  méringue, pas pour le konpa lui-même (`docs/musique/kompa.md:54-55`).
- **F111** Le « gong » : « n'a été trouvé dans aucune source consultée ». Le floor tom est attesté, pas la
  partie qu'il joue (`docs/musique/kompa.md:59-61`).
- **F112** Instruments : guitares électriques, saxophones et cuivres, claviers ou accordéon ; batterie, congas,
  timbales, tanbou (Wikipédia EN). Graj, tcha-tcha, cloche, petites cymbales (Haitian Art Studio,
  commercial, faible) (`docs/musique/kompa.md:66-69`).
- **F113** Basse : une basse en marche constante sous deux accords, selon Nemours, rapporté par WXPN. Texte
  anglais : `docs/musique/kompa.md:78-79`.
- **F114** Harmonie : deux accords, V–I, dans le konpa dirèk d'origine (Nemours, rapporté par WXPN)
  (`docs/musique/kompa.md:86-87`).
- **F115** Caractère : régulier, fluide (Wikipédia EN). Morceaux longs, six à sept minutes au minimum (WXPN)
  (`docs/musique/kompa.md:93-95`). Danse de couple serrée, hanches qui roulent, « gouyad »
  (`docs/musique/kompa.md:96-97`).

#### Le pas selon les sources du dépôt

- **F116** Haitian Music Zone, « How To Dance Kompa: Beginner Steps, Partner Moves, Timing » (1er décembre 2025,
  anonyme, faible),
  https://haitianmusiczone.com/how-to-dance-kompa-beginner-steps-partner-moves-timing/ : temps 1, pas à
  gauche avec transfert complet ; temps 2, le pied droit touche sans poids ; temps 3, pas à droite avec
  transfert complet ; temps 4, le pied gauche touche sans poids. Hanches accentuées sur 2 et 4. Pas de
  pause décrite (`docs/musique/kompa.md:101-103`, `docs/musique/kompa.md:192-194`).
- **F117** Wikipédia EN : un deux-pas « carré » introduit par Nemours (`docs/musique/kompa.md:104`).
- **F118** La spec d'origine disait « pas, rassembler, pas, pause », avec un hip check sur le temps 4. « Ce
  temps 4 n'a pas été retrouvé dans une source externe. » (`docs/musique/kompa.md:105-106`).

#### Ce que le moteur anime (`src/styles.ts:30-39`, `src/styles.ts:93-122`)

- **F119** Posture : buste incliné de 0,08 rad vers l'avant (≈ 4,6°, conversion) ; genoux 0,20 rad (≈ 11°,
  conversion) (`src/styles.ts:96`).
- **F120** Appui : période de 4 temps. Le poids passe sur un pied dans les 0,4 temps qui précèdent le pas. Il y
  reste pendant la touche. Puis il passe sur l'autre pied (`src/styles.ts:30-39`,
  `docs/spec-temps-transferts.md:31-33`). Un transfert tous les deux temps
  (`src/styles.ts:103-105`).
- **F121** Translation : ±8,1 cm pour le corps (0,09 × 0,9) et ±1,8 cm de plus pour le bassin seul (0,02 × 0,9)
  (`src/styles.ts:108-111`).
- **F122** Niveau : 6 cm sous le repère, constant (`src/styles.ts:110`).
- **F123** Roulis du bassin : ±0,09 rad (0,1 × 0,9) (`src/styles.ts:108`, `src/styles.ts:112`).
- **F124** Lacet du bassin : ±0,02 rad, sur 2 temps (`src/styles.ts:113`). Pas de bascule avant-arrière
  (`src/styles.ts:106-121`).
- **F125** Hanches : −0,05 rad, fixes (`src/styles.ts:114-115`). Genoux : de 0,28 à 0,36 rad, genou d'appui
  (`src/styles.ts:116-117`).
- **F126** Hip check : un décalage latéral du bassin de 8 mm au plus. Commentaire du code : « Hip check on the
  touch (2 and 4). » (`src/styles.ts:119-120`).
- **F127** Tronc : une contre-inclinaison latérale du buste de ±0,03 rad (`src/styles.ts:118`). Elle est annulée
  par `iso=1`, actif par défaut (`src/styles.ts:299-300`).
- **F128** Tempo conseillé : 120 bpm, plage 100–130 (`src/music/patterns.ts:210-211`).
- **F129** Dans ce style, l'application ne propose que le sur place et l'aller-retour avant-arrière. Mots du
  propriétaire : « on peut laisser le style konpa faire uniquement le sur place et le avant / arrière
  (pas de marka en konpa) » (`src/styles.ts:405-410`).

#### Ce qui le distingue, selon le dépôt

- **F130** « Translation latérale pure du bassin en balancier + inclinaison (pelvic drop) côté appui. » Genoux
  fléchis en continu, niveau bas constant. « Épaules et buste quasi immobiles : tout le mouvement
  visible est sous la ceinture. » (`docs/styles-de-danse.md:46-50`).
- **F131** Le déplacement latéral n'est pas proposé à part : le balancement latéral « est le style lui-même »
  (`docs/spec-temps-transferts.md:38-39`).

#### Réserves signalées

- **F132** Constat du 19 novembre : le moteur faisait deux transferts par temps, « quatre fois trop vite » par
  rapport à la source pédagogique (`docs/musique/confrontation-moteur.md:68-71`). Corrigé le
  20 novembre : un transfert tous les deux temps (`docs/spec-temps-transferts.md:31-33`).
- **F133** Trois endroits du dépôt disent encore « un transfert de poids par temps », dont deux en citant
  Haitian Music Zone (`docs/styles-de-danse.md:110-111`,
  `docs/adr/002-mouvements-sources-muscles-sorties.md:22-23`, `src/styles.ts:22-23`). La page
  pédagogique de ce site ne le confirme pas (`docs/musique/confrontation-moteur.md:72-74`).
- **F134** La « pause » du temps 4 ne vient d'aucune source externe (`docs/musique/kompa.md:105-106`).
- **F135** Numérotation des temps, lecture du code, non vérifiée à l'écoute. Le test place le plein appui gauche
  aux valeurs d'horloge 1 et 2, le droit à 3 et 4 (`scripts/test_temps_transferts.mjs:34-35`). La grille
  musicale place son « temps 1 » quand l'horloge est un multiple de 4
  (`docs/spec-son-synthese.md:32-34`), avec la grosse caisse du kompa à cet instant et le tanbou un
  temps plus tard (`src/music/patterns.ts:214-219`). La fiche ne tranche pas si le « 1 » du pas et le
  « 1 » de la grille désignent le même instant.
- **F136** Roulis : la recherche biomécanique note ±0,088 rad (±5,0°) pour la version précédente, « non
  documenté (plausible pour un déhanché amplifié) »
  (`docs/recherche-biomecanique/confrontation-modele.md:38`).
- **F137** Les titres anciens de Nemours paraissent plus lents que la plage des pédagogues
  (`docs/musique/kompa.md:36-37`).

#### Complément du 22 novembre 2026 : paroles du propriétaire et recherche #161

- **F322** Le propriétaire, après la troisième version de la vidéo : « Le konpa est complètement faux
  actuellement: c'est le 8 le plus prononcé justement. » (`docs/recherche-danse/README.md`, « Paroles du
  propriétaire »).
- **F323** Le modèle ne trace pas de « 8 » en kompa : sur place, le bassin va et vient en ligne droite, 20,6 cm
  de côté et 0 cm d'avant en arrière, mesurés en mode film. C'est le trajet le plus large des six styles
  (`docs/recherche-danse/README.md`, « Ce que le modèle fait aujourd'hui »).
- **F324** Le pas de base selon ses professeurs : une marche en rythme, un appui par temps, avec un transfert
  franc du poids. Sources : le manuel de Cliford et Gaëlle Jasmin, cité par *Le Nouvelliste* (15 juin 2022) ;
  les professeurs Dady et Manuela ; l'école Danse Select Canada ; la page de l'UNESCO
  (`docs/recherche-danse/kompa.md`, « Ce que disent les sources », point 1).
- **F325** Le bassin se relâche sur le demi-temps, juste avant chaque appui ; le mouvement de base est à la fois
  vertical et horizontal. Aucune source ne confirme un accent des hanches sur les temps 2 et 4
  (`docs/recherche-danse/kompa.md`, point 2).
- **F326** Au rythme ralenti, le *dodo mea*, on reste près de deux temps sur le même pied : « on dessine un demi
  8 avec le bassin sur chaque appui » (livre des Jasmin, cité par C. B. Sérant). La hanche va de l'avant vers
  l'arrière en passant par le côté (`docs/recherche-danse/kompa.md`, point 3).
- **F327** Deux ouvrages universitaires, lus par extraits, décrivent des hanches en huit dans la danse collée
  sur konpa : *kole mabouya* (Averill 1997, p. 20) et *klere bouk sentiwon* (McAlister 2002, p. 49)
  (`docs/recherche-danse/kompa.md`, point 3).
- **F328** Dans le pas *dodomeya*, pieds au sol, ce sont les genoux qui balancent les hanches (Danse Select
  Canada, transcription automatique d'un cours filmé) (`docs/recherche-danse/kompa.md`, point 4).
- **F329** Le gouyad est d'abord un mouvement : rouler ou tourner le bassin, souvent en cercle (Averill,
  McAlister, dictionnaires créoles). Le mot désigne aussi un konpa plus lent
  (`docs/recherche-danse/kompa.md`, point 5).
- **F330** Il y a plusieurs pas de base : marqué, méringue, dodomeya, dirèk (Danse Select Canada). Le « pas,
  touche » de Haitian Music Zone (F116) correspond au pas méringue. Le *kare*, « carré », est le deux-pas des
  débuts, dans les années 1950 (Averill, Freeman) (`docs/recherche-danse/kompa.md`, point 6).
- **F331** Le modèle tient le poids deux temps par pied (F120) : c'est le rythme du ralenti, pas celui du pas de
  base marché (`docs/recherche-danse/kompa.md`, « Le modèle face aux sources »).
- **F332** Aucune source ne dit que le « 8 » du kompa est le plus prononcé des styles : il n'y a là que la
  parole du propriétaire. Les sources attachent le « 8 » au ralenti et à la danse collée, pas au pas de base
  marché. Aucune ne décrit le pas du kompa comme un simple balancier de côté ; une seule nomme ce balancier, comme
  alternative facile au « 8 » (F337) (`docs/recherche-danse/kompa.md`, « Ce que les sources ne disent pas »).
- **F337** Une école de Miami (Sony Laventure, KOTR Dance Studio, 2020) enseigne la rotation des hanches en « 8 »
  comme l'une des premières choses du cours ; à deux, c'est le *gouye* : on reste sur place, les hanches
  tournent, les genoux plient beaucoup. Le balancement d'un côté à l'autre y porte un autre nom, *yayad*, et
  y est présenté comme l'alternative facile au « 8 » (`docs/recherche-danse/kompa.md`, source K18).
- **F333** L'inscription du compas d'Haïti par l'UNESCO est vérifiée : élément n° 02273, Liste représentative,
  2025, décision 20.COM 7.B.22. La page décrit une marche rythmée, avec des mouvements du bassin, des pas
  alternés et un contact entre les danseurs. Ce fait lève la réserve de F105
  (`docs/recherche-danse/kompa.md`, source K10).

#### Complément du 23 novembre 2026 : le pas de base élu

Mesures : `node scripts/video/mesurer_pas.mjs` et
`MESURES=1 node scripts/tracer_hanches.mjs /dev/null aujourdhui seul base kompa`.

- **F344** Depuis le 23 novembre 2026, le pas de base du kompa, danseur seul sur place, est celui que le
  propriétaire a élu en neuf tours de films (variante `assisBuste`). En couple et en déplacement, le modèle
  d'avant reste (chantier #187). Les faits F119, F121 à F127 et F323 décrivent le modèle d'avant, visible par
  `?kompa=ancien` (`docs/spec-ginga-huit.md`, « Les pas élus deviennent les pas de base » ;
  `docs/elections/ginga-huit.md`, neuvième tour).
- **F345** Appuis, inchangés : le poids reste deux temps sur chaque pied et passe en 0,4 temps (F120). C'est
  toujours le rythme du ralenti (F331) (`src/styles.ts`, `kompaSupport` ; mesure).
- **F346** Bassin : la hanche s'assoit quand le poids arrive, puis remonte en tournant. Le bassin fait 12,2 cm
  d'un côté à l'autre, 3,5 cm d'avant en arrière, 1,6 cm de haut ; il pivote de 11,5° de chaque côté ; il n'est
  jamais à l'arrêt (0,56 temps d'arrêt de chaque côté dans le modèle d'avant). Chaque hanche fait 12 cm de
  côté, 5,9 cm d'avant en arrière et 5,8 cm de haut (mesure ; `docs/elections/ginga-huit.md`, neuvième tour).
- **F347** Le « 8 » : vu de dessus, le trajet du bassin se croise en son milieu et entoure 16,6 cm² ; chaque
  hanche entoure 21 à 22 cm² (1,0 cm² dans le modèle d'avant, une ligne droite de 20,6 cm) (mesure ;
  `docs/spec-ginga-huit.md`, tableau du kompa ; `docs/gifs/trace-kompa-assisBuste.gif`).
- **F348** Jambes et buste : les genoux plient en alternance, de 24° à 45° (53° à 60°, les deux, avant) ; le
  talon du pied libre se lève de 6° ; le buste suit le bassin (9,5 cm de côté, 3° de pivot) et le tronc penche
  de 16° vers l'avant (`docs/elections/ginga-huit.md`, neuvième tour ; mesure).
- **F349** Écart aux sources : ce pas est le choix du propriétaire, pas celui d'une source. La hanche s'assoit
  vers l'arrière sur le temps ; dans le manuel cité par *Le Nouvelliste* (F326), elle va de l'avant vers
  l'arrière au fil de l'appui (`docs/elections/ginga-huit.md`, « Limites » du huitième tour ;
  `docs/styles-de-danse.md`, kompa).

#### Complément du 24 novembre 2026 : un appui par temps

- **F356** Depuis le 24 novembre 2026 (#195, règle R40 du propriétaire), le pas de base du kompa, danseur seul
  sur place, change de pied à chaque temps : le pas élu (F344) est lu deux fois plus vite. Le poids arrive à
  gauche sur les temps impairs, à droite sur les temps pairs. Ce fait remplace F345, et F331 pour le pas de base
  (`src/styles.ts`, `KOMPA_BEATS`, `kompaBeat` ; `docs/spec-ginga-huit.md`, « Le kompa : un appui par temps »).
  Le modèle rejoint ainsi ce que décrivent ses professeurs : un appui par temps (F324). En couple et en
  déplacement, le kompa garde deux temps par appui (chantier #187).
- **F357** Mesures à ce rythme : le bassin fait 11,7 cm d'un côté à l'autre, 3,5 cm d'avant en arrière, 1,5 cm
  de haut ; il pivote de 11,5° de chaque côté ; il n'est jamais à l'arrêt ; vu de dessus, il entoure 16,6 cm² en
  quatre temps. Le buste suit (8,9 cm de côté), le tronc penche de 16° ; les genoux plient de 24° à 45°. Arrivées
  du poids sur huit temps : G D G D G D G D (mesure, `scripts/video/mesurer_pas.mjs`).

### 2.4 Tarraxinha

#### Origine, filiation, influences

- **F138** Genre de musique et de danse d'Angola, né dans la province de Benguela (Wikipédia EN, qui s'appuie
  sur Discovering Kizomba). Le mot signifie « petite vis », de « tarraxa », vis
  (`docs/musique/tarraxinha.md:7-8`). Source : Wikipédia EN, « Tarraxinha »,
  https://en.wikipedia.org/wiki/Tarraxinha (`docs/musique/tarraxinha.md:149-150`).
- **F139** Deux filiations « divergentes » (`docs/musique/tarraxinha.md:9`) :
  - Discovering Kizomba (2024) : la musique tarraxinha a commencé comme un kuduro ralenti. Pionniers
    cités : DJ Madabaya et DJ Znobia, début des années 2000 ou avant. Aucun lien direct avec la kizomba,
    hormis l'origine angolaise. Texte anglais : `docs/musique/tarraxinha.md:10-12`. Source : « What are
    Tarraxinha, Tarraxa, Tarraxo? Are they different from Kizomba? »,
    https://discoveringkizomba.com/tarraxinha-tarraxa-difference-to-kizomba/
    (`docs/musique/tarraxinha.md:151-153`).
  - Benjamin Lebrave, The Fader (2013) : des producteurs angolais ont pris la kizomba, l'ont ralentie
    et dépouillée pour faire ressortir le balancement des hanches. Apogée de la production vers 2006,
    quasi-fin en 2007 (`docs/musique/tarraxinha.md:13-15`). Source : « Lungu Lungu: DJ Marfox,
    Tarraxinha, and Rubbing Pelvises »,
    https://www.thefader.com/2013/3/28/lungu-lungu-dj-marfox-tarraxinha-and-rubbing-pelvises
    (`docs/musique/tarraxinha.md:154-156`).
- **F140** Dérivés européens : « tarraxa », nom européen de la danse, et « tarraxo », musique apparue à Lisbonne
  au début des années 2010, plus âpre et plus percussive (Discovering Kizomba ; Wikipédia EN)
  (`docs/musique/tarraxinha.md:16-18`).
- **F141** La tarraxinha a influencé l'urban kiz, avec la kizomba (Wikipédia EN)
  (`docs/musique/tarraxinha.md:19`).

#### Musique

- **F142** Tempo, source par source : The Fader, lente, sans chiffre, presse ; BeatKey 60–80 bpm, faible ;
  Kizomba Seattle 80–100 bpm, faible ; spec d'origine « lent », interne
  (`docs/musique/tarraxinha.md:25-28`).
- **F143** « Les deux seules sources chiffrées ne se recouvrent pas. » Kizomba Seattle prévient que le tempo ne
  suffit pas à distinguer ces genres. Proposition du dépôt : 75 bpm
  (`docs/musique/tarraxinha.md:30-31`).
- **F144** Mesure : 4/4, implicite dans toutes les sources (`docs/musique/tarraxinha.md:35`).
- **F145** Aucune source ne parle d'un « temps lent » au sens d'un temps précis de la mesure. Ce qui est
  documenté : un tempo lent et un dépouillement qui met en avant le balancement des hanches (The
  Fader). La sensation demi-tempo est une proposition (`docs/musique/tarraxinha.md:36-39`).
- **F146** Cellule rythmique : minimale, lente, âpre (The Fader) ; son électronique fort et basse électronique
  lourde (Kizomba Seattle ; texte anglais : `docs/musique/tarraxinha.md:44-45`). La grille n'est pas
  documentée ; celle du dépôt est une proposition (`docs/musique/tarraxinha.md:43-48`).
- **F147** Instruments : entièrement synthétique, boîte à rythmes, claviers, voix (Kizomba Seattle)
  (`docs/musique/tarraxinha.md:52`).
- **F148** Harmonie : non documentée (`docs/musique/tarraxinha.md:67`).
- **F149** Caractère : très sensuelle, controversée à ses débuts pour cette raison (Wikipédia EN ; The Fader)
  (`docs/musique/tarraxinha.md:72-73`).

#### Le pas selon les sources du dépôt

- **F150** Sur place, isolations pelviennes, contact bassin à bassin, haut du corps immobile (Udansa,
  https://udansa.com) (`docs/styles-de-danse.md:113-115`).
- **F151** Kizomba Seattle : travail de hanches isolé et petits pas (`docs/musique/tarraxinha.md:79-81`).
- **F152** Discovering Kizomba : pas de marche, attention portée au partenaire ; mouvements de poignet comparés à
  un tournevis (`docs/musique/tarraxinha.md:82-83`).
- **F153** « Aucune source consultée ne dit sur quel temps tombe chaque phase du cercle ou du « 8 ». »
  (`docs/musique/tarraxinha.md:84`).
- **F154** Observation du propriétaire, 20 novembre 2026 : « on ne voit pas assez l'intention de la hanche vers
  l'avant (qui repart vers l'arrière légèrement sur le côté en s'ouvrant mais surtout en permettant à la
  hanche opposée d'aller vers l'avant) » (`docs/spec-sur-place-paire.md:8-10`).

#### Ce que le moteur anime (`src/styles.ts:123-147`)

- **F155** Posture : buste incliné de 0,14 rad vers l'avant (≈ 8°, conversion) ; genoux 0,34 rad (≈ 19°,
  conversion). Ce sont les deux valeurs les plus fortes des six styles (`src/styles.ts:126`, à comparer
  à `src/styles.ts:45`, `src/styles.ts:69`, `src/styles.ts:96`, `src/styles.ts:151`,
  `src/styles.ts:179`).
- **F156** Appui : `support = −0,5·S2(b)`. Le transfert est partiel, sur 2 temps (`src/styles.ts:133`). La
  charge du pied droit va de 25 % à 75 % (calcul d'après `src/pose.ts:605`).
- **F157** Pas de translation du corps entier (`src/styles.ts:134-146`). Niveau : 3 cm sous le repère, fixe
  (`src/styles.ts:135`).
- **F158** Lacet du bassin : ±0,22 rad (≈ 12,6°, conversion), sur 2 temps. C'est lui qui mène : une hanche part
  vers l'avant (`src/styles.ts:141`, `src/styles.ts:136-138`).
- **F159** Bascule avant-arrière : ±0,14 rad, soit ±8,0°, sur 2 temps (`src/styles.ts:140`,
  `docs/recherche-biomecanique/confrontation-modele.md:39`).
- **F160** Roulis du bassin : ±0,08 rad (≈ 4,6°, conversion), « secondaire » (`src/styles.ts:139`,
  `docs/spec-sur-place-paire.md:26-27`).
- **F161** Bassin : décalage latéral de ±3 cm, en quadrature avec le lacet, et décalage avant-arrière de
  ±1,2 cm (`src/styles.ts:142-143`, `docs/spec-sur-place-paire.md:26-27`).
- **F162** Genoux : de 0,06 à 0,18 rad, en alternance (`src/styles.ts:144-145`). Aucune courbe de tronc
  (`src/styles.ts:134-146`).
- **F163** Période du cycle : 2 temps (`src/styles.ts:139-143`). Tempo conseillé : 75 bpm, plage 60–100
  (`src/music/patterns.ts:247-248`). À 75 bpm, un cercle de 2 temps dure 1,6 s
  (`docs/musique/tarraxinha.md:88`).
- **F164** L'application ne propose ici que le sur place et l'aller-retour avant-arrière
  (`src/styles.ts:405-410`).

#### Ce qui la distingue, selon le dépôt

- **F165** « Isolation pelvienne volontaire maximale : cercles et « 8 » (tilt + translation + rotation). » Haut
  du corps strictement immobile. Pieds statiques, déplacement quasi nul. Guidage par contact des hanches
  (`docs/styles-de-danse.md:53-57`).
- **F166** Puce affichée : « La plus « collé-serré » (« kolé séré » en créole antillais) des variantes kizomba »
  (`src/styles.ts:131`).

#### Réserves signalées

- **F167** Filiation : les sources divergent, kuduro ralenti ou kizomba ralentie
  (`docs/musique/README.md:131-132`). La puce de l'application la range parmi les « variantes kizomba »
  (`src/styles.ts:131`), alors que Discovering Kizomba ne lui reconnaît aucun lien direct avec la
  kizomba (`docs/musique/tarraxinha.md:10-12`).
- **F168** Durée du cercle : aucune source ne la fixe par rapport aux temps. Verdict « à valider ». Si la musique
  est en demi-tempo, un cercle de 4 temps serait plus lisible
  (`docs/musique/confrontation-moteur.md:85-88`).
- **F169** Amplitudes périmées dans trois documents. Ils donnent roulis ±0,16 rad, tilt ±0,14, lacet ±0,12
  (`docs/styles-de-danse.md:22`, `docs/styles-de-danse.md:54`,
  `docs/recherche-biomecanique/confrontation-modele.md:39`,
  `docs/recherche-biomecanique/README.md:17-19`). Le code donne aujourd'hui roulis 0,08 et lacet 0,22
  (`src/styles.ts:139-141`, `docs/spec-sur-place-paire.md:26-27`).
- **F170** Biomécanique : amplitudes « non documenté ». Elles sont plausibles pour des isolations volontaires,
  mais aucune mesure ne les documente (`docs/recherche-biomecanique/README.md:17-19`).
- **F171** En danse orientale, les expertes produisent moins d'amplitude pelvienne que les novices. « Augmenter
  l'amplitude d'un style ne le rend donc pas plus « juste ». »
  (`docs/recherche-biomecanique/confrontation-modele.md:66-68`).

### 2.5 Suave

#### Origine, filiation, influences

- **F172** « Le « suave » n'est pas un genre musical. » Aucune source consultée ne le présente comme un
  sous-genre nommé de la kizomba. Le mot qualifie une manière de danser (`docs/musique/suave.md:7-8`).
- **F173** Seule attestation du mot : une étudiante angolaise de 22 ans, interrogée par Paris Match Belgique en
  2017, décrit un style très calme, qu'elle dit suave, où l'on bouge peu. Texte français mot pour mot :
  `docs/musique/suave.md:9-10`. Source : Paris Match Belgique, la rédaction (6 octobre 2017),
  « Kizomba : aux racines de la danse sensuelle de la joie angolaise »,
  https://www.parismatch.be/culture/scene/2017/10/06/kizomba-aux-racines-de-la-danse-sensuelle-de-la-joie-angolaise-FCHLOXIXIJASBBAL2OTT62BRQA/
  (`docs/musique/suave.md:138-140`).
- **F174** Dans l'application, le suave désigne « une variante lente de la kizomba, centrée sur la ginga (le
  « 8 » au sol) et la vague du tronc » (`docs/musique/suave.md:11-13`).
- **F175** Musiques sur lesquelles se danse cette variante : kizomba lente, ghetto zouk, zouk love
  (`docs/musique/suave.md:14-15`).
- **F176** Ghetto zouk : nom donné vers 2000 par Quatro Plus, groupe néerlandais d'origine cap-verdienne ;
  mélange de coladeira et de zouk ; une voix dominante, très peu d'instruments, influence R&B
  (Discovering Kizomba) (`docs/musique/suave.md:16-19`).
- **F177** Discovering Kizomba juge le ghetto zouk trop peu énergique pour la marche de la kizomba, mais adapté
  aux styles plus proches comme la tarraxinha (`docs/musique/suave.md:20-21`).
- **F178** La ginga, étymologie : Wikipédia EN, « Ginga (capoeira) », rattache le mot à « gingar », se balancer,
  et à un terme bantou du kongo et de langues d'Angola. https://en.wikipedia.org/wiki/Ginga_(capoeira).
  Texte anglais : `docs/ginga-angolana.md:10-14`.

#### Musique

- **F179** Tempo, source par source : spec d'origine, lent, ≈ 60 bpm, interne ; BeatKey, ghetto zouk et urban
  kiz, 90–108 bpm, faible ; BeatKey, zouk love, 75–90 bpm, faible ; Discovering Kizomba, lent, sans
  chiffre (`docs/musique/suave.md:29-32`).
- **F180** « La valeur de 60 bpm de la spec n'a pas de source externe. » Proposition du dépôt : 72 bpm
  (`docs/musique/suave.md:34-36`).
- **F181** Mesure : 4/4, sensation lente, beaucoup d'espace entre les coups (`docs/musique/suave.md:40`).
- **F182** Cellule rythmique : aucun motif propre. La grille du dépôt est une proposition, dérivée de la grille
  kizomba allégée (`docs/musique/suave.md:45-47`).
- **F183** Instruments : une voix, très peu d'instruments, boîte à rythmes (Discovering Kizomba, à propos du
  ghetto zouk). La couleur R&B est une proposition (`docs/musique/suave.md:51-52`).
- **F184** Basse et harmonie : non documentées (`docs/musique/suave.md:58`, `docs/musique/suave.md:63`).

#### Le pas selon les sources du dépôt

- **F185** Un « 8 » au sol ; talon levé, les fesses montent, on redescend et on change de pied
  (cours-kizomba.com). Base en 8 temps (Emove thérapie, https://emoveretherapie.com)
  (`docs/styles-de-danse.md:118-120`).
- **F186** La ginga, hanche qui dessine un 8 au sol, « correspond au suave » dans le dépôt
  (`docs/styles-de-danse.md:92`).
- **F187** Spec d'origine : balancement lent sur place, transferts partiels 60/40, souvent 2 temps par cycle,
  vague séquentielle L5, dorsales, tête (`docs/musique/suave.md:73-74`).

#### Ce que le moteur anime (`src/styles.ts:148-175`)

- **F188** Posture : buste presque droit, 0,02 rad vers l'avant (≈ 1,1°, conversion) ; genoux 0,14 rad (≈ 8°,
  conversion) (`src/styles.ts:151`).
- **F189** Appui : `support = −0,2·S2(b)`. Le transfert est partiel : 60/40 (`src/styles.ts:158`,
  `src/styles.ts:156`).
- **F190** Pas de translation du corps entier (`src/styles.ts:159-174`). Niveau : 3,5 cm sous le repère, fixe
  (`src/styles.ts:160`).
- **F191** Bassin : décalage latéral de ±3 cm sur 2 temps ; décalage avant-arrière de ±2,2 cm sur 4 temps
  (`src/styles.ts:161-162`).
- **F192** Bascule avant-arrière : ±0,05 rad sur 4 temps (`src/styles.ts:163`). Roulis : ±0,03 rad, soit ±1,7°,
  sur 2 temps (`src/styles.ts:164`, `docs/recherche-biomecanique/confrontation-modele.md:37`). Pas de
  lacet.
- **F193** Vague du tronc : cinq segments (colonne, lombaires, thoraciques, buste, tête), amplitudes 0,09, 0,10,
  0,10, 0,08 et 0,06 rad, période 4 temps, décalés les uns des autres (`src/styles.ts:165-169`).
- **F194** Genoux : de 0,04 à 0,24 rad, en alternance (`src/styles.ts:170-171`).
- **F195** Talons : bascule du pied jusqu'à 0,15 rad, un pied puis l'autre, une fois par pied et par temps
  (`src/styles.ts:172-173`).
- **F196** Période du cycle : 4 temps pour la vague, 2 temps pour le balancement latéral
  (`src/styles.ts:161-169`). Tempo conseillé : 72 bpm, plage 60–85 (`src/music/patterns.ts:279-281`).

#### Ce qui le distingue, selon le dépôt

- **F197** Le bassin dessine un « 8 couché », d'amplitude centimétrique. La vague du tronc n'est « pas une
  isolation, une transmission ». Aucun rise-and-fall. « Position d'équilibre entre ginga (trop passive)
  et tarraxinha (trop isolée) » (`docs/styles-de-danse.md:60-65`).

#### Réserves signalées

- **F198** Le suave n'a ni genre musical ni tempo sourcé (`docs/musique/confrontation-moteur.md:92-93`).
- **F199** Phase : « cohérent » avec « 2 temps par cycle » (`docs/musique/confrontation-moteur.md:94-95`).
- **F200** Talons : un soulèvement par pied et par temps, plus rapide que les transferts. « À vérifier » contre
  la description de cours-kizomba.com (`docs/musique/confrontation-moteur.md:96-97`).
- **F201** La « figure en 8 » du bassin n'a pas de description cinématique publiée
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:88`).

#### Complément du 24 novembre 2026 : deux temps par côté, sans rebond

- **F359** Depuis le 24 novembre 2026 (#200, règle R44 du propriétaire), le suave du danseur seul, sur place,
  se danse deux temps par côté, sans rebond : le poids penche à gauche (60/40) sur les temps 1 et 2, à droite sur
  3 et 4, et passe le milieu entre 2 et 3. Le balancement prend quatre temps, sans arrêt. Les talons restent au
  sol. Ce fait remplace, pour ce pas, F189, F195, F196 (balancement sur deux temps) et F200
  (`docs/spec-suave-deux-temps.md` ; `src/styles.ts`, style `suave`).
- **F360** Mesures à ce rythme : le bassin fait 6 cm d'un côté à l'autre et 4,4 cm d'avant en arrière ; vu de
  dessus, il entoure 17,6 cm², une boucle de chaque côté ; il monte et descend de 1,0 cm, une fois par côté (1,7 cm
  à chaque temps avant) ; les genoux plient de 38° à 43° ; la vague du tronc sur quatre temps est gardée (mesure,
  `scripts/video/mesurer_pas.mjs` ; `docs/spec-suave-deux-temps.md`).
- **F202** Roulis ±1,7° : « cohérent (« sous-produit de la marche ») »
  (`docs/recherche-biomecanique/confrontation-modele.md:37`).

### 2.6 Zouk brésilien

#### Origine, filiation, influences

- **F203** « Le zouk brésilien est une danse ; le zouk antillais est une musique. » Discovering Kizomba le dit
  d'une phrase : une danse sans musique propre. Texte anglais : `docs/musique/zouk-bresilien.md:5-6`.
  Source : Discovering Kizomba (23 février 2021), « Zouk: born in the Caribbean, adopted by
  Brazilians », https://discoveringkizomba.com/zouk-caribbean-brazilian/
  (`docs/musique/zouk-bresilien.md:224-225`).
- **F204** Zouk antillais : mouvement musical et danse des Antilles françaises (Guadeloupe, Martinique), lancé
  par le groupe Kassav' au début des années 1980 (Wikipédia EN « Zouk »,
  https://en.wikipedia.org/wiki/Zouk). Kassav' est fondé à Paris en 1979 par Jacob Desvarieux,
  Pierre-Édouard Décimus et Freddy Marshall (Mendez, Red Bull Music Academy Daily, 2015, « Zouk: An
  Introduction », https://daily.redbullmusicacademy.com/2015/12/zouk-feature)
  (`docs/musique/zouk-bresilien.md:13-15`, `docs/musique/zouk-bresilien.md:204-210`).
- **F205** Le premier zouk, rapide et carnavalesque, est une synthèse de kadans, de konpa et de biguine
  (Wikipédia EN, citant Manuel, Bilby et Largey 2012 ; Guilbault 1993)
  (`docs/musique/zouk-bresilien.md:16-18`).
- **F206** Mendez : Décimus et Desvarieux posent des rythmes de gwo ka sur un battement régulier, entre compas
  haïtien et funk, et travaillent en studio avec boîtes à rythmes et synthés. Le titre de 1984 « Zouk la
  sé sèl médikaman nou ni » s'appuie sur le rythme guadeloupéen mendé
  (`docs/musique/zouk-bresilien.md:19-23`).
- **F207** Zouk love : version lente et romantique des années 1990, décrite par Wikipédia EN comme un compas
  enrichi en MIDI (`docs/musique/zouk-bresilien.md:26-27`).
- **F208** Zouk brésilien : né au Brésil au début des années 1990 de la lambada (Wikipédia EN, « Brazilian
  Zouk », https://en.wikipedia.org/wiki/Brazilian_Zouk) (`docs/musique/zouk-bresilien.md:31`,
  `docs/musique/zouk-bresilien.md:220-221`).
- **F209** La lambada vient du Pará (carimbó). Après 1994, la musique lambada s'efface et les danseurs se
  tournent vers d'autres musiques, dont le zouk caribéen (Wikipédia EN, « Lambada (dance) »,
  https://en.wikipedia.org/wiki/Lambada_(dance)). La danse prend dans une grande partie du Brésil le nom
  de zouk-lambada (`docs/musique/zouk-bresilien.md:32-34`).
- **F210** À Rio, Adílio Porto et Renata Peçanha créent le style « traditionnel ». Le lambazouk (Porto Seguro)
  reste plus proche de la lambada. Viennent ensuite le neozouk et le soulzouk. Article de Wikipédia
  signalé comme manquant de sources (`docs/musique/zouk-bresilien.md:35-37`).
- **F211** Musiques actuelles : zouk antillais, puis R&B, pop, hip-hop. Dans les années 2010, zouk brésilien et
  kiz européen partagent le même répertoire de ghetto zouk (Discovering Kizomba)
  (`docs/musique/zouk-bresilien.md:38-40`).

#### Musique

- **F212** Tempo, source par source : zouk antillais d'origine 120–145 bpm (Wikipédia EN citant Torres 2013),
  documenté ; zouk love 75–90 (BeatKey), faible ; danse zouk brésilien 60–90, boucle d'exercice à 75
  (Bath Zouk), pédagogue ; danse zouk brésilien 80–100 (BeatKey), faible ; spec d'origine ≈ 110, interne
  (`docs/musique/zouk-bresilien.md:46-52`).
- **F213** « Le zouk brésilien se danse nettement plus lentement que le zouk antillais d'origine. » Proposition
  du dépôt : 80 bpm (`docs/musique/zouk-bresilien.md:54-56`).
- **F214** Mesure : 4/4 binaire (`docs/musique/zouk-bresilien.md:64`).
- **F215** Cellule du zouk antillais : figure guide 3-3-2. Britannica l'attribue surtout à la charleston ;
  Wikipédia EN « Tresillo » aux rimshots de caisse claire. « Les deux sources n'attribuent pas le 3-3-2
  au même instrument. » Britannica n'a été lue que par extraits de moteur de recherche
  (`docs/musique/zouk-bresilien.md:65-71`).
- **F216** Drumeo (2019) : boîte à rythmes dans la plupart des enregistrements ; grosse caisse sur chaque
  noire ; charleston en doubles-croches syncopées (`docs/musique/zouk-bresilien.md:72-74`).
- **F217** Rythme de danse du zouk brésilien : lent-vite-vite, « boom-chick-chick » (Bath Zouk, « Music &
  Rhythm », https://bathzouk-astro.pages.dev/library/fundamentals/concepts/rhythm)
  (`docs/musique/zouk-bresilien.md:75-76`, `docs/musique/zouk-bresilien.md:226-227`).
- **F218** Instruments du zouk antillais : gwo ka, tibwa, shak-shak, cuivres, synthétiseur, guitare, basse,
  boîte à rythmes (encadré de Wikipédia EN) (`docs/musique/zouk-bresilien.md:89-90`). Pour le zouk
  brésilien, la musique est empruntée : zouk love, R&B, pop (`docs/musique/zouk-bresilien.md:95-96`).
- **F219** Caractère : zouk antillais d'origine festif, rapide, cuivres forts (Torres) ; zouk love et zouk
  brésilien lents, romantiques (`docs/musique/zouk-bresilien.md:116-118`).

#### Le pas selon les sources du dépôt

- **F220** Bath Zouk : un pas lent sur le temps 1, qui dure 2 temps ; deux pas rapides sur 3 et 4 ; puis l'autre
  côté sur 5, 7, 8 (`docs/musique/zouk-bresilien.md:123-124`).
- **F221** Basic sur place lent-vite-vite, cambré, vagues du corps, rouleaux de tête (Get Bailar,
  https://getbailar.com ; DanceIn NJ, https://danceinnj.com). Zouk love : cambré soutenu (Inaya Zouk,
  https://inaya-zouk.com) (`docs/styles-de-danse.md:123-126`).

#### Ce que le moteur anime (`src/styles.ts:176-204`)

- **F222** Posture : buste en arrière de 0,10 rad, « cambré » ; genoux 0,12 rad (≈ 7°, conversion), la valeur la
  plus faible des six (`src/styles.ts:179`).
- **F223** Appui : `support = −S2(b)`, transfert complet à chaque temps (`src/styles.ts:186`).
- **F224** Translation : ±5 cm, sur 2 temps (`src/styles.ts:189`).
- **F225** Niveau : de 0 à 6 cm sous le repère, sur un cycle de 4 temps (`src/styles.ts:190`).
- **F226** Lacet du bassin : ±0,18 rad, soit ±10,3°, sur 2 temps (`src/styles.ts:191`,
  `docs/recherche-biomecanique/confrontation-modele.md:40`).
- **F227** Bascule avant-arrière : ±0,07 rad (`src/styles.ts:192`). Roulis : ±0,05 rad (`src/styles.ts:193`).
- **F228** Hanches : ±0,45 rad (`src/styles.ts:194-195`). Genoux : de 0,12 à 0,40 rad, genou d'appui
  (`src/styles.ts:196-197`).
- **F229** Tronc, cambré : buste jusqu'à 0,14 rad vers l'arrière, lombaires 0,10, thoraciques 0,08, tête 0,08,
  sur 4 temps (`src/styles.ts:199-202`).
- **F230** Tronc, lacet : le buste tourne de ±0,14 rad, décalé par rapport au bassin (`src/styles.ts:198`). Ce
  lacet est annulé par `iso=1`, actif par défaut (`src/styles.ts:299`).
- **F231** Période du cycle : 4 temps pour le niveau et le cambré, 2 temps pour le balancement
  (`src/styles.ts:188-202`). Tempo conseillé : 80 bpm, plage 60–100
  (`src/music/patterns.ts:311-313`).
- **F232** L'application ne propose ici que le sur place et l'aller-retour avant-arrière
  (`src/styles.ts:405-410`).

#### Ce qui le distingue, selon le dépôt

- **F233** « Le plus de variations de niveau des six styles (élévations, descentes, dips). » Déhanché généré par
  l'amplitude des pas et un transfert retardé. Rotation d'ouverture de hanche. Cambré, vagues du corps
  (`docs/styles-de-danse.md:68-72`).
- **F234** Le zouk antillais, lui, a une base latérale, « biomécaniquement plus proche du kompa »
  (`docs/styles-de-danse.md:72-73`).

#### Réserves signalées

- **F235** Tempo : la spec d'origine dit ≈ 110 bpm ; les sources de danse donnent 60–90 et 80–100. « 110
  correspond plutôt à un zouk antillais ralenti. » Verdict « à revoir »
  (`docs/musique/confrontation-moteur.md:101-102`).
- **F236** Rythme : le lent-vite-vite n'est pas représenté. Le moteur fait un transfert régulier par temps. Le
  basic demande un cycle de 8 temps (`docs/musique/confrontation-moteur.md:103-105`). Reste à faire au
  20 novembre (`docs/spec-temps-transferts.md:53-54`).
- **F237** Lacet ±10,3° : « non documenté (haut de fourchette) » par rapport à la marche
  (`docs/recherche-biomecanique/confrontation-modele.md:40`).
- **F238** La spec d'origine donnait un lacet de ±0,20 rad et des genoux de 0,12 à 0,42 rad
  (`docs/styles-de-danse.md:22`, `docs/styles-de-danse.md:24`) ; le code donne 0,18 et 0,12 à 0,40
  (`src/styles.ts:191`, `src/styles.ts:196-197`).
- **F239** L'article de Wikipédia sur le zouk brésilien est signalé comme manquant de sources
  (`docs/musique/zouk-bresilien.md:36-37`).

### 2.7 En couple : le ginga (complément du 22 novembre 2026)

Ajouté après la fusion de `main` (#158). Les numéros de ligne valent pour l'état de la branche à cette date.

- **F315** Demande du propriétaire, le 21 novembre 2026, devant la danse automatique : « J'aimerai aussi que le
  "sway" des hanches et le petit effet de "bounce" , le ginga en fait, soit présent pour montrer que les
  danseurs se balancent au rythme de la musique » (`docs/spec-ginga-couple.md:11-12`).
- **F316** En danse de couple, le mode jeu ajoute dans toutes les figures un balancement latéral du bassin, sur
  les transferts d'appui, et un rebond vertical, le plus bas sur chaque temps. Quatre réglages : sans,
  discret, marqué, ample. Le réglage par défaut était « marqué » ; il est « ample » depuis #163
  (`src/guidage.ts`, `GUIDE_GINGA`, `GUIDE_GINGA_DEFAULT`).
- **F317** Mesure dans le final de la vidéo, réglage « marqué », bassin du premier danseur, même danse comparée
  image par image avant et après : un rebond d'environ 1 cm, une fois par temps ; un écart de côté de 2,4 cm
  au plus. Au réglage « ample », par défaut depuis #163 : 3,4 cm au plus d'un côté, et un rebond de 1,2 cm
  (`docs/spec-video-pas-de-base.md`, « Troisième version » et « Quatrième version »).
- **F318** Le propriétaire a jugé ce réglage, filmé en pied : « Trop discret. » (22 novembre 2026). L'application
  a pris le réglage « ample » par défaut (#163) et le film s'approche des hanches
  (`scripts/video/scenario.mjs`, `FINAL_HANCHES`).
- **F319** Ce balancement va et vient par le même chemin. Pour le propriétaire, le bassin « fait un 8 »
  (`docs/spec-ginga-couple.md:19-21`) ; ce « 8 » n'est pas encore dans le modèle, c'est le chantier #159
  (`docs/spec-ginga-couple.md:39`).

### 2.8 Deux règles du propriétaire pour tous les styles (22 novembre 2026)

- **F334** « Le buste doit etre au dessus et legerement devant les genoux. » (`docs/recherche-danse/README.md`,
  « Le même jour, après la quatrième version »). Mesuré sur le modèle : dans les six styles, le buste est à
  l'aplomb du bassin, 14 à 20 cm derrière les genoux (`docs/recherche-danse/README.md`, « Le buste et les
  genoux, de profil »).
- **F335** « Le plus important c'est de ne pas saccader / teleporter subitement et de ne pas avoir un effet
  relais soudain entre gauche et droite: c'est la transition (le transfert de poids) qui est la source du
  jinga/dehanché/ trajectoire des fessiers "en 8". » (`docs/recherche-danse/README.md`, même section).

## 3. Tableau comparatif

Valeurs du moteur à l'amplitude 1, sur place. Références de ligne dans la dernière colonne, dans
l'ordre des styles.

| Paramètre | Kizomba | Semba | Kompa | Tarraxinha | Suave | Zouk brésilien | Références |
|---|---|---|---|---|---|---|---|
| Tempo conseillé (bpm) | 90 | 120 | 120 | 75 | 72 | 80 | `src/music/patterns.ts:138`, `:177`, `:211`, `:248`, `:281`, `:313` |
| Plage du tempo conseillé | 80–100 | 100–135 | 100–130 | 60–100 | 60–85 | 60–100 | mêmes lignes |
| Plage des sources (bpm) | 80–100 (80–120 ou 60–80 selon les sources) | 100–125 (90–150 selon les sources) | 110–130 | 60–80 ou 80–100 | aucun genre propre | 60–90 (80–100 selon une source faible) | `docs/musique/README.md:106-111` |
| Tempo de la spec d'origine | ≈ 90 | ≈ 130 | 110–130 | lent | lent (~60) | ≈ 110 | `docs/styles-de-danse.md:28` |
| Mesure de la musique | 4/4 | 2/4 | 4/4 | 4/4 | 4/4 | 4/4 | `docs/musique/README.md:106-111` |
| Période du cycle sur place | 2 temps | 2 temps (rebond : ½ temps) | 4 temps | 2 temps | 4 temps (latéral : 2) | 4 temps (latéral : 2) | `src/styles.ts:54`, `:78-80`, `:30-35`, `:139-143`, `:161-169`, `:188-202` |
| Transfert de poids | complet, à chaque temps | complet, à chaque temps | complet, tous les 2 temps, avec tenue | partiel, 75/25 | partiel, 60/40 | complet, à chaque temps | `src/styles.ts:52`, `:76`, `:105`, `:133`, `:158`, `:186` |
| Translation latérale | corps ±7 cm | corps ±5 cm | corps ±8,1 cm, bassin ±1,8 cm | bassin ±3 cm | bassin ±3 cm | corps ±5 cm | `src/styles.ts:55`, `:79`, `:109-111`, `:142`, `:161`, `:189` |
| Niveau (consigne) | −2 cm, ±1 cm par temps | 0 à −5,5 cm, 2 fois par temps | −6 cm, constant | −3 cm, constant | −3,5 cm, constant | 0 à −6 cm, sur 4 temps | `src/styles.ts:56`, `:80`, `:110`, `:135`, `:160`, `:190` |
| Roulis du bassin (rad) | ±0,05 | ±0,09 | ±0,09 | ±0,08 | ±0,03 | ±0,05 | `src/styles.ts:57`, `:81`, `:112`, `:139`, `:164`, `:193` |
| Lacet du bassin (rad) | ±0,03 | aucun | ±0,02 | ±0,22 | aucun | ±0,18 | `src/styles.ts:58`, `:77-91`, `:113`, `:141`, `:159-174`, `:191` |
| Bascule avant-arrière (rad) | ±0,02 | ±0,04 | aucune | ±0,14 | ±0,05 | ±0,07 | `src/styles.ts:59`, `:82`, `:106-121`, `:140`, `:163`, `:192` |
| Posture du buste (rad, + = avant) | +0,10 | +0,06 | +0,08 | +0,14 | +0,02 | −0,10 | `src/styles.ts:45`, `:69`, `:96`, `:126`, `:151`, `:179` |
| Posture des genoux (rad) | 0,30 | 0,24 | 0,20 | 0,34 | 0,14 | 0,12 | mêmes lignes |
| Courbe des genoux (rad) | 0,10–0,24 | 0,15–0,45 | 0,28–0,36 | 0,06–0,18 | 0,04–0,24 | 0,12–0,40 | `src/styles.ts:62-63`, `:85-86`, `:116-117`, `:144-145`, `:170-171`, `:196-197` |
| Haut du corps | aucune courbe | buste redressé, fixe | contre-inclinaison, annulée par `iso=1` | aucune courbe | vague sur 4 temps | cambré sur 4 temps | `src/styles.ts:53-64`, `:89-90`, `:118`, `:134-146`, `:165-169`, `:199-202` |
| Bascule du pied | aucune | jusqu'à 0,25 rad | aucune | aucune | jusqu'à 0,15 rad | aucune | `src/styles.ts:87-88`, `:172-173` |
| Trait dominant selon le dépôt | bassin neutre, sous-produit du transfert | rebond vertical dominant | translation latérale pure, tout sous la ceinture | isolation pelvienne maximale, haut du corps immobile | « 8 couché » et vague séquentielle | variations de niveau, cambré, ouverture de hanche | `docs/styles-de-danse.md:22-27` |

## 4. Ressemblances et différences

### Ce qui est commun au pas de base sur place

- **F240** Les pieds restent plantés au sol dans les six styles (`src/pose.ts:233-235`, `README.md:356-360`).
- **F241** Les genoux sont fléchis en permanence, de 0,12 à 0,34 rad selon le style (`src/styles.ts:45`,
  `src/styles.ts:69`, `src/styles.ts:96`, `src/styles.ts:126`, `src/styles.ts:151`,
  `src/styles.ts:179`). Les sources de la kizomba et du semba font de cette flexion la partie la plus
  importante de la ginga (`docs/ginga-angolana.md:132-134`).
- **F242** Le poids passe d'un pied à l'autre, et le bassin suit. Le balancement latéral a une période de
  2 temps dans cinq styles, 4 temps dans le kompa (`src/styles.ts:52`, `src/styles.ts:76`,
  `src/styles.ts:133`, `src/styles.ts:158`, `src/styles.ts:186`, `src/styles.ts:30-35`).
- **F243** Le plein appui tombe sur le temps dans les six styles, à 0,045 temps près
  (`docs/regles-proprietaire.md:65`).
- **F244** Le haut du tronc compense le roulis du bassin dans les six styles (`src/styles.ts:291-303`). Le dépôt
  l'appuie sur un consensus de sources pour la kizomba et le semba : le mouvement dominant est sous les
  hanches (`docs/ginga-angolana.md:127-131`).
- **F245** La musique est à quatre temps, sauf le semba, écrit en 2/4 (`docs/musique/README.md:106-111`).
- **F246** Le suiveur, en paire, est le miroir exact du guideur pour ces pas (`README.md:361-364`).
- **F247** Aucune étude biomécanique revue par les pairs n'a été trouvée sur aucun des six styles
  (`docs/recherche-biomecanique/README.md:12-15`).

### Les différences les plus lisibles à l'image

- **F248** Le rebond. Seul le semba rebondit franchement : jusqu'à 5,5 cm, deux fois par temps
  (`src/styles.ts:80`). La kizomba varie de ±1 cm (`src/styles.ts:56`). Kompa, tarraxinha et suave
  gardent un niveau constant (`src/styles.ts:110`, `src/styles.ts:135`, `src/styles.ts:160`). Le zouk
  change de niveau lentement, sur 4 temps (`src/styles.ts:190`).
- **F249** Le lacet du bassin. Il est grand dans la tarraxinha (±0,22 rad) et le zouk (±0,18 rad), très petit
  dans la kizomba (±0,03) et le kompa (±0,02), absent dans le semba et le suave (`src/styles.ts:141`,
  `src/styles.ts:191`, `src/styles.ts:58`, `src/styles.ts:113`).
- **F250** La translation latérale. Le kompa se déplace le plus (±8,1 cm), puis la kizomba (±7 cm), le semba et
  le zouk (±5 cm). Tarraxinha et suave ne déplacent que le bassin (±3 cm) (`src/styles.ts:109`,
  `src/styles.ts:55`, `src/styles.ts:79`, `src/styles.ts:189`, `src/styles.ts:142`,
  `src/styles.ts:161`).
- **F251** Le rythme des appuis. Le kompa tient le poids deux temps sur chaque pied ; les autres changent à
  chaque temps (`src/styles.ts:103-105`, `docs/spec-temps-transferts.md:59-61`). Tarraxinha et suave ne
  transfèrent qu'une partie du poids (`src/styles.ts:133`, `src/styles.ts:158`).
- **F252** La posture. La tarraxinha est la plus penchée et la plus fléchie (0,14 et 0,34 rad). Le zouk est
  cambré (−0,10) et le moins fléchi (0,12) (`src/styles.ts:126`, `src/styles.ts:179`,
  `docs/posture-contraposition.md:56-58`).
- **F253** Le haut du corps. Le suave fait une vague sur 4 temps (`src/styles.ts:165-169`). Le zouk se cambre
  sur 4 temps (`src/styles.ts:199-202`). Les quatre autres n'ont pas de courbe de tronc visible par
  défaut (`src/styles.ts:53-64`, `src/styles.ts:89-90`, `src/styles.ts:118`,
  `src/styles.ts:134-146`).
- **F254** Le tempo conseillé. De 72 bpm (suave) à 120 bpm (semba, kompa) (`src/music/patterns.ts:281`,
  `src/music/patterns.ts:177`, `src/music/patterns.ts:211`).

### Complément du 23 novembre 2026 : après les pas élus du kompa et du semba

Mesures des six pas de base, danseur seul sur place : `node scripts/video/mesurer_pas.mjs` ; surfaces des
hanches : `MESURES=1 node scripts/tracer_hanches.mjs /dev/null aujourdhui seul base <style>`. Ces faits
remplacent F248 à F251 et F253 pour le kompa et le semba.

- **F350** Le rythme des appuis. La kizomba et le zouk changent de pied à chaque temps. Le kompa et le semba,
  tous les deux temps : le kompa reste sur son pied (F345), le semba y arrive deux fois (F339). Tarraxinha et
  suave ne transfèrent qu'une partie du poids : 75 % et 60 % au plus sur un pied.
- **F351** La hauteur du bassin. Zouk 8,2 cm, lentement, sur quatre temps ; kizomba 2,7 cm ; semba 2,4 cm ;
  suave 1,7 cm ; kompa 1,6 cm ; tarraxinha 1,3 cm. Le semba ne monte plus plus haut que les autres : son rebond
  se lit dans la hanche qui s'assoit (5,7 cm ; kompa 5,8 cm ; kizomba 3,2 cm).
- **F352** Le pivot du bassin autour de la verticale, de chaque côté : tarraxinha 12,5°, kompa 11,5°,
  zouk 10,3°, semba 8°, kizomba 1,7°, suave 0,1°.
- **F353** D'un côté à l'autre, le bassin fait : kizomba 14 cm, kompa 12,2 cm, zouk 10 cm, semba 9 cm,
  tarraxinha et suave 6 cm, soit 3 cm de chaque côté.
- **F354** Vu de dessus, le trajet du bassin entoure une surface dans quatre styles : suave 17,6 cm², kompa
  16,6 cm², semba 15,4 cm², tarraxinha 11,3 cm². Dans la kizomba et le zouk, il va et vient par le même chemin
  (0 cm²). Hanche par hanche, le kompa entoure le plus : 22 cm², contre 17,5 pour le suave, 17 pour le semba,
  6 pour la tarraxinha.
- **F358** Le rythme des appuis, au 24 novembre 2026 (remplace F350 pour le kompa) : la kizomba, le zouk et le
  kompa changent de pied à chaque temps (F356). Le semba arrive deux fois de suite sur chaque pied (F339).
  Tarraxinha et suave ne transfèrent qu'une partie du poids. Le kompa fait maintenant 11,7 cm d'un côté à
  l'autre (F357) : l'ordre de F353 ne change pas.
- **F355** Le tronc. Kompa et semba le penchent vers l'avant, de 16° et 15°, sans variation. La kizomba de 6°,
  la tarraxinha de 8°. Le suave ondule : son inclinaison varie de 19° sur quatre temps. Le zouk est cambré, de
  10° vers l'arrière, et varie de 8°.

## 5. Chronologie pour une frise

- **F255** 1947 : fondation du groupe N'gola Ritmos, qui porte la massemba sur les guitares
  (`docs/musique/semba.md:13-15`).
- **F256** Années 1950 : le semba devient très populaire à Luanda (`docs/musique/semba.md:7`).
- **F257** 26 juillet 1955 : premier concert du Conjunto International de Nemours Jean-Baptiste, date
  anniversaire du konpa selon WXPN. D'autres sources donnent 1957 (`docs/musique/kompa.md:7-11`).
- **F258** 1965 : « João Domingu » de N'gola Ritmos, exemple analysé du semba ancien
  (`docs/musique/semba.md:50-51`).
- **F259** Milieu des années 1960 : les mini-jazz haïtiens (`docs/musique/kompa.md:17-18`).
- **F260** Années 1970 : rumba congolaise et semba donnent la rumba angolaise ; âge d'or du semba
  (`docs/musique/semba.md:19-20`, `docs/musique/semba.md:92`).
- **F261** 1975 : indépendance de l'Angola ; le semba a été une musique de revendication avant cette date
  (`docs/musique/semba.md:17-18`).
- **F262** Après 1977 : hégémonie des musiques antillaises en Angola, selon Waldemar Bastos cité par Baratti
  (`docs/musique/kizomba.md:17-18`).
- **F263** 1979 : fondation de Kassav' à Paris (`docs/musique/zouk-bresilien.md:14-15`). Vers 1979 : début de la
  kizomba selon Eduardo Paim, rapporté par Discovering Kizomba (`docs/musique/kizomba.md:11-12`).
- **F264** 1980 : naissance de la kizomba selon Wikipédia FR (`docs/musique/kizomba.md:8-9`). Début des années
  1980 : Kassav' lance le zouk antillais (`docs/musique/zouk-bresilien.md:13-14`).
- **F265** 1984 : date de l'encadré de Wikipédia EN pour la kizomba (`docs/musique/kizomba.md:7-8`). Même année :
  « Zouk la sé sèl médikaman nou ni » de Kassav' (`docs/musique/zouk-bresilien.md:22-23`).
- **F266** Années 1980 : dans le konpa, la boîte à rythmes remplace les percussionnistes
  (`docs/musique/kompa.md:19-20`).
- **F267** Années 1990 : zouk love (`docs/musique/zouk-bresilien.md:26`). Début des années 1990 : le zouk
  brésilien naît de la lambada (`docs/musique/zouk-bresilien.md:31`). Après 1994 : la musique lambada
  s'efface (`docs/musique/zouk-bresilien.md:32-33`).
- **F268** Vers 2000 : le nom « ghetto zouk » est donné par Quatro Plus (`docs/musique/suave.md:16-17`). Début
  des années 2000 ou avant : débuts de la tarraxinha, DJ Madabaya et DJ Znobia
  (`docs/musique/tarraxinha.md:10-12`).
- **F269** Vers 2006 : apogée de la production de tarraxinha ; 2007 : quasi-fin, selon The Fader
  (`docs/musique/tarraxinha.md:13-15`).
- **F270** Début des années 2010 : le tarraxo apparaît à Lisbonne (`docs/musique/tarraxinha.md:16-17`). Années
  2010 : zouk brésilien et kiz européen partagent le répertoire du ghetto zouk
  (`docs/musique/zouk-bresilien.md:39-40`).
- **F271** 10 décembre 2025 : inscription du konpa par l'UNESCO, non vérifiée par le dépôt
  (`docs/musique/kompa.md:24-25`).
- **F272** Novembre 2026 : recherches du dépôt (ginga le 18, musique et biomécanique le 19) et piste kizomba
  validée à l'écoute le 21 (`docs/ginga-angolana.md:1`, `docs/musique/README.md:5`,
  `docs/recherche-biomecanique/README.md:5`, `docs/musique/enregistrements.md:27-28`).

Résumé des influences, tel que le dépôt les rapporte :

- **F273** Massemba, kazukuta et kabetula vers le semba (`docs/musique/semba.md:9-12`).
- **F274** Semba vers la kizomba et le kuduro (`docs/musique/semba.md:19`).
- **F275** Méringue vers le konpa (`docs/musique/kompa.md:12-14`).
- **F276** Kadans, konpa et biguine vers le zouk antillais (`docs/musique/zouk-bresilien.md:16-18`).
- **F277** Konpa et kadans, ou zouk et semba, vers la kizomba, selon les sources (`docs/musique/kizomba.md:8-16`).
- **F278** Kuduro ralenti ou kizomba ralentie vers la tarraxinha, selon les sources
  (`docs/musique/tarraxinha.md:9-15`).
- **F279** Tarraxinha et kizomba vers l'urban kiz (`docs/musique/tarraxinha.md:19`).
- **F280** Lambada, puis musiques zouk, vers le zouk brésilien (`docs/musique/zouk-bresilien.md:31-34`).
- **F281** Coladeira et zouk vers le ghetto zouk (`docs/musique/suave.md:16-18`).

## 6. Limites à dire dans la vidéo

### Le modèle

- **F282** « Animation paramétrique illustrative, sans mocap ni calibration chorégraphique validée. »
  (`README.md:5`).
- **F283** « ce n'est pas de la capture de mouvement ; les transitions et le poids du corps sont stylisés. »
  (`docs/adr/001-rig-parametrique-biodynamique.md:38-39`).
- **F284** « Les valeurs du dépôt restent un calibrage du modèle, pas une norme de danse. »
  (`docs/recherche-biomecanique/README.md:7`).
- **F285** « Animation paramétrique illustrative, sans validation chorégraphique. » Mention affichée dans la
  vitrine (`src/components/GuidageApp.tsx:272-273`).
- **F286** Les courbes viennent d'une « spec biomécanique chiffrée du projet (`SPEC.md` du handoff, résumée
  ici) » (`docs/styles-de-danse.md:3-4`). Ce fichier `SPEC.md` n'est pas dans le dépôt (recherche de
  fichier, 21 novembre 2026).
- **F287** Le squelette s'arrête au bassin : « aucun os au-dessus du bassin dans le GLB »
  (`CONTEXT.md:263-264`). Le buste est stylisé (`docs/adr/001-rig-parametrique-biodynamique.md:27-28`).
- **F288** Le pied est un pied osseux, plus court qu'un pied vivant (environ 13 % de la stature contre 15 %) et
  plus ouvert que l'angle de pas habituel (`docs/recherche-biomecanique/README.md:26-28`).
- **F289** Sur place, les pieds ne se lèvent pas. La marqua ou la touche décrites par les sources ne sont pas
  des pas à l'image (`src/pose.ts:233-235`).
- **F290** La spec de la vidéo fixe les limites à dire : « modèle paramétrique, pas de capture de mouvement, pas
  de validation chorégraphique, musique et voix générées » (`docs/spec-video-pas-de-base.md:39-40`).

### Les tests

- **F291** « Ces tests ne constituent pas une validation chorégraphique. » (`AGENTS.md:93`).
- **F292** « Ces vérifications ne valident pas la technique de danse. » (`CONTEXT.md:241`).
- **F293** Les appuis sont « illustratifs », la proximité est « sans simulation de contact »
  (`AGENTS.md:92-93`).
- **F294** « Les styles et la proximité des cuisses restent des illustrations paramétriques, pas une simulation
  de forces. » (`README.md:75-76`).

### La biomécanique

- **F295** « Aucune étude biomécanique revue par les pairs n'a été trouvée sur la kizomba, le semba, le kompa,
  la tarraxinha, le suave ou le zouk. » Les comparaisons passent par la marche, la danse orientale, le
  tango ou la danse de salon (`docs/recherche-biomecanique/README.md:12-15`).
- **F296** « L'isolation complète du haut du tronc (`iso=1`) est une idéalisation. » Même des expertes de danse
  orientale ne découplent pas le bassin de la ceinture scapulaire
  (`docs/recherche-biomecanique/README.md:20-22`).
- **F297** « Le modèle montre donc l'intention pédagogique, pas un mouvement mesuré. »
  (`docs/recherche-biomecanique/confrontation-modele.md:50`).
- **F298** À vitesse lente, la marche ne produit pas de contre-rotation entre bassin et thorax. Une dissociation
  franche dans une danse lente est « un geste appris ». Aucune étude ne l'a mesurée en kizomba
  (`docs/recherche-biomecanique/confrontation-modele.md:51-53`).
- **F299** Presque toutes les valeurs de comparaison viennent de la marche à environ 1 m/s, de la danse
  orientale ou de la danse de salon (`docs/recherche-biomecanique/confrontation-modele.md:54-56`).
- **F300** Repères de marche : obliquité du bassin 6 à 9° crête à crête, tilt 2 à 4°, rotation 4 à 17° selon le
  laboratoire, la vitesse et le support (`docs/recherche-biomecanique/bassin-et-dissociation.md:22-23`).

### La musique

- **F301** Les grilles rythmiques sont des « simplifications pédagogiques ». « Aucune source consultée ne donne
  une transcription complète, instrument par instrument, sur une grille de 16 pas. »
  (`docs/musique/README.md:47-51`).
- **F302** Chaque affirmation musicale porte un niveau : documenté, faible ou proposition
  (`docs/musique/README.md:38-42`).
- **F303** Le son de synthèse est fait « sans enregistrement ni œuvre protégée » (`README.md:46-48`).
- **F304** Les boucles enregistrées sont « générées par IA avec Eleven Music (ElevenLabs) ». « Ce ne sont ni des
  œuvres existantes ni des enregistrements de musiciens. » (`docs/musique/enregistrements.md:5-7`).
- **F305** Une seule piste est publiée, celle de la kizomba. Les autres styles jouent la synthèse
  (`README.md:38-41`, `docs/spec-musique-elevenlabs.md:38`).
- **F306** La première prise de la kizomba a été refusée à l'écoute par le propriétaire : « ça ressemble plus à
  de la techno qu'à de la kizomba semba angolaise » (`docs/musique/enregistrements.md:32-35`).
- **F307** Le temps 1 de la boucle est « une déduction, pas une écoute » ; la validation finale se fait à
  l'oreille (`docs/spec-musique-elevenlabs.md:186-188`).
- **F308** Réserve sur la piste validée : le grave est présent sur chaque temps ; la mesure ne dit pas s'il
  s'agit d'une grosse caisse ou d'une basse (`docs/spec-musique-elevenlabs.md:289-291`).
- **F309** Le tempo de l'application est global. En comparaison, une seule horloge anime les deux styles : avec
  la musique d'un style, l'autre danse à un tempo qui n'est pas le sien
  (`docs/musique/README.md:115-119`).

### Écarts internes à connaître avant d'écrire la narration

- **F310** Le tableau de `docs/styles-de-danse.md` est la spec d'origine. Plusieurs de ses valeurs ne sont plus
  celles du code : tarraxinha, zouk, kizomba, tempos (`docs/styles-de-danse.md:22-28`, sections 2.1,
  2.4 et 2.6 de cette fiche).
- **F311** La confrontation musique et moteur date du 19 novembre 2026 et décrit un moteur modifié depuis
  (`docs/musique/confrontation-moteur.md:5-7`, `docs/spec-temps-transferts.md:24-33`). Semba et zouk
  gardent leurs écarts de rythme (`docs/spec-temps-transferts.md:53-54`).
- **F312** La spec du son dit encore que les phases du moteur sont inchangées et que les décalages restent
  ouverts (`docs/spec-son-synthese.md:85-87`).
- **F313** `CONTEXT.md` dit à la fois « Aucune piste publiée » et que la prise suivante est publiée et validée
  (`CONTEXT.md:21`, `CONTEXT.md:27-29`).
- **F314** Les six images animées par style (`docs/gifs/kizomba.gif`, `semba.gif`, `kompa.gif`,
  `tarraxinha.gif`, `suave.gif`, `zouk.gif`) datent du 18 novembre 2026. Le kompa et la tarraxinha ont
  changé le 20 novembre (historique git : images au commit `71c2016`, moteur aux commits `4d95c92` et
  `374fb26`). Elles ne montrent pas le moteur actuel pour ces deux styles.

## 7. Crédits

### 7.1 Attributions obligatoires, telles qu'écrites dans le dépôt

- Maillages : « Les maillages de `public/anatomy.glb` et de `public/anatomy_muscles.glb` (couche
  musculaire optionnelle) proviennent de BodyParts3D v4.0, © The Database Center for Life Science
  (DBCLS), licence CC BY-SA 2.1 Japan — cette attribution reste visible dans l'application (pied de
  page) et dans ce README. » https://dbarchive.biosciencedbc.jp/en/bodyparts3d/license.html
  (`README.md:282-286`).
- Forme courte utilisée sous les images du README : « BodyParts3D © DBCLS, CC BY-SA 2.1 Japan. »
  (`README.md:84`).
- La licence impose une attribution visible et le partage à l'identique
  (`docs/adr/001-rig-parametrique-biodynamique.md:40-42`). L'attribution doit rester dans le README et
  dans l'application (`AGENTS.md:104-105`).
- Musique enregistrée : mention « Musique générée par IA (Eleven Music, ElevenLabs) »
  (`src/music/recordings.ts:37-38`). La vitrine garde visibles BodyParts3D et « musique générée par
  IA » (`docs/spec-vitrine-danse-auto.md:57-58`).
- Conditions d'usage relevées pour Eleven Music, offre Starter, « à confirmer par le propriétaire » :
  usage commercial permis, sauf film, télévision, radio et jeux de studio ; pas d'attribution exigée ;
  diffusion sur les plateformes de streaming musical interdite
  (`docs/spec-musique-elevenlabs.md:317-324`).
- Voix de la vidéo : mention « Voice: Phonon by Gradium — gradium.ai ». « Phonon 40m français est sous
  CC BY-NC 4.0 : la vidéo est réservée à un usage non commercial tant que cette voix y figure. »
  (`docs/spec-video-pas-de-base.md:45-46`).
- Police : sous-ensemble latin de DejaVu Sans, licence Bitstream Vera, permissive,
  https://dejavu-fonts.github.io/ (`README.md:288-289`).

### 7.2 Sources externes : pas, posture et ginga

- Wikipédia FR. « Kizomba ». https://fr.wikipedia.org/wiki/Kizomba (`docs/styles-de-danse.md:84`,
  `docs/ginga-angolana.md:105`, `docs/musique/kizomba.md:169`).
- Wikipédia EN. « Kizomba ». https://en.wikipedia.org/wiki/Kizomba (`docs/ginga-angolana.md:107`,
  `docs/musique/kizomba.md:167`).
- cours-kizomba.com. Guide du débutant.
  https://cours-kizomba.com/blog/kizomba-pour-debutant-novice-le-guide-complet
  (`docs/styles-de-danse.md:86`).
- O'Dance Events. Kizomba, semba, urban kiz. https://odanceevents.com/blog/kizomba-semba-urban-kiz
  (`docs/styles-de-danse.md:98`).
- O'Dance Events. « Débuter la kizomba ». https://odanceevents.com/blog/debuter-la-kizomba
  (`docs/styles-de-danse.md:136`).
- Angola Travel Guide (2026). « Angola Music and Dance ».
  https://angolatravelguide.com/angola-music-dance/ (`docs/styles-de-danse.md:100`,
  `docs/musique/kizomba.md:180-181`).
- Haitian Music Zone. Page d'accueil. https://haitianmusiczone.com (`docs/styles-de-danse.md:111`).
- Haitian Music Zone (1er décembre 2025). « How To Dance Kompa: Beginner Steps, Partner Moves, Timing ».
  https://haitianmusiczone.com/how-to-dance-kompa-beginner-steps-partner-moves-timing/
  (`docs/musique/kompa.md:192-194`).
- Jasmin, Cliford et Gaëlle (2022). Tout sur la danse compas / konpa, danse sociale d'Haïti, cité par
  C. B. Sérant, Le Nouvelliste (15 juin 2022), repris par Karibinfo.
  https://www.karibinfo.com/news/haiti-tout-sur-la-danse-compas/ (`docs/recherche-danse/kompa.md`, K1).
- Dady et Manuela (2020, 2021). « Les bases de la danse konpa » #1 et #2.
  https://www.youtube.com/watch?v=yVUW1tZ7ERo (`docs/recherche-danse/kompa.md`, K2, K3).
- Danse Select Canada (2021). « Cours de danse konpa » 1 et 2.
  https://www.youtube.com/watch?v=BPtk2pec1E0 (`docs/recherche-danse/kompa.md`, K4, K5).
- Jaconelli, E. (2026) et Harmange, A. (2024). Reportages sur le konpa, Outre-mer la 1ère.
  https://la1ere.franceinfo.fr/ (`docs/recherche-danse/kompa.md`, K6, K7).
- Bordeaux Dance Crew. Page « Konpa ». https://bordeauxdancecrew.com/disciplines/konpa/
  (`docs/recherche-danse/kompa.md`, K8).
- Pierre, H. (2025). Articles sur le compas direct, Le Nouvelliste.
  https://lenouvelliste.com/article/258274/une-histoire-du-compas-direct-haitien-en-30-moments
  (`docs/recherche-danse/kompa.md`, K9).
- Laventure, S. (2020). « How to Gouye », KOTR Dance Studio, Miami, lu sur archive.org
  (`docs/recherche-danse/kompa.md`, K18).
- Wikipédia EN. « Compas » et « Dance in Haiti ». https://en.wikipedia.org/wiki/Compas
  (`docs/recherche-danse/kompa.md`, K19, K20).
- Matiko, S. (2023). « Haiti's Kompa joins Nairobi dance scene », Business Daily Africa
  (`docs/recherche-danse/kompa.md`, K21).
- UNESCO (2025). « Le compas d'Haïti », élément n° 02273, décision 20.COM 7.B.22.
  https://ich.unesco.org/fr/RL/le-compas-d-haiti-02273 (`docs/recherche-danse/kompa.md`, K10).
- Averill, G. « Konpa ! La musique populaire en Haïti », Médiathèque Caraïbe (Laméca)
  (`docs/recherche-danse/kompa.md`, K11).
- Averill, G. (1997). A Day for the Hunter, a Day for the Prey: Popular Music and Power in Haiti,
  University of Chicago Press, lu par extraits (`docs/recherche-danse/kompa.md`, K12).
- McAlister, E. (2002). Rara! Vodou, Power, and Performance in Haiti and Its Diaspora, University of
  California Press, lu par extraits (`docs/recherche-danse/kompa.md`, K13).
- Freeman, B. C. et Laguerre, J. (2004). Haitian-English Dictionary, 5e éd., University of Kansas
  (`docs/recherche-danse/kompa.md`, K14).
- Vilsaint, F. (2005). Diksyonè kreyòl Vilsen ; Valdman, A. (dir.) (2007). Haitian Creole-English Bilingual
  Dictionary, lus par extraits (`docs/recherche-danse/kompa.md`, K15).
- Wikipedya ayisyen. « Gouyad ». https://ht.wikipedia.org/wiki/Gouyad (`docs/recherche-danse/kompa.md`, K16).
- Sloat, S. (dir.) (2002). Caribbean Dance from Abakuá to Zouk, University Press of Florida, lu par extraits
  (`docs/recherche-danse/kompa.md`, K17).
- Udansa. Page d'accueil. https://udansa.com (`docs/styles-de-danse.md:115`).
- Udansa. « Samba Bounce ».
  https://udansa.com/fr/guide-de-danse/apprendre-samba/samba-competition/apprendre-samba-bounce
  (`docs/styles-de-danse.md:143`).
- Udansa. Mouvement de hanche en kizomba.
  https://udansa.com/en/dance-guide/kizomba-guide/kizomba-styling-advanced/learn-kizomba-hip-movement
  (`docs/ginga-angolana.md:88`).
- Emove thérapie. https://emoveretherapie.com (`docs/styles-de-danse.md:120`).
- Get Bailar. https://getbailar.com (`docs/styles-de-danse.md:125`).
- DanceIn NJ. https://danceinnj.com (`docs/styles-de-danse.md:125`).
- Inaya Zouk. https://inaya-zouk.com (`docs/styles-de-danse.md:126`).
- Viens-danser. Apprendre la samba. https://www.viens-danser.fr/apprendre-samba/
  (`docs/styles-de-danse.md:139`).
- soireedanse.com. https://soireedanse.com (`docs/styles-de-danse.md:157-158`).
- Wikipédia EN. « Ginga (capoeira) ». https://en.wikipedia.org/wiki/Ginga_(capoeira)
  (`docs/ginga-angolana.md:14`).
- CapoeiraWiki. « Ginga ». https://capoeirawiki.org/wiki/Ginga (`docs/ginga-angolana.md:18`).
- Wikipédia FR. « Ginga ». https://fr.wikipedia.org/wiki/Ginga (`docs/ginga-angolana.md:21`).
- BBC News. Article sur la capoeira Angola. https://www.bbc.co.uk/news/world-africa-57429972
  (`docs/ginga-angolana.md:25`).
- Jogo Corpo Fechado (nossa-tribo.com). La ginga de la capoeira Angola.
  https://nossa-tribo.com/understanding-the-ginga-heartbeat-of-capoeira-angola/
  (`docs/ginga-angolana.md:26-29`).
- Saida Dance, András Gulácsi. « Ginga in Kizomba and Semba ».
  https://saidadance.com/ginga-in-kizomba-and-semba/ (`docs/ginga-angolana.md:33-36`).
- SOS Dance. « Kizomba Footwork Manual » (PDF).
  https://sosadance.co.uk/wp-content/uploads/2017/07/Kizomba-Footwork-Manual-2.pdf
  (`docs/ginga-angolana.md:75-82`).
- SalsaNueva. Apprendre à danser la kizomba.
  https://shop.salsanueva.fr/en/blogs/info/how-to-learn-to-dance-the-kizomba
  (`docs/ginga-angolana.md:89-95`).
- Romy Dance. https://www.romydance.it/en/kizomba-the-more-sensual-dance/
  (`docs/ginga-angolana.md:96-97`).
- Reddit r/kizomba. https://www.reddit.com/r/kizomba/comments/2vwo4u/ (`docs/ginga-angolana.md:98-101`).
- Kizombadas. FAQ. https://kizombadas.fr/faq/ (`docs/ginga-angolana.md:108-109`).
- danca.co.nz. Pourquoi apprendre à bouger les hanches.
  https://www.danca.co.nz/single-post/why-learning-to-move-your-hips-matters
  (`docs/ginga-angolana.md:110-113`).
- Novo Jornal (presse angolaise).
  https://novojornal.co.ao/cultura/detalhe/kizomba-as-passadas-de-um-movimento-que-risca-a-cultura-de-angola-pelo-mundo--33491.html
  (`docs/ginga-angolana.md:114-115`).
- joinangola.com. « Semba ». https://joinangola.com/semba/ (`docs/ginga-angolana.md:116-117`).
- Mulemba, OpenEdition. https://journals.openedition.org/mulemba/951 (`docs/ginga-angolana.md:118-120`).
- SME Goiânia. Plans et niveaux en danse.
  https://sme.goiania.go.gov.br/conexaoescola/eaja/planos-ou-niveis-em-danca/
  (`docs/ginga-angolana.md:121-123`).
- dancewithmeusa.com. Sans URL dans le dépôt (`docs/posture-contraposition.md:25-26`).
- Pollock T (2018). « Desiring connection: affect in the embodied experience of kizomba dance ».
  Capacious 1(2). https://capaciousjournal.com/article/desiring-connection ;
  https://doi.org/10.22387/CAP2018.12 (`docs/posture-contraposition.md:30-31`,
  `docs/recherche-biomecanique/confrontation-modele.md:115`).
- Tango Topics. « Definition: Opposition ». https://tangotopics.com/definition/definition-opposition/
  (`docs/posture-contraposition.md:38`).
- Revue Acropolis. « Éloge du tango ». https://revue-acropolis.com/eloge-du-tango/
  (`docs/posture-contraposition.md:41`).
- Wikipédia FR. Technique du tango rioplatense. Sans URL dans le dépôt
  (`docs/posture-contraposition.md:44`).

### 7.3 Sources externes : musique

- Fanfant, Jean-Philippe (2007). Afro-Caribbean Grooves for Drumset. Sher Music Co. Extrait :
  https://hudsonmusic.com/wp-content/uploads/Afro-Caribbean-Grooves-SAMPLE.pdf. Sommaire seul consulté
  (`docs/musique/README.md:138-141`).
- Wikipédia EN. « Tresillo (rhythm) ». https://en.wikipedia.org/wiki/Tresillo_(rhythm)
  (`docs/musique/README.md:142-143`).
- Discovering Kizomba (2024, d'après un post de 2021). « What is Ghetto Zouk? What is the connection to
  Kizomba and Zouk? ». https://discoveringkizomba.com/?p=92 (`docs/musique/kizomba.md:170-171`).
- Discovering Kizomba (18 mars 2024). « What are Tarraxinha, Tarraxa, Tarraxo? Are they different from
  Kizomba? ». https://discoveringkizomba.com/tarraxinha-tarraxa-difference-to-kizomba/
  (`docs/musique/tarraxinha.md:151-153`).
- Discovering Kizomba (23 février 2021). « Zouk: born in the Caribbean, adopted by Brazilians ».
  https://discoveringkizomba.com/zouk-caribbean-brazilian/ (`docs/musique/zouk-bresilien.md:224-225`).
- Baratti, Nina (2020). « Between Genre and Generations: Analyzing Angolan Popular Music ». Etnografie
  Sonore / Sound Ethnographies, III/2.
  https://www.soundethnographies.it/wp-content/uploads/2022/02/03-BARATTI.pdf
  (`docs/musique/kizomba.md:172-174`).
- Kizomba Seattle (2014, mis à jour 2016). « How to Recognize Tarraxinha, Kizomba and Semba Music ».
  https://kizombaseattle.blogspot.com/2014/10/how-to-recognize-tarraxinha-kizomba-and.html
  (`docs/musique/kizomba.md:175-176`).
- Melodigging. Fiche « Kizomba ». https://www.melodigging.com/genre/kizomba
  (`docs/musique/kizomba.md:177`).
- BeatKey. « How to Make Kizomba Music ». https://beatkey.pages.dev/how-to-make-kizomba-music
  (`docs/musique/kizomba.md:178-179`).
- BeatKey. « How to Make Zouk Music ». https://beatkey.pages.dev/how-to-make-zouk-music
  (`docs/musique/zouk-bresilien.md:228-229`).
- Paris Match Belgique, la rédaction (6 octobre 2017). « Kizomba : aux racines de la danse sensuelle de
  la joie angolaise ».
  https://www.parismatch.be/culture/scene/2017/10/06/kizomba-aux-racines-de-la-danse-sensuelle-de-la-joie-angolaise-FCHLOXIXIJASBBAL2OTT62BRQA/
  (`docs/musique/kizomba.md:182-184`).
- SongBPM. Page « Eduardo Paim ». https://songbpm.com/@eduardo-paim (`docs/musique/kizomba.md:185-186`).
- SongBPM. Bonga, « Mona Ki Ngi Xica ». https://songbpm.com/@bonga/mona-ki-ngi-xica
  (`docs/musique/semba.md:200-201`).
- SongBPM. « Nemours Jean-Baptiste ». https://songbpm.com/@nemours-jean-baptiste
  (`docs/musique/kompa.md:201-203`).
- SongBPM. Tabou Combo, « New York City ». https://songbpm.com/@tabou-combo/new-york-city
  (`docs/musique/kompa.md:201-203`).
- SongBPM. Kassav', « Zouk la sé sèl médikaman nou ni ».
  https://songbpm.com/@kassav/zouk-la-se-sel-medikaman-nou-ni (`docs/musique/zouk-bresilien.md:230-232`).
- SongBPM. Kassav', « Syé bwa ». https://songbpm.com/@kassav/sye-bwa
  (`docs/musique/zouk-bresilien.md:230-232`).
- Kuschick, Mateus Berger ; Zattera, Vilson (2013). « O semba nos musseques de Angola: estudos
  preliminares ». Anais do XXIII Congresso da ANPPOM.
  https://anppom.org.br/anais/anaiscongresso_anppom_2013/2406/public/2406-6908-1-PB.pdf
  (`docs/musique/semba.md:184-186`).
- Wikipédia PT. « Semba ». https://pt.wikipedia.org/wiki/Semba (`docs/musique/semba.md:187`).
- Wikipédia EN. « Ngola Ritmos ». https://en.wikipedia.org/wiki/Ngola_Ritmos
  (`docs/musique/semba.md:188-189`).
- Kizombalove Academy. « Semba history: music ». https://kizombalove.com/en/semba-history/music/
  (`docs/musique/semba.md:190-191`).
- African Music Library. « Semba ». https://africanmusiclibrary.org/genre/Semba
  (`docs/musique/semba.md:192-193`).
- WXPN, Nathalie « Talie » Cerin (26 juillet 2021). « The birth of Konpa! ».
  https://xpn.org/birth-of-konpa/ (`docs/musique/kompa.md:182-183`).
- Wikipédia EN. « Compas ». https://en.wikipedia.org/wiki/Compas (`docs/musique/kompa.md:184-185`).
- Wikipédia FR. « Compas direct ». https://fr.wikipedia.org/wiki/Compas_direct
  (`docs/musique/kompa.md:186-187`).
- Wikipédia EN. « Méringue ». https://en.wikipedia.org/wiki/M%C3%A9ringue
  (`docs/musique/kompa.md:188-191`).
- Haitian Music Zone (1er décembre 2025). « What Is Kompa Music? ».
  https://haitianmusiczone.com/what-is-kompa-music-music-is-the-heartbeat-of-haiti/
  (`docs/musique/kompa.md:195-197`).
- Haitian Art Studio. « Konpa: Haiti's Rhythm That Conquered the Caribbean ».
  https://haitianartstudio.com/journal/konpa-haiti-rhythm-caribbean. Vu en extrait de recherche
  seulement (`docs/musique/kompa.md:198-200`).
- Wikipédia EN. « Tarraxinha ». https://en.wikipedia.org/wiki/Tarraxinha
  (`docs/musique/tarraxinha.md:149-150`).
- Lebrave, Benjamin (28 mars 2013). « Lungu Lungu: DJ Marfox, Tarraxinha, and Rubbing Pelvises ». The
  Fader. https://www.thefader.com/2013/3/28/lungu-lungu-dj-marfox-tarraxinha-and-rubbing-pelvises
  (`docs/musique/tarraxinha.md:154-156`).
- Wikipédia EN. « Zouk ». https://en.wikipedia.org/wiki/Zouk (`docs/musique/zouk-bresilien.md:204-208`).
- Mendez, Hugo (2 décembre 2015). « Zouk: An Introduction ». Red Bull Music Academy Daily.
  https://daily.redbullmusicacademy.com/2015/12/zouk-feature (`docs/musique/zouk-bresilien.md:209-210`).
- Wikipédia EN. « Music of Martinique ». https://en.wikipedia.org/wiki/Music_of_Martinique
  (`docs/musique/zouk-bresilien.md:211-212`).
- Britannica. « Zouk ». https://www.britannica.com/art/zouk. Lu par extraits seulement
  (`docs/musique/zouk-bresilien.md:215-217`).
- Britannica. « Mizik zouk ». https://www.britannica.com/art/mizik-zouk. Lu par extraits seulement
  (`docs/musique/zouk-bresilien.md:215-217`).
- Drumeo (19 novembre 2019). « 5 Drumming Styles You've (Probably) Never Heard ».
  https://www.drumeo.com/beat/?p=19923 (`docs/musique/zouk-bresilien.md:218-219`).
- Wikipédia EN. « Brazilian Zouk ». https://en.wikipedia.org/wiki/Brazilian_Zouk
  (`docs/musique/zouk-bresilien.md:220-221`).
- Wikipédia EN. « Lambada (dance) ». https://en.wikipedia.org/wiki/Lambada_(dance)
  (`docs/musique/zouk-bresilien.md:222-223`).
- Bath Zouk. « Music & Rhythm ».
  https://bathzouk-astro.pages.dev/library/fundamentals/concepts/rhythm
  (`docs/musique/zouk-bresilien.md:226-227`).

### 7.4 Sources externes : biomécanique

Références de la page de confrontation (`docs/recherche-biomecanique/confrontation-modele.md:98-117`) :

- McIlroy WE, Maki BE (1997). Preferred placement of the feet during quiet stance. Clin Biomech
  12(1):66-70. https://doi.org/10.1016/S0268-0033(96)00040-X
  (`docs/recherche-biomecanique/confrontation-modele.md:98`).
- Singh JP et al. (2013). Stature estimation from the dimensions of foot in males. İnsanbilim Dergisi
  2(1):15-20. https://dergipark.org.tr/en/download/article-file/98111
  (`docs/recherche-biomecanique/confrontation-modele.md:99`).
- NICT. Modèles voxel TARO/HANAKO, « Information on the provision ».
  https://emc.nict.go.jp/bio/en-data-offer/information-on-the-provision.html
  (`docs/recherche-biomecanique/confrontation-modele.md:100`).
- Atamturk D, Duyar I (2008). Age-related factors in the relationship between foot measurements and
  living stature and body weight. J Forensic Sci 53(6):1296-300.
  https://doi.org/10.1111/j.1556-4029.2008.00856.x
  (`docs/recherche-biomecanique/confrontation-modele.md:101`).
- Klaewkasikum K et al. (2022). The ankle kinematic reference of normal gait pattern in Thai adults.
  Front Surg 9:915090. https://doi.org/10.3389/fsurg.2022.915090
  (`docs/recherche-biomecanique/confrontation-modele.md:102`).
- Uzel M et al. (2006). Heel pad thickness and athletic activity in healthy young adults: a sonographic
  study. J Clin Ultrasound 34(5):231-6. https://doi.org/10.1002/jcu.20230
  (`docs/recherche-biomecanique/confrontation-modele.md:103`).
- Torres C, Minetti AE, Biancardi CM, Fábrica G (2026). Energetics, kinematics, and physiologic aspects
  of tango walking in the leader role. PeerJ 14:e21581. https://doi.org/10.7717/peerj.21581
  (`docs/recherche-biomecanique/confrontation-modele.md:104`).
- Yoshida Y et al. (2022). What are the kinematic characteristics of the world champion couple in
  competitive ballroom dance during the waltz's spin movement? Front Sports Act Living 4:941042.
  https://doi.org/10.3389/fspor.2022.941042 (`docs/recherche-biomecanique/confrontation-modele.md:105`).
- Tournillon A, Siegler IA (2021). Voluntary control of pelvic frontal rotations in belly dance experts.
  Hum Mov Sci 77:102791. https://doi.org/10.1016/j.humov.2021.102791
  (`docs/recherche-biomecanique/confrontation-modele.md:106`).
- Fukuchi CA, Fukuchi RK, Duarte M (2019). Effects of walking speed on gait biomechanics in healthy
  participants: a systematic review and meta-analysis. Syst Rev 8:153.
  https://doi.org/10.1186/s13643-019-1063-z (`docs/recherche-biomecanique/confrontation-modele.md:107`).
- Fang X, Jiang Z (2020). Three-dimensional thoracic and pelvic kinematics and arm swing maximum
  velocity in older adults using inertial sensor system. PeerJ 8:e9329.
  https://doi.org/10.7717/peerj.9329 (`docs/recherche-biomecanique/confrontation-modele.md:108`).
- Fujimori T et al. (2012). Kinematics of the thoracic spine in trunk rotation: in vivo 3-dimensional
  analysis. Spine 37(21):E1318-28. https://doi.org/10.1097/BRS.0b013e318267254b
  (`docs/recherche-biomecanique/confrontation-modele.md:110`).
- Tournillon A (2021). Effet de l'expertise en danse orientale sur le contrôle et les coordinations du
  tronc lors de mouvements rythmiques du bassin. Thèse, Université Paris-Saclay.
  https://theses.fr/2021UPASW012 (`docs/recherche-biomecanique/confrontation-modele.md:112`).
- Vaczi M et al. (2016). Ballroom dancing is more intensive for the female partners due to their unique
  hold technique. Physiol Int 103(3):392-401. https://doi.org/10.1556/2060.103.2016.3.11
  (`docs/recherche-biomecanique/confrontation-modele.md:114`).
- Sawers A et al. (2017). Small forces that differ with prior motor experience can communicate movement
  goals during human-human physical interaction. J Neuroeng Rehabil 14:8.
  https://doi.org/10.1186/s12984-017-0217-2 (`docs/recherche-biomecanique/confrontation-modele.md:116`).
- Lamoth CJ et al. (2002). Pelvis-thorax coordination in the transverse plane during walking in persons
  with nonspecific low back pain. Spine 27(4):E92-9.
  https://doi.org/10.1097/00007632-200202150-00016
  (`docs/recherche-biomecanique/confrontation-modele.md:117`).

Références des autres pages du dossier :

- Crosbie J, Vachalathiti R, Smith R (1997). Patterns of spinal motion during walking. Gait Posture
  5(1):6-12. https://doi.org/10.1016/S0966-6362(96)01066-1
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:93`).
- Stokes VP, Andersson C, Forssberg H (1989). Rotational and translational movement features of the
  pelvis and thorax during adult human locomotion. J Biomech 22(1):43-50. Sans URL dans le dépôt
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:94`).
- Chung CY et al. (2010). Kinematic aspects of trunk motion and gender effect in normal adults.
  J Neuroeng Rehabil 7:9. https://doi.org/10.1186/1743-0003-7-9
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:95`).
- Lamoth CJ et al. (2006). Effects of chronic low back pain on trunk coordination and back muscle
  activity during walking: changes in motor control. Eur Spine J 15(1):23-40.
  https://doi.org/10.1007/s00586-004-0825-y
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:97`).
- Moreside JM, Vera-Garcia FJ, McGill SM (2008). Neuromuscular independence of abdominal wall muscles
  as demonstrated by middle-eastern style dancers. J Electromyogr Kinesiol 18(4):527-37.
  https://doi.org/10.1016/j.jelekin.2007.01.003
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:100`).
- Nugent MM, Milner TE (2017). Segmental specificity in belly dance mimics primal trunk locomotor
  patterns. J Neurophysiol 117(3):1100-1111. https://doi.org/10.1152/jn.00693.2016
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:101`).
- Kuliś S, Gajewski J (2022). Kinematic evaluation of contrary body movement in sport ballroom dancing.
  Acta Bioeng Biomech 24(2):119-128. https://pubmed.ncbi.nlm.nih.gov/38314448/
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:102`).
- Fujii R et al. (2007). Kinematics of the lumbar spine in trunk rotation: in vivo three-dimensional
  analysis using magnetic resonance imaging. Eur Spine J 16(11):1867-74.
  https://doi.org/10.1007/s00586-007-0373-3
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:106`).
- Toldo F (2017). « Da geração » e « da simpatia » : relacionalidade em prática em três danças da Ilha
  de Luanda (Angola). Thèse d'anthropologie, Université Paris 10. https://theses.fr/2017PA100184
  (`docs/recherche-biomecanique/danse-de-couple.md:81`).
- Gouridou E et al. (2021). Transversus abdominis and lumbar multifidus thickness among three dance
  positions in Argentine tango dancers. Int J Exerc Sci 14(1):473-485.
  https://doi.org/10.70252/CCUA1820 (`docs/recherche-biomecanique/danse-de-couple.md:85`).
- Chen TL et al. (2015). Evaluation by expert dancers of a robot that performs partnered stepping via
  haptic interaction. PLoS One 10(5):e0125179. https://doi.org/10.1371/journal.pone.0125179
  (`docs/recherche-biomecanique/danse-de-couple.md:87`).
- Chauvigné LAS, Belyk M, Brown S (2018). Taking two to tango: fMRI analysis of improvised joint action
  with physical contact. PLoS One 13(1):e0191098. https://doi.org/10.1371/journal.pone.0191098
  (`docs/recherche-biomecanique/danse-de-couple.md:88`).
- Michalska J et al. (2026). Let's dance – postural control in ballroom dance couples: differences
  between professional and amateur dancers. J Biomech 195:113140.
  https://doi.org/10.1016/j.jbiomech.2025.113140 (`docs/recherche-biomecanique/danse-de-couple.md:89`).
- Chatfield SJ et al. (2007). A descriptive analysis of kinematic and electromyographic relationships
  of the core during forward stepping in beginning and expert dancers. J Dance Med Sci 11(3):76-84.
  https://doi.org/10.1177/1089313X0701100303 (`docs/recherche-biomecanique/danse-de-couple.md:90`).
- Bracco L (2023). Effets moteurs, fonctionnels et psychosociaux du tango chez des personnes âgées
  atteintes de troubles neurocognitifs. Thèse STAPS, Université Bourgogne Franche-Comté.
  https://theses.fr/2023UBFCI008 (`docs/recherche-biomecanique/danse-de-couple.md:91`).
- Wells MD, Hackney ME, Yang F (2026). Effect of dance experience on loading patterns among ballroom
  dancers. J Dance Med Sci 30(3):333-346. https://doi.org/10.1177/1089313X251359492
  (`docs/recherche-biomecanique/danse-de-couple.md:92`).
- Kadaba MP, Ramakrishnan HK, Wootten ME (1990). Measurement of lower extremity kinematics during level
  walking. J Orthop Res 8(3):383-92. https://doi.org/10.1002/jor.1100080310
  (`docs/recherche-biomecanique/genou-et-hanche.md:77`).
- Öberg T, Karsznia A, Öberg K (1994). Joint angle parameters in gait: reference data for normal
  subjects, 10-79 years of age. J Rehabil Res Dev 31(3):199-213. PMID 7965878
  (`docs/recherche-biomecanique/genou-et-hanche.md:78`).
- Roaas A, Andersson GB (1982). Normal range of motion of the hip, knee and ankle joints in male
  subjects, 30-40 years of age. Acta Orthop Scand 53(2):205-8.
  https://doi.org/10.3109/17453678208992202 (`docs/recherche-biomecanique/genou-et-hanche.md:80`).
- Soucie JM et al. (2011). Range of motion measurements: reference values and a database for comparison
  studies. Haemophilia 17(3):500-7. https://doi.org/10.1111/j.1365-2516.2010.02399.x
  (`docs/recherche-biomecanique/genou-et-hanche.md:81`).
- Roach KE, Miles TP (1991). Normal hip and knee active range of motion: the relationship to age. Phys
  Ther 71(9):656-65. https://doi.org/10.1093/ptj/71.9.656
  (`docs/recherche-biomecanique/genou-et-hanche.md:82`).
- Neumann DA (2010). Kinesiology of the hip: a focus on muscular actions. J Orthop Sports Phys Ther
  40(2):82-94. https://doi.org/10.2519/jospt.2010.3025
  (`docs/recherche-biomecanique/genou-et-hanche.md:83`).
- Graber KA et al. (2021). Hip and trunk muscle activity and mechanics during walking with and without
  unilateral weight. J Appl Biomech 37(4):351-358. https://doi.org/10.1123/jab.2020-0273
  (`docs/recherche-biomecanique/genou-et-hanche.md:84`).
- Winter DA et al. (1993). An integrated EMG/biomechanical model of upper body balance and posture
  during human gait. Prog Brain Res 97:359-67. https://doi.org/10.1016/s0079-6123(08)62295-5
  (`docs/recherche-biomecanique/genou-et-hanche.md:85`).
- Vadász K et al. (2022). Frontal plane neurokinematic mechanisms stabilizing the knee and the pelvis
  during unilateral countermovement jump in young trained males. Int J Environ Res Public Health
  20(1):220. https://doi.org/10.3390/ijerph20010220
  (`docs/recherche-biomecanique/kine-osteo-fr.md:80`).
- Termoz N et al. (2008). The control of upright stance in young, elderly and persons with Parkinson's
  disease. Gait Posture 27(3):463-70. https://doi.org/10.1016/j.gaitpost.2007.05.015
  (`docs/recherche-biomecanique/kine-osteo-fr.md:81`).
- Park RJ et al. (2012). Differential activity of regions of the psoas major and quadratus lumborum
  during submaximal isometric trunk efforts. J Orthop Res 30(2):311-8.
  https://doi.org/10.1002/jor.21499 (`docs/recherche-biomecanique/kine-osteo-fr.md:82`).
- Thiescé A (1999). Pied et danse classique. EMC Podologie, Elsevier.
  https://www.em-consulte.com/article/1168/pied-et-danse-classique
  (`docs/recherche-biomecanique/kine-osteo-fr.md:90`).
- Kapandji AI (2018). Anatomie fonctionnelle. Tome 2 : membre inférieur. 7e éd. Paris : Maloine. ISBN
  978-2-224-03495-5. Contenu non consulté (`docs/recherche-biomecanique/kine-osteo-fr.md:92`).
- Viel E (dir.) (2000). La marche humaine, la course et le saut : biomécanique, explorations, normes et
  dysfonctionnements. Paris : Masson. https://nantilus.univ-nantes.fr/vufind/Record/PPN048554928.
  Contenu non consulté (`docs/recherche-biomecanique/kine-osteo-fr.md:93`).
- Mitsuhashi N et al. (2009). BodyParts3D: 3D structure database for anatomical concepts. Nucleic Acids
  Res 37(Database issue):D782-5. https://doi.org/10.1093/nar/gkn613
  (`docs/recherche-biomecanique/pied-et-appuis.md:105`).
- Anatomography, page encyclopédique sur reference.org, source secondaire.
  https://reference.org/facts/Anatomography/Kf1JMqGh
  (`docs/recherche-biomecanique/pied-et-appuis.md:106`).
- Nagaoka T et al. (2004). Description du modèle TARO. Phys Med Biol 49(1):1-15.
  https://doi.org/10.1088/0031-9155/49/1/001 (`docs/recherche-biomecanique/pied-et-appuis.md:107`).
- Taş S (2018). Effect of gender on mechanical properties of the plantar fascia and heel fat pad. Foot
  Ankle Spec 11(5):403-409. https://doi.org/10.1177/1938640017735891
  (`docs/recherche-biomecanique/pied-et-appuis.md:110`).
- Fujii E et al. (2025). Ballet-trained individuals demonstrate reduced postural sway and less variation
  of spinopelvic kinematics compared with an age-matched untrained group during demi-pointe standing.
  Med Probl Perform Art 40(4):145-154. https://doi.org/10.21091/mppa.2025.04016
  (`docs/recherche-biomecanique/pied-et-appuis.md:117`).
- Trégouët P, Merland F (2013). The effects of different shoes on plantar forces in Irish dance. J Dance
  Med Sci 17(1):41-6. https://doi.org/10.12678/1089-313x.17.1.41
  (`docs/recherche-biomecanique/pied-et-appuis.md:118`).

### 7.5 Sources externes : anatomie et données

- BodyParts3D, © The Database Center for Life Science (DBCLS). Licence :
  https://dbarchive.biosciencedbc.jp/en/bodyparts3d/license.html (`README.md:282-286`).
- BodyParts3D. Téléchargement des maillages :
  https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html (`docs/styles-de-danse.md:150`,
  `README.md:423`).
- Z-Anatomy. Modèles dérivés de BodyParts3D, gabarit Blender.
  https://github.com/Z-Anatomy/Models-of-human-anatomy (`docs/styles-de-danse.md:148-149`).
- DejaVu Sans. https://dejavu-fonts.github.io/ (`README.md:288-289`).

### 7.6 Ouvrages cités de seconde main, non consultés par le dépôt

- Averill, Gage (1997). A Day for the Hunter, a Day for the Prey: Popular Music and Power in Haiti.
  University of Chicago Press, p. 33–34. Cité via Wikipédia EN « Méringue »
  (`docs/musique/kompa.md:188-191`).
- Averill (2008) ; Manuel (1988, 2006). Cités via Wikipédia EN « Compas »
  (`docs/musique/kompa.md:184-185`).
- Jean Jean-Pierre, Le Nouvelliste, 27 juillet 2020 ; Plume-Evasion. Cités via Wikipédia FR « Compas
  direct » (`docs/musique/kompa.md:186-187`).
- France Info (2014). Cité via Wikipédia FR (`docs/musique/kompa.md:10`).
- Torres, George (2013). Encyclopedia of Latin American Popular Music. ABC-CLIO, p. 453. Cité via
  Wikipédia EN « Zouk » (`docs/musique/zouk-bresilien.md:204-205`).
- Guilbault, Jocelyne (1993). Zouk: World Music in the West Indies. University of Chicago Press. Cité
  via Wikipédia EN « Zouk » (`docs/musique/zouk-bresilien.md:206-207`).
- Occo (2019) ; Ellingham (1999) ; Manuel, Bilby et Largey (2012). Cités via Wikipédia EN « Zouk »
  (`docs/musique/zouk-bresilien.md:207-208`).
- Moorman (2008). Intonations. Source sur laquelle s'appuie Baratti (`docs/musique/semba.md:182-183`).
- « Eduardo Paim "Sou o precursor da kizomba" », O País, 2012. Cité via Wikipédia EN « Kizomba »
  (`docs/musique/kizomba.md:167-168`).
- Whittle et Levine (1999) ; Staszkiewicz et al. (2012). Cités via Fang et Jiang (2020)
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:17-18`).

### 7.7 Bibliothèques et outils cités

- Dépendances de l'application : `@react-three/drei` ^10.7.9, `@react-three/fiber` ^9.8.2, `react`
  ^19.1.0, `react-dom` ^19.1.0, `three` ^0.187.0 (`package.json:13-19`).
- Outils de développement : `@vitejs/plugin-react` ^4.7.0, `autoprefixer` ^10.4.20, `ffmpeg-static`
  ^5.3.0, `playwright` ^1.65.1, `postcss` ^8.4.49, `tailwindcss` ^3.4.17, `typescript` ^5.8.3, `vite`
  ^6.3.5, et les types `@types/node`, `@types/react`, `@types/react-dom`, `@types/three`
  (`package.json:20-33`).
- Résumé du dépôt : « Vite + React 19 + @react-three/fiber 9 + drei 10 + three 0.187 + TypeScript
  strict + Tailwind 3 » (`AGENTS.md:59-60`).
- Son : Web Audio, dans le navigateur (`README.md:46-48`).
- Captures : Playwright avec Chromium headless ; conversion en GIF par `ffmpeg-static`
  (`README.md:298`, `README.md:393`). Mesure des pistes : `ffmpeg` (`docs/musique/enregistrements.md:67`).
- Anatomie : `trimesh`, `numpy`, `@gltf-transform/cli`, compression Draco (`README.md:407-409`) ;
  format GLB avec `KHR_mesh_quantization` (`README.md:389-390`).
- Déploiement : GitHub Pages par GitHub Actions, `actions/deploy-pages` (`README.md:427-429`).
- Recherche documentaire : PubMed par les E-utilities du NCBI, PMC, Europe PMC, Crossref, theses.fr
  (`docs/recherche-biomecanique/README.md:56-59`).
- Inspiration de méthode pour le son, sans aucun échantillon : le générateur de percussions de salsa de
  RecoDanse (`docs/spec-son-synthese.md:15-18`).
- Site publié : https://arcodange-org.github.io/dance-hips-movement-3D-comparison/ (`README.md:12`).
  Vitrine : même adresse avec `?vitrine=1` (`README.md:16`).

### 7.8 Modèles d'IA et agents de code nommés par le dépôt

- Musique : Eleven Music (ElevenLabs). Modèle noté `music_v2_5` dans le registre des pistes
  (`README.md:34-35`, `docs/musique/enregistrements.md:5`, `docs/musique/enregistrements.md:20`,
  `src/music/recordings.data.ts:16`).
- Voix de la vidéo : Phonon, de Gradium, exécuté en local avec ollama (`docs/spec-video-pas-de-base.md:45`,
  `docs/spec-video-pas-de-base.md:57`).
- « session Mistral » : le harnais est écrit « pour toute session Mistral » (`.vibe/README.md:1`,
  `.vibe/HARNESS.md:13`, `.vibe/CONTRIBUTING.md:13`, `CONTEXT.md:321`).
- « phases Vibe » : le dépôt nomme ainsi les phases dont il remplace les anciennes procédures
  (`AGENTS.md:5`). Le dossier du harnais s'appelle `.vibe/` et la convention de branches de ces phases
  est `vibe/...` (`AGENTS.md:52-54`, `.vibe/HARNESS.md:29`).
- Dossiers de travail d'agents : `.claude/worktrees/<slug>` et `.Codex/worktrees/<slug>`
  (`AGENTS.md:8`, `CONTEXT.md:183`, `CONTEXT.md:199`, `CONTEXT.md:225`, `.vibe/HARNESS.md:6`). Ces
  fichiers ne nomment aucun modèle à cet endroit.
- « autre agent » : mention sans nom (`CONTEXT.md:363`, `docs/retrospective-M4-oracle.md:22`).
- Les rétrospectives de `docs/` ne nomment aucun modèle (recherche par mots-clés, 21 novembre 2026).
- Hors fichiers, dans l'historique git de la branche lue (`git log`, 21 novembre 2026) : 56 commits ont
  pour auteur « Vibe Nuage Agent » ; 143 commits portent la mention « Claude Opus 5.5
  <noreply@anthropic.com> » en co-auteur.
- Cette vidéo (#155) : le scénario a été écrit, critiqué, synthétisé et contre-vérifié par des agents Claude
  (Anthropic) en workflow, et la chaîne de fabrication écrite et lancée par une session Claude Code dont le
  modèle est Claude Fable 5.2 (déclaré par la session elle-même, le 21 novembre 2026). Les commits de la
  branche portent la mention « Claude Opus 5.5 » en co-auteur, selon la consigne de passation du propriétaire
  (`docs/spec-video-pas-de-base.md`, section « Règles de contenu »).

## 8. Ce que le dépôt ne dit pas

- Aucune mesure sur des danseurs réels pour aucun des six styles : ni angles, ni distances, ni forces
  (`docs/recherche-biomecanique/danse-de-couple.md:12-15`).
- Aucune validation par un danseur ou un professeur des six pas de base animés. Le dépôt parle
  seulement d'une animation « sans validation chorégraphique » (`src/components/GuidageApp.tsx:273`).
- L'auteur et le contenu exact de la spec biomécanique d'origine : le fichier `SPEC.md` cité n'est pas
  dans le dépôt (`docs/styles-de-danse.md:3-4`).
- La date et le lieu de naissance de la kizomba comme danse. Le dépôt date surtout la musique
  (`docs/musique/kizomba.md:7-16`).
- L'étymologie des mots « kompa », « zouk » et « suave ». Le dépôt ne donne que « semba »,
  « tarraxinha », « ginga » et un sens de « kizomba » (`docs/musique/semba.md:7-8`,
  `docs/musique/tarraxinha.md:7-8`, `docs/ginga-angolana.md:10-14`,
  `docs/recherche-biomecanique/danse-de-couple.md:18-20`).
- L'histoire de la danse kompa. Le dépôt ne cite qu'un deux-pas « carré » introduit par Nemours
  (`docs/musique/kompa.md:104`).
- Qui a nommé le « suave », où et quand. Une seule attestation du mot, dans un témoignage de presse
  (`docs/musique/suave.md:7-10`).
- L'origine de l'urban kiz. Le dépôt dit seulement qui l'a influencé et qu'il a un cadre plus tendu
  (`docs/musique/tarraxinha.md:19`, `docs/styles-de-danse.md:37`).
- Le rôle du Portugal, du Cap-Vert ou de la France dans la diffusion de la kizomba. Le dépôt ne cite que
  Lisbonne pour le tarraxo et un groupe néerlandais d'origine cap-verdienne pour le ghetto zouk
  (`docs/musique/tarraxinha.md:16-18`, `docs/musique/suave.md:16-17`).
- Des noms de danseurs ou de pédagogues de référence pour le kompa, la tarraxinha et le suave. Pour la
  kizomba et le semba : Paulo Isidoro Dos Reis et Eddy Vents. Pour le zouk brésilien : Adílio Porto et
  Renata Peçanha (`docs/ginga-angolana.md:33-36`, `docs/musique/zouk-bresilien.md:35-36`).
- Si la marqua de la kizomba porte le poids ou non. Question ouverte
  (`docs/musique/confrontation-moteur.md:130`).
- La durée d'un cercle de bassin en tarraxinha par rapport aux temps. Aucune source
  (`docs/musique/confrontation-moteur.md:85-86`).
- Le tempo de morceaux réels vérifié à l'oreille. Les chiffres par titre sont des estimations
  algorithmiques, non retenues pour la kizomba (`docs/musique/kizomba.md:34-36`).
- Une description cinématique publiée du « 8 » du bassin
  (`docs/recherche-biomecanique/bassin-et-dissociation.md:88`).
- Des pistes enregistrées pour le semba, le kompa, la tarraxinha, le suave et le zouk brésilien. Elles
  sont « à faire » (`docs/spec-musique-elevenlabs.md:36`).
- Le droit d'utiliser la piste générée dans une vidéo. Les conditions relevées sont « à confirmer par le
  propriétaire » et ne parlent pas de ce cas (`docs/spec-musique-elevenlabs.md:317-324`).
- La licence du code du dépôt. Aucun fichier de licence à la racine (liste des fichiers, 21 novembre
  2026). Seules les licences des maillages et de la police sont écrites (`README.md:280-289`).
- La différence entre le pas de base du guideur et celui du suiveur. En paire, le suiveur est le miroir
  du guideur pour ces pas (`README.md:361-364`).
