# Spec — exercices sur la pointe des pieds, et lever-baisser les talons (#216)

Fil d'Ariane : [docs](./) › [spec des exercices d'isolation](spec-isolations.md) › **pointes et talons** · suite du
lot **L441** de ReCoDanse (fiche 111, exercices montrés par les mascottes)

## Objectif

Deux demandes du fondateur, le 25 novembre 2026, sur les exercices d'isolation (#206) :

1. une **variante de chaque exercice sur la pointe des pieds** ;
2. un **exercice nouveau : lever et baisser les talons**, pour travailler les mollets et l'équilibre.

Sans les nouveaux paramètres, rien ne change.

## Adresse

| Paramètre | Effet |
|---|---|
| `isolation=<exercice>&pointes=1` | l'exercice sur la pointe des pieds : les deux talons levés et tenus toute la boucle |
| `isolation=talons` | l'exercice des talons : les deux talons montent et descendent ensemble |

`pointes=1` ne change rien sans `isolation=`, ni dans l'exercice des talons (qui monte et descend de lui-même).

## Règles du mouvement

- **L'avant du pied reste posé et immobile** ; le pied tourne autour de lui quand le talon monte. Le poids reste sur les
  deux pieds.
- **Sur la pointe des pieds**, les talons montent au départ et restent levés toute la boucle : le bassin monte d'autant,
  et seule la partie nommée bouge, comme à plat (le bassin tenu à niveau, la cage droite, la tête qui suit la cage).
- **L'exercice des talons** : les talons montent et descendent ensemble ; tout le corps monte et descend d'un bloc
  au-dessus des chevilles, les genoux gardent leur flexion (rien ne plie ni ne se tend pour monter). « En haut sur 1 »
  : arrivé en haut sur le temps 1.
- **Les genoux gardent la flexion minimale** de toutes les danses (règle R43, #203).
- **Le pied du squelette est d'un seul bloc** (pas d'articulation des orteils) : talon levé, il tient sur le bout des
  orteils, l'avant-pied un peu au-dessus du sol (1 cm un peu, 2 cm à mi-hauteur). C'est peu visible jusqu'à
  mi-hauteur ; plus haut, on verrait une pointe de ballet. Monter plus haut demande des orteils qui plient : hors de ce
  lot. L'avant-pied reste immobile à l'horizontale.

## Élu le 25 novembre 2026 (tour 17, [dossier](elections/2026-11-25-pointes-talons/README.md))

| Question | Élu (A, la proposition) | Écarté (B) |
|---|---|---|
| Jusqu'où montent les talons (sur pointes et dans l'exercice des talons) | **à mi-hauteur** | un peu |
| Le rythme de l'exercice des talons | **les trois vitesses des autres exercices** : deux temps, un temps, un demi-temps par mouvement (monter ou descendre), le point posé puis tenu, fluide au demi-temps | en haut sur 1, tenu jusqu'au 3, en bas sur 4 |
| Les films sur la pointe des pieds et de l'exercice des talons | conviennent | — |

Le choix élu est le comportement ; les interrupteurs `essai=talonsBas` et `essai=talonsTenue` qui filmaient l'autre
candidat sont retirés.

Hauteur du modèle (mesure de spec, jamais montrée au danseur), sur le pied du GLB (22 cm) : à mi-hauteur, le pied tourne
de 25°, le talon est à 9 cm du sol, la cheville monte de 6,5 cm. (Le candidat écarté : 15°, 6 cm, 4 cm.)

## Moteur

- `src/isolations.ts` (pur) : l'exercice `talons` (code T1, famille `pieds`, forme à deux points : en haut, à plat) ; la
  pose porte `heel` (rad, rotation du pied, talon levé ; `ISOLATION_HEEL`, mi-hauteur) ; réglage `pointes`.
- `src/pose.ts` : pendant un exercice, chaque pied porte `heel` comme rotation autour de son avant-pied (le pied roulé de
  #49 : `pitch`, pivot sur l'avant-pied, la cheville porte le bassin). Le niveau du bassin tenu sur la boucle se mesure
  sans la montée des chevilles, puis la reçoit : le corps monte et descend avec les talons, et seulement avec eux.
- `src/App.tsx` : `pointes=` lu dans l'adresse, transmis aux danseurs du mode seul et de la comparaison.

## Vérifications

- `scripts/test_isolations.mjs` (dans `npm test`) : module pur (talons à plat sans `pointes`, tenus avec, chemin de
  l'exercice des talons aux trois vitesses, plus de candidat dans les essais) ; vrai GLB : avant-pieds
  immobiles et posés, talons à la hauteur demandée, os au-dessus du sol, longueurs des jambes, seule la partie nommée
  bouge (sur pointes), le corps monte d'un bloc avec les chevilles (talons), boucle fermée, aucun saut.
- `docs/features/pointes-talons.feature` (Gherkin, dans `npm test`).
- Films : `docs/elections/2026-11-25-pointes-talons/`.

## Résultat mesuré (25 novembre 2026)

`node scripts/test_isolations.mjs`, danseur seul et danseur décalé et tourné (comparaison), à mi-hauteur :

| Mesure | Résultat |
|---|---|
| Avant-pieds (à l'horizontale) | immobiles à moins de 0,1 mm ; semelles posées ; os au-dessus du sol |
| Sur la pointe des pieds | chaque exercice monté d'un bloc de 6,5 cm (bassin, cage, tête : même place, même orientation qu'à plat, écart de moins de 0,1 mm sur la boucle) ; talons à 9 cm du sol |
| Exercice des talons | le corps monte de 6,5 cm d'un bloc, sans glisser ni tourner ; à plat, le bassin revient à sa place (moins de 1 mm) ; au plus 2,6 cm en un huitième de temps (le demi-temps) |
| Boucle | la pose de la fin (24 temps) est celle du temps 0 |
