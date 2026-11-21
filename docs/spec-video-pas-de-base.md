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

Une vidéo de 4 à 6 minutes, 1920 × 1080, 25 images par seconde, sous-titrée en français.

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
  l'instant `t` (pas fixe d'une image), place la caméra et rend l'image ; `window.__film.ready()` dit quand
  les modèles sont chargés.
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
- **Buste** : demande du propriétaire en cours de travail, « Si on affiche les os et muscle du buste il n'y a
  pas de raison d'afficher les blocs gris. » Avec la couche de muscles, les blocs gris du tronc sont masqués
  (`trunkBlocksVisible`, `src/muscles.ts`).

## Ce qui reste

- **Le ginga en danse de couple** : « J'aimerai aussi que le "sway" des hanches et le petit effet de "bounce",
  le ginga en fait, soit présent pour montrer que les danseurs se balancent au rythme de la musique »
  (propriétaire, 21 novembre 2026). Le balancement déclenché par les transferts d'appui n'existe que pour
  l'ida e volta ([spec #42](spec-ginga.md)) ; l'étendre aux autres figures est un chantier de mouvement à part.
  Le final de la vidéo sera refilmé ensuite (`node scripts/video/generer_video.mjs`).
- **L'écoute des musiques** par le propriétaire ; une musique refusée se régénère avec
  `scripts/video/musique.mjs --generer <style>` (avec son accord : crédits).
- **Tête et bras** restent des volumes stylisés : le modèle n'a ni leurs os ni leurs muscles.

## Hors périmètre

- Les mascottes (Rémi, Corinne).
- L'usage des nouvelles musiques dans l'application (#146) : elles servent ici à la vidéo ; les proposer dans
  l'application reste une décision d'écoute du propriétaire.
- La mise en ligne de la vidéo.
