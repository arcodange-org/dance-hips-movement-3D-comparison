# Spec — exercices d'isolation seul, pieds posés : le cou, la poitrine, le bassin (#206)

Fil d'Ariane : [docs](./) › **spec isolations** · lot **L441** de la fiche 111 du dossier ReCoDanse (« Les exercices
montrés par les mascottes ») · suite : L442 (le pont des mascottes filme Rémi et Corinne côte à côte)

## Objectif

ReCoDanse veut proposer dans « S'entraîner » des exercices **sans vidéo de la personne** (échauffement, étirement,
body move), chacun montré en boucle par Rémi le tigre et Corinne la perroquette, filmés par le pont privé des
mascottes sur le squelette de ce moteur. Ce lot fait le mouvement, dans le moteur :

> Une adresse fait faire **un exercice** à un danseur seul, **pieds posés** : seule la partie du corps nommée bouge,
> en boucle, à trois vitesses.

Sans le paramètre, rien ne change (aucun paramètre existant renommé, aucun test existant touché).

## Les exercices

Gauche et droite sont **ceux du danseur**. Le danseur regarde la caméra par défaut : quand il tourne la tête à sa
gauche, on la voit partir vers la droite de l'écran. `miroir=1` montre l'exercice comme dans le miroir d'un studio
(le danseur fait l'inverse, pour que la personne qui le regarde et l'imite aille du côté nommé).

Un exercice enchaîne **trois vitesses**, du plus lent au plus rapide, **deux mesures chacune** (huit temps) : **deux
temps par mouvement, puis un temps, puis un demi-temps** ; puis il recommence (la dernière image enchaîne sur la
première). Un **mouvement** est le passage d'un point de la figure au suivant, le centre compris : à un temps par
mouvement, le cercle marqué fait 1 devant, 2 au centre, 3 à droite… Une vitesse dure le tour entier de la figure s'il est
plus long que deux mesures : le cercle marqué (huit points) prend quatre mesures à deux temps par mouvement. Une boucle
dure donc trois huits (quatre pour les cercles marqués). « Sur 1 » veut dire « arrivé sur le temps 1 » de la vitesse.

| Code | Adresse `isolation=` | Ce qu'on voit |
|---|---|---|
| C1 | `cou-tourne` | la tête tourne : regarder à gauche, puis à droite |
| C2 | `cou-penche` | la tête penche : l'oreille vers l'épaule gauche, puis vers la droite |
| C3 | `cou-hoche` | le menton en bas, puis en haut |
| C4 | `cou-cercle` | le cercle de la tête : devant (menton en bas), à droite, derrière, à gauche |
| C5 | `cou-cercle-inverse` | le même dans l'autre sens : devant, à gauche, derrière, à droite |
| C6 | `cou-demi-cercle` | le demi-cercle de la tête : l'oreille gauche, le menton en bas, l'oreille droite, le menton ; jamais en arrière |
| P1 | `poitrine-avant` | la poitrine glisse devant, puis derrière |
| P2 | `poitrine-cote` | la poitrine glisse à gauche, puis à droite (la cage glisse, elle ne tourne pas) |
| P3 | `poitrine-cercle-marque` | le cercle marqué, à un temps par mouvement : 1 devant, 2 au centre, 3 à droite, 4 au centre, 5 derrière, 6 au centre, 7 à gauche, 8 au centre |
| P4 | `poitrine-cercle-lie` | le même cercle, lié : devant, à droite, derrière, à gauche, sans repasser par le centre |
| P5 | `poitrine-cercle-marque-inverse` | le cercle marqué dans l'autre sens : devant, gauche, derrière, droite |
| P6 | `poitrine-cercle-lie-inverse` | le même, lié |
| P7 | `poitrine-demi-cercle` | le demi-cercle de la poitrine : à gauche, devant, à droite, devant |
| B1 | `bassin-bascule` | le bassin bascule : avant (le pubis avance, les fesses rentrent), puis arrière (les fesses sortent) |
| B2 | `bassin-cote` | le bassin glisse à gauche, puis à droite, le poids sur les deux pieds |
| B3 | `bassin-cercle-marque` | le cercle du bassin marqué, comme P3 |
| B4 | `bassin-cercle-lie` | le même, lié |
| B5 | `bassin-cercle-marque-inverse` | le cercle marqué dans l'autre sens |
| B6 | `bassin-cercle-lie-inverse` | le même, lié |
| B7 | `bassin-huit` | le huit en place : le bassin part à gauche par devant, revient par derrière, passe au centre, part à droite par devant, revient par derrière |
| B7′ | `bassin-huit-inverse` | le huit dans l'autre sens : chaque côté part par derrière et revient par devant |

