# Vidéo éducative : le pas de base sur place d'un style à l'autre (#155)

## Demande du propriétaire (21 novembre 2026)

> Fais une vidéo qui présente les différences sur le pas de base sur place entre les différents style (utilise
> elevenlabs pour des musiques adéquates, je te laisse choisir seul) : fais-en quelque chose d'educatif en
> condensant ce que les recherches ont pu rassembler et en mentionnant rapidement les limites (Phonon pour la
> voix). Tu peux ajouter de la narration pour rendre la présentation de chaque style immersive, utiliser
> plusieurs voix, expliquer l'evolution, l'influence ou l'histoire brièvement. Et bien sûr inclure un plan où
> l'on voit plusieurs styles avec leur similarités et différence. Enfin termine par quelques secondes de la
> simulation des danseurs qui dansent automatiquement en kizomba/semba. Dans les crédits de fin qui
> s'affichent pendant que les danseurs continuent de danser en fond tu mentionnent toutes les sources et les
> llm etc...
>
> Garde le script qui génère la vidéo car on pourra l'améliorer au fur et à mesure de nos progrès

Puis, pendant le travail : « la vidéo vaut la peine d'avoir un workflow ».

## Ce que la vidéo contient

Une vidéo de 4 à 6 minutes 30, 1920 × 1080, 25 images par seconde, sous-titrée en français.

1. **Ouverture** : le titre, ce qu'est le pas de base sur place et ce qu'on regarde (bassin, genoux, appuis).
2. **Un chapitre par style** (six) : le danseur seul, avec les muscles, calé sur une musique du style ; la
   narration raconte d'où vient le style, ce qui l'a influencé et ce que fait le pas de base.
3. **La comparaison** : les six danseurs côte à côte, au même tempo, puis un gros plan sur les bassins ;
   ce qu'ils ont en commun et ce qui les sépare.
4. **Les limites**, dites en quelques secondes.
5. **Le final** : la danse automatique en couple (vitrine, #150), puis les crédits qui défilent pendant
   que le couple continue de danser.

## Règles de contenu

- **La narration ne dit que ce que la fiche de faits contient** (`docs/video/faits-pas-de-base.md`), elle-même
  tirée des recherches du dépôt avec leurs références. Rien n'est ajouté de mémoire.
- Chaque phrase du scénario cite les faits sur lesquels elle s'appuie (`faits`), et un test le vérifie.
- Le scénario passe par un **workflow** : un rédacteur, puis des critiques indépendants (exactitude, clarté,
  rythme, image), puis une synthèse. Le film rendu repasse devant des spectateurs neufs.
- Les limites du projet sont dites dans la vidéo : modèle paramétrique, pas de capture de mouvement, pas de
  validation chorégraphique, musique et voix générées.

## Attributions obligatoires, à l'écran dans les crédits

- BodyParts3D, © The Database Center for Life Science, **CC BY-SA 2.1 Japan**.
- **« Voice: Phonon by Gradium — gradium.ai »**. Phonon 40m français est sous CC BY-NC 4.0 : la vidéo est
  réservée à un usage non commercial tant que cette voix y figure.
- Musique générée par IA (Eleven Music, ElevenLabs).
- Toutes les sources des recherches, les outils, et les modèles d'IA qui ont écrit le code et la vidéo.

## La chaîne de fabrication (`scripts/video/`)

Tout est reproductible : on relance, la vidéo suit les progrès du moteur.

| Étape | Script | Ce qu'il fait |
|---|---|---|
| Scénario | `scenario.mjs` | Le film en données : chapitres, phrases, voix, plans, musiques, crédits. |
| Voix | `voix.mjs` | Chaque phrase dite par Phonon (ollama local), durées relevées. |
| Musique | `musique.mjs` | Un extrait par style (Eleven Music), tempo et premier temps mesurés. |
| Calendrier | `calendrier.mjs` (pur) | Place les phrases, calcule la durée de chaque chapitre et de chaque plan. |
| Plans | `capturer.mjs` | Filme l'application image par image, au tempo de la musique. |
| Habillage | `habillage.mjs` | Titres, cartouches, légendes et crédits rendus en images. |
| Montage | `monter.mjs` | Assemble image, voix, musique et sous-titres ; niveau final à −16 LUFS. |
| Contrôle | `controle.mjs` | Vérifie le scénario : structure, faits cités, attributions, durée. |
| Tout | `generer_video.mjs` | Enchaîne les étapes ; `--chapitres` pour n'en refaire qu'un. |

- **Rien de lourd n'est versionné** : la vidéo et les fichiers intermédiaires vont dans `essais/video/`
  (ignoré par git). Les textes, le scénario et les scripts le sont.
- **Les extraits de musique restent hors du dépôt** : seule leur provenance est versionnée
  (`scripts/video/pistes/pistes.json`). Les conditions d'Eleven Music (version du 9 octobre 2026, offre
  Starter) interdisent de mettre une collection de morceaux à la disposition de tiers, payante ou non
  (« Music Library », § 4.2 et 4.8(f)) ; un dépôt public en serait une. Les fichiers restent sur la machine du
  propriétaire : on remonte la vidéo sans racheter de musique tant qu'ils y sont.
