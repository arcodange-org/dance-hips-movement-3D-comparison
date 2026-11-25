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
- **Le pied du squelette est d'un seul bloc** (pas d'articulation des orteils). Jusqu'à mi-hauteur il se tient sur son
  avant-pied ; plus haut, il tiendrait sur le bout des orteils, comme une pointe de ballet. Monter plus haut demande des
  orteils qui plient : hors de ce lot.

## À élire (procédure des élections, films avant de figer)

| Question | Proposition (filmée) | Autre candidat (`essai=`) |
|---|---|---|
| Jusqu'où montent les talons (sur pointes et dans l'exercice des talons) | à mi-hauteur | `talonsBas` : un peu |
| Le rythme de l'exercice des talons | les trois vitesses des autres exercices : deux temps, un temps, un demi-temps par mouvement (monter ou descendre), le point posé puis tenu, fluide au demi-temps | `talonsTenue` : en haut sur 1, tenu jusqu'au 3, en bas sur 4 (l'équilibre se travaille dans la tenue) |

Hauteurs du modèle (mesures de spec, jamais montrées au danseur), sur le pied du GLB (22 cm) :

| Candidat | Rotation du pied | Talon au-dessus du sol | La cheville monte de |
|---|---|---|---|
| un peu | 15° | 6 cm | 4 cm |
| à mi-hauteur | 25° | 9 cm | 6,5 cm |

## Moteur

- `src/isolations.ts` (pur) : l'exercice `talons` (code T1, famille `pieds`, forme à deux points : en haut, à plat) ; la
  pose porte `heel` (rad, rotation du pied, talon levé) ; réglages `pointes`, `hauteur`, `talons` ; les candidats
  passent par `src/essais.ts`.
- `src/pose.ts` : pendant un exercice, chaque pied porte `heel` comme rotation autour de son avant-pied (le pied roulé de
  #49 : `pitch`, pivot sur l'avant-pied, la cheville porte le bassin). Le niveau du bassin tenu sur la boucle se mesure
  sans la montée des chevilles, puis la reçoit : le corps monte et descend avec les talons, et seulement avec eux.
- `src/App.tsx` : `pointes=` lu dans l'adresse, transmis aux danseurs du mode seul et de la comparaison.

## Vérifications

- `scripts/test_isolations.mjs` (dans `npm test`) : module pur (talons à plat sans `pointes`, tenus avec, chemin de
  l'exercice des talons aux trois vitesses et en tenue, candidats inertes sans `essai=`) ; vrai GLB : avant-pieds
  immobiles et posés, talons à la hauteur demandée, os au-dessus du sol, longueurs des jambes, seule la partie nommée
  bouge (sur pointes), le corps monte d'un bloc avec les chevilles (talons), boucle fermée, aucun saut.
- `docs/features/pointes-talons.feature` (Gherkin, dans `npm test`).
- Films : `docs/elections/2026-11-25-pointes-talons/`.