Dix-huit exercices de la fiche 111 § 7, le huit dans ses deux sens, et les deux demi-cercles ajoutés au vote :
**vingt et une boucles**.

Tranché par le fondateur de ReCoDanse le 24 novembre 2026 : le cou **tourne et penche** (deux exercices) ; le cercle
**marqué** repasse par le centre entre ses quatre points, le cercle **lié** n'y repasse pas. Puis, au vote du même soir
(tour 12) : amplitude moyenne ; trois vitesses par exercice ; le point marqué posé et tenu, fluide quand la vitesse ne le
permet plus ; les demi-cercles de la tête et de la poitrine.

## Règles du mouvement

- **Seule la partie nommée bouge.** Dans un exercice du cou, la poitrine et le bassin ne bougent pas ; dans un exercice
  de la poitrine, le bassin et la tête restent droits (la tête suit la poitrine, sans tourner ni pencher) ; dans un
  exercice du bassin, la poitrine et la tête restent où elles sont.
- **Pieds posés, poids sur les deux pieds** : aucun balancement du style, aucun transfert de poids, aucun rebond.
  Genoux souples (ni tendus ni pliés en danse). Les jambes s'ajustent : c'est le solveur des jambes qui trouve la hauteur
  du bassin, comme partout.
- **Le bassin reste à niveau toute la boucle** : à la hauteur la plus basse que les jambes lui donnent sur le huit (quand
  le bassin glisse de côté, la jambe opposée plie). Le danseur s'assoit donc un peu dans ses genoux dès le départ, et la
  poitrine et la tête ne montent ni ne descendent avec le bassin.
- **La poitrine glisse** (devant, derrière, de côté, en cercle) : la cage thoracique se déplace sans tourner, la colonne
  prend le chemin entre le bassin et la cage.
- **Le cou plie depuis sa base** quand la tête penche ou hoche ; la tête tourne en haut du cou.
- **Trois vitesses** : deux temps, un temps, un demi-temps par mouvement. Le cercle lié fait un tour en deux mesures, puis
  en une, puis en une demi-mesure ; le huit du bassin de même. À deux temps et à un temps par mouvement, **chaque point
  est posé puis tenu** un instant (un tiers du mouvement), puis on part vers le suivant ; **au demi-temps, le mouvement
  est fluide** : il passe par les points sans s'y arrêter (le marqué traverse le centre).
- **La tête en arrière va moins loin** que la tête en avant (menton en haut, derrière du cercle) : un échauffement ne
  casse pas la nuque.

## Élu (vote du 24 novembre 2026, tour 12)

L'amplitude et la forme se sont montrées en GIF avant d'être figées ([procédure](../.vibe/CONTRIBUTING.md), § 7,
[dossier](elections/2026-11-24-isolations/README.md)). Résultat :

- **Amplitude moyenne** pour le cou, la poitrine et le bassin (petit et grand retirés).
- **Rythme** : aucun des trois candidats seul ; chaque exercice les enchaîne, deux mesures de chacun, du plus lent au plus
  rapide (deux temps, un temps, un demi-temps par mouvement).