- **La musique ne se génère jamais par accident** : `musique.mjs` n'appelle ElevenLabs que sur demande
  explicite (`--generer`), avec la clé lue dans l'environnement, jamais écrite. Sans cela, il réutilise les
  extraits du dépôt.
- **Les voix sont locales** : aucune phrase ne sort de la machine.

## Filmer l'application image par image (`film=1`)

Le rendu en temps réel d'un navigateur sans écran perd des images. Avec `film=1`, la scène 3D ne s'anime plus
seule : le script demande chaque image.

- `src/film.ts` (pur) : lecture du paramètre, temps d'une image, position de la caméra pour un cadrage.
- `src/components/FilmDriver.tsx` : expose `window.__film.frame(t, cadrage)`, qui avance la scène jusqu'à
  l'instant `t` (pas fixe d'une image), place la caméra et rend l'image ; `meshes()` dit quand les modèles
  sont chargés, `beat()` donne le temps de danse, `pelvis()` la position du bassin (le film en trace le
  trajet). Un cadrage `relative` suit en douceur l'orientation du couple : l'angle demandé se compte à partir
  du couple, pas de la piste.
- En mode film, la ligne du trajet du bassin que l'application dessine dans la scène est masquée : le film
  affiche sa propre vue de dessus.
- L'horloge de danse reste celle de l'application (`DanceTransport`) : ce que la vidéo montre est ce que
  l'application montre, au tempo demandé par l'URL (`bpm=`).
- Sans `film=1`, rien ne change.

## Synchronisation avec la musique

L'extrait de chaque style est mesuré (`scripts/tempo.mjs`) : tempo et instant du premier temps. Le plan est
filmé à ce tempo, et le montage cale le premier temps de la musique sur le temps 0 de la danse.

## Validation

- `scripts/test_video.mjs`, dans `npm test` : le scénario est complet (six styles, comparaison, limites,
  final), chaque phrase cite ses faits et ces faits existent dans la fiche, les crédits portent les
  attributions obligatoires, le calendrier est cohérent (aucune phrase ne déborde de son chapitre, durée totale
  entre 4 et 6 minutes 30 pour des durées de voix données), `film.ts` calcule les bons instants et cadrages.
- Dans le même test, les mesures du modèle (`scripts/video/mesurer_pas.mjs`, sur le GLB) : ce que la narration
  affirme des appuis, du « 8 », du pivot du bassin et du buste penché y est confronté ; si le moteur change, le
  test dit quelles phrases ne sont plus vraies.
- Contrôle du film rendu : durée, présence du son, niveau par chapitre, une image relue par phrase
  (`essais/video/planches/`), voix transcrites et comparées au texte.

## Ce qui a été fait (21 novembre 2026)

- **Scénario par workflow**, huit agents : un rédacteur, quatre critiques indépendants (exactitude, image,
  clarté, rythme ; 9 constats bloquants, tous traités), une synthèse, une contre-vérification adverse, un
  passage de corrections. Verdict final : les 39 phrases, les six cartouches et les attributions tiennent
  face à la fiche de faits ; aucune incertitude de la fiche n'est devenue certitude.
- **Ordre des styles** : semba, kompa, kizomba, tarraxinha, suave, zouk brésilien. Deux points de départ
  (Luanda, Port-au-Prince), puis la kizomba que les sources relient aux deux, puis les deux styles rattachés à
  la kizomba, puis le zouk brésilien, autre branche.
- **Voix** : Hélène (guide), Lucien (histoire), Noémie (geste), choisies par la mesure (hauteur, débit) et
  vérifiées par transcription locale (fidélité médiane 94 %). Les mots mal dits ont une écriture phonétique
  (`dit`, `PRONONCIATION`) : semba, tarraxinha, Nemours, kimbundu, « vis », « zouk antillais ».
- **Musiques** : cinq extraits Eleven Music (modèle `music_v2_5`), plans de composition tirés de
  `docs/musique/`, tempos tenus (119,98 ; 119,98 ; 75,00 ; 72,00 ; 79,99 bpm). **Choisis par la mesure, pas à
  l'oreille** : l'écoute revient au propriétaire. Seule la partie pleine de chaque extrait sert au film.
- **Première version** : 5 min 40, 1920 × 1080, −16 LUFS, remise au propriétaire le 21 novembre 2026.
- **Relecture du film monté** par trois agents sans contexte, sur une image par phrase : un spectateur neuf,
  un contrôle de la correspondance entre image et texte, un contrôle de la lisibilité (notes 6, 6 et 7 sur 10 ;
  aucune information trompeuse, les 39 sous-titres et les attributions conformes). Leurs constats ont donné la
  deuxième version : un plan par phrase (l'histoire en pied, le premier geste en gros plan fixe et de face, les
  suivants de profil), sous-titres en cartons de deux lignes, trajet du bassin vu de dessus mesuré pendant la
  capture (le « 8 » du suave, la largeur et le rebond de chaque style, les six trajets à la même échelle dans
  la comparaison), grille des bassins plus proche et aérée, noms lisibles sous le voile, caméra du final qui
  reste de côté en suivant l'orientation du couple, intertitres, textes qui ne débordent plus sur le danseur.
- **Gardé tel quel** : les réserves dites dans les phrases de geste (elles disent où le modèle s'écarte des
  sources) ; le générique en petits caractères (143 sources en une minute).
- **Buste** : demande du propriétaire en cours de travail, « Si on affiche les os et muscle du buste il n'y a
  pas de raison d'afficher les blocs gris. » Avec la couche de muscles, les blocs gris du tronc sont masqués
  (`trunkBlocksVisible`, `src/muscles.ts`).