- **Point marqué** : posé puis tenu, sauf quand la vitesse ne le permet plus ; il est alors fluide (au demi-temps).
- **Les dix-neuf boucles conviennent** ; ajouter les demi-cercles de la tête et de la poitrine (C6, P7).
- **Le huit du bassin** (glisse ou tourne) : pas de vote enregistré. Le huit glisse ; le candidat `?essai=isoHuitTourne`
  reste filmable jusqu'au vote.

Les candidats du premier tour, pour mémoire :

| Question | Proposition (filmée) | Autres candidats (`essai=`) |
|---|---|---|
| Amplitude du cou | moyenne | `isoCouPetit`, `isoCouGrand` |
| Amplitude de la poitrine | moyenne | `isoPoitrinePetit`, `isoPoitrineGrand` |
| Amplitude du bassin | moyenne | `isoBassinPetit`, `isoBassinGrand` |
| Rythme des allers-retours (poitrine, bassin) | un point par temps, en repassant par le centre : 1 devant, 2 centre, 3 derrière, 4 centre | `isoDeuxTemps` : deux temps par point ; `isoContinu` : un côté par temps, sans s'arrêter au centre |
| Le point marqué | posé sur le temps puis tenu un instant, puis on part vers le suivant | `isoFluide` : sans tenue, d'un point à l'autre |
| Le huit du bassin | le bassin glisse (sans tourner) | `isoHuitTourne` : le bassin tourne aussi, la hanche de devant mène |

Amplitudes du modèle, élues moyennes (mesures de spec, jamais montrées au danseur) :

| Exercice | Moyen |
|---|---|
| C1 tourner | 50° de chaque côté |
| C2 pencher | 30° de chaque côté |
| C3 hocher | menton en bas 30°, en haut 20° |
| C4, C5 cercle de tête, C6 demi-cercle | en bas 25°, sur les côtés 25°, en arrière 15° (pas pour C6) |
| P1 | devant 5 cm, derrière 4 cm |
| P2 | 5 cm de chaque côté |
| P3 à P7 | devant 5 cm, derrière 4 cm, côtés 5 cm |
| B1 bascule | avant 10°, arrière 12° |
| B2 | 5 cm de chaque côté, la hanche du côté où va le bassin remonte de 4° |
| B3 à B6 | devant et derrière 4 cm avec la bascule (8°, 10°), côtés 5 cm avec la hanche qui remonte |
| B7, B7′ | côtés 5 cm, devant et derrière 3 cm, hanche qui remonte ; candidat « tourne » : 10° |

## Adresse

```
?isolation=poitrine-cercle-marque&haut=1&muscles=1
```

| Paramètre | Effet | Défaut |
|---|---|---|
| `isolation=<adresse>` | le danseur fait l'exercice, en boucle (trois vitesses) | — (rien ne change) |
| `miroir=1` | l'exercice est montré comme dans un miroir (gauche et droite échangés) | les côtés du danseur |
| `mode=compare` | les deux danseurs côte à côte font le même exercice en même temps (pour Rémi et Corinne, L442) | danseur seul |
| `haut=1` | os et muscles du buste, du cou et de la tête : **nécessaire pour voir le cou** (la tête stylisée est une sphère) | — |

En couple (`mode=pair`) le paramètre est ignoré. Les bras sont relâchés le long du corps pendant un exercice (le cadre de
danse est retiré).

## Moteur

- `src/isolations.ts` (pur, sans three.js) : le catalogue `ISOLATIONS` (code, famille, nom en danseur), et
  `isolationAt(id, temps, réglages)` qui rend l'intention du corps à ce temps, en mots de danseur : tête (hoche,
  tourne, penche, rad), poitrine (glissé devant et de côté, m), bassin (glissé, bascule, hanche qui remonte, rotation).
  Fonction périodique de `isolationBeats(id)` temps (24, ou 32 pour les cercles marqués) ; `isolationStages(id)` donne
  la durée de chaque vitesse (`ISOLATION_SPEEDS` : 2, 1, ½ temps par mouvement), `isolationStage(id, temps)` la vitesse
  jouée. Les réglages (forme du huit, miroir) sont explicites ; `isolationSettings(essais)` lit le candidat du huit.