- **Troisième version, avec le ginga du couple.** Demande du propriétaire : « J'aimerai aussi que le "sway"
  des hanches et le petit effet de "bounce", le ginga en fait, soit présent pour montrer que les danseurs se
  balancent au rythme de la musique ». Le balancement et le rebond sont arrivés dans le mode jeu
  ([spec #157](spec-ginga-couple.md), réglage « marqué » par défaut) ; la vidéo a été refilmée sur cette base.
  - **Ce que le ginga change, mesuré** sur le bassin du premier danseur, même graine et même danse, image
    par image, avant et après : un rebond d'environ 1 cm de haut en bas, une fois par temps ; un déplacement
    de côté de 1,1 cm en valeur efficace, 2,4 cm au plus. C'est un petit mouvement régulier, pas un grand :
    l'agitation du bassin autour de son trajet moyen ne change presque pas (3,64 puis 3,67 cm), parce que les
    pas en font déjà l'essentiel.
  - **La caméra du final a changé pour qu'il se voie.** De profil, le balancement des hanches part vers la
    caméra : on ne le voit pas. La caméra va maintenant lentement du trois quarts au profil puis à l'autre
    trois quarts (`FINAL_BALAYAGE`, `FINAL_PERIODE`), un peu plus près du couple.

- **Quatrième version (22 novembre 2026), après trois paroles du propriétaire.**
  - Sur le ginga du couple, au réglage par défaut, filmé en pied : « Trop discret. » Le final ouvre
    maintenant sur le couple en pied, puis s'approche des deux bassins, de trois quarts, pendant une quinzaine
    de secondes (`"plan": "hanches"`, `FINAL_HANCHES`). Le ginga y est celui de l'application : d'abord forcé
    au réglage « ample », puis sans réglage forcé quand « ample » est devenu le défaut (#163, #164). Une phrase
    dit ce qu'on regarde, et que le « 8 » manque encore. Mesuré comme pour la troisième version, avec ce
    réglage : le bassin s'écarte de 3,4 cm au plus d'un côté (près de 7 cm d'un bord à l'autre), 1,4 cm en
    valeur efficace, avec un rebond de 1,2 cm par temps. Au réglage « marqué » : 2,4 cm au plus et 1 cm.
  - Sur le kompa : « Le konpa est complètement faux actuellement: c'est le 8 le plus prononcé justement.
    Complémente les connaissances sur ce style. » La recherche est dans
    [`docs/recherche-danse/kompa.md`](recherche-danse/kompa.md) (#161). Le chapitre kompa dit maintenant que
    l'image est fausse, puis ce que décrivent les professeurs : une marche en rythme, le bassin relâché avant
    chaque appui, un demi-« 8 » par appui au rythme ralenti, des genoux qui balancent les hanches. La
    comparaison dit que le kompa devrait dessiner un « 8 ».
  - Sur le semba : « En semba le 2e rebond est fait comme un chacha en refaisant rapidement un petit rond du
    "8" de ginga avant de reprendre le mouvement de "8" plus grand. » Une phrase du chapitre semba le dit, et
    dit que le modèle ne le fait pas encore.
  - Le film dure maintenant un peu plus de six minutes.
- **Refilmé après les premières corrections de fluidité du couple** (#167 : marche, ida e volta, passage d'un
  côté à l'autre d'une figure à la suivante). Mesuré sur le bassin du premier danseur du final, même danse :
  les déplacements de plus de 5 cm en un huitième de temps passent de 204 à 108 images sur 2 200, et la
  variation du pas d'une image à la suivante de 7,4 à 4,1 cm au plus. Les plus grands sauts restent
  (14 cm en un huitième de temps) : quarts de tour et sorties ne sont pas encore corrigés.
- **Refilmé après le haut du corps anatomique et le cadre des bras** (#177) : seul le final change (le cadre des
  bras du couple) ; les chapitres par style et la comparaison sont identiques image pour image.
- **Refilmé après les pas élus du kompa et du semba** (#160, 23 novembre) : le pas de base des deux styles,
  danseur seul, est celui que le propriétaire a élu sur films. Les deux chapitres et la comparaison sont
  réécrits : le film ne dit plus que l'image est fausse, il dit ce que le modèle fait (la hanche s'assoit quand
  le poids arrive, le bassin dessine un « 8 » vu de dessus et ne s'arrête jamais, le buste suit, penché d'une
  quinzaine de degrés ; au semba, deux arrivées de suite sur chaque pied) et où il s'écarte des sources (le
  motif d'appuis du semba, l'ordre du demi-« 8 » du kompa). Faits F338 à F355 ; le film dure 6 min 25 environ.

## Ce qui reste

- **Le couple et le déplacement** gardent l'ancien déhanché du kompa et du semba, et le ginga du couple n'a pas
  encore son « 8 » : c'est le chantier #187. Le final du film le dit. La vidéo sera refilmée quand il sera
  fusionné (`node scripts/video/generer_video.mjs`).
- **L'écoute des musiques** par le propriétaire ; une musique refusée se régénère avec
  `scripts/video/musique.mjs --generer <style>` (avec son accord : crédits).
- **Tête et bras** restent des volumes stylisés : le modèle n'a ni leurs os ni leurs muscles.

## Hors périmètre

- Les mascottes (Rémi, Corinne).
- L'usage des nouvelles musiques dans l'application (#146) : elles servent ici à la vidéo ; les proposer dans
  l'application reste une décision d'écoute du propriétaire.
- La mise en ligne de la vidéo.