- `src/pose.ts` : option `isolation` de `applyPose`. Quand elle est donnée : aucun style appliqué (ni balancement, ni
  rebond, ni pas), pieds à leur place de repos, posture neutre (buste droit, genoux souples), poids moitié-moitié. Le
  bassin reçoit son glissé et ses rotations avant le solveur des jambes. **Après** le solveur, la colonne et la cage sont
  posées exactement : la cage à sa place de repos plus son glissé, droite et de face, la colonne de la base (portée par le
  bassin) à la cage ; la tête tourne en haut du cou et penche ou hoche autour de la base du cou (le nœud de la tête se
  déplace en conséquence). Le verrou d'isolation (`lockUpperTrunk`) n'efface donc rien : la pose exacte le remplace pour
  l'exercice.
- `src/App.tsx`, `src/components/Rig.tsx` : `isolation=` et `miroir=` lus dans l'adresse, transmis aux danseurs du
  mode seul et de la comparaison.

## Vérifications

- `scripts/test_isolations.mjs` (dans `npm test`) : sur le module pur (vingt et un exercices, trois vitesses, boucle fermée, continuité,
  marqué par le centre et lié sans, sens des cercles, inertie des réglages par défaut) et **sur le vrai GLB** avec
  `applyPose` : pieds immobiles et posés, seule la partie nommée bouge (positions monde du bassin, de la cage et de la
  tête, orientation de la cage), longueurs des jambes constantes, sommets osseux au-dessus du sol, sens réels (gauche du
  danseur = +x), dernière pose = première.
- `docs/features/isolations.feature` (Gherkin, dans `npm test`).
- GIF : `docs/elections/2026-11-24-isolations/` (les vingt et une boucles élues ; les candidats du vote dans `tour-1/`),
  avec les os et les muscles du haut du corps.

## Résultat mesuré (24 novembre 2026)

`node scripts/test_isolations.mjs`, à chaque huitième de temps des vingt et une boucles, danseur seul et danseur décalé et
tourné (comparaison) :

| Mesure | Résultat |
|---|---|
| Pieds (position et orientation) | immobiles à moins de 0,1 mm, semelles posées |
| Os sous le sol | aucun (tolérance 0,1 mm) |
| Longueurs des jambes | constantes à moins de 0,1 mm |
| Cage thoracique | à sa place plus son glissé à moins de 1 mm, droite et de face à moins de 0,01° |
| Tête hors exercices du cou | suit la cage, sans tourner ni pencher |
| Bassin hors exercices du bassin | immobile |
| Cage qui monte et descend | 2 à 5 mm (le glissé de la colonne) ; 13 mm avant que le bassin soit tenu à niveau |
| Plus grand déplacement en un huitième de temps | 3,0 cm (la poitrine en demi-cercle et le huit, au demi-temps : une vitesse, aucun saut) |
| Boucle | la pose de la fin (24 ou 32 temps) est celle du temps 0 |

Le module pur est vérifié pour le comportement élu, le huit qui tourne et le miroir : trois vitesses, boucle fermée, aucun saut (changements de vitesse et couture compris), seule
la partie nommée non nulle, marqué par le centre entre ses points et lié sans le centre aux trois vitesses, points tenus
à deux temps et à un temps et fluides au demi-temps, sens des cercles, demi-cercles par devant, miroir.

## Hors de ce lot

Filmer avec le pont et habiller chaque danseur de sa mascotte (L442), refaire les corps de Rémi et Corinne (L443),
l'app (L444, L445), la vue anatomique à côté de l'exercice (L446). Le texte d'attribution de BodyParts3D ne change pas
ici : une question de licence est ouverte du côté de ReCoDanse.
