# Spec — le pied pivote sur la plante, les orteils restent à plat (#225)

Fil d'Ariane : [docs](./) › [spec des exercices d'isolation](spec-isolations.md) › [pointes et talons](spec-pointes-talons.md) ›
**le pied sur la plante** · suite du lot **L441** de ReCoDanse (fiche 111, exercices montrés par les mascottes)

## Objectif

Dans #216, le pied du squelette est d'un seul bloc. Quand le talon monte, il bascule en entier et tient sur le bout
des orteils : l'avant du pied quitte le sol (1 cm un peu, 2 cm à mi-hauteur). Monter plus haut ressemblerait à une
pointe de ballet. Dans le pont des mascottes, les orteils plient pour rester à plat, mais la base des orteils flotte
au-dessus du sol, parce que le pied du moteur tient sur le bout des orteils.

Ce lot fait pivoter le pied sur la plante, autour de la ligne de la base des orteils. Le talon monte, les orteils
restent posés et à plat, la plante reste au sol. Sans `pointes=1` et hors des exercices, rien ne change.

## Le pied du GLB

`public/anatomy.glb` range les 26 os du pied dans un seul maillage, `Foot_R` / `Foot_L`, sous la cheville
(`AnklePivot_R` / `AnklePivot_L`). Chaque os y reste un **îlot** : aucune arête ne relie deux os. On compte 27 îlots par
pied : 7 os du tarse, 5 métatarsiens, 14 phalanges, et un îlot dégénéré (ses sommets sont confondus en un point,
parmi les orteils). Le GLB ne contient aucun muscle du pied : les muscles de la jambe suivent le genou, et
l'avant du pied n'a pas de partie molle à séparer dans le moteur.

Le long de l'axe du pied (du talon vers l'avant-pied, `toeOut`, 25° vers l'extérieur), les phalanges commencent entre
68 % et 94 % de la longueur du pied, les métatarsiens et le tarse avant 48 %. **Règle** : un îlot qui commence dans les
40 % avant du pied est un os des orteils. Il n'y a ni pesée ni seuil fragile, et les os restent rigides.

Mesures de spec, jamais montrées au danseur :

| Mesure (pied droit ; le gauche à 1 mm près) | Valeur |
|---|---|
| Longueur du pied | 22 cm |
| Fin des métatarsiens, du 1er au 5e, le long de l'axe | 11,3 · 11,8 · 11,6 · 11,0 · 10,1 cm |
| Début des phalanges proximales | 10,8 · 11,6 · 11,3 · 10,8 · 9,8 cm |
| Tête des métatarsiens, du dessous au dessus | 1,4 à 1,9 cm de haut |
| Inclinaison du 1er métatarsien sur le sol | 29° |
| Inclinaison de la phalange proximale du gros orteil | 11° (pied droit), 6° (pied gauche) |
| Extension du gros orteil au repos (différence des deux) | 18° (droit), 22° (gauche) |

## L'articulation des orteils

- **Le nœud** `ToePivot_R` / `ToePivot_L`, enfant de la cheville, porte le maillage `Toes_R` / `Toes_L` (les
  phalanges) ; `Foot_R` / `Foot_L` garde le tarse et les métatarsiens. Au repos, les deux maillages réunis sont le pied
  d'origine, sommet pour sommet. La semelle mesurée sur la cheville (`solePoints`, et `semelle` dans le pont) ne change
  donc pas. La découpe se fait au chargement (`articulateToes`, `src/orteils.ts`), sur une copie des géométries : le GLB
  ne change pas, ni sa quantification.
- **La ligne de pli** est horizontale et perpendiculaire à l'axe du pied : c'est l'axe de roulis du pied roulé de #49
  (`rollAxis`). Elle passe par le **centre de la tête du métatarsien le plus avancé** (le 2e), à mi-hauteur de sa tête
  et à une demi-hauteur en arrière de son bout : 11 cm le long de l'axe, 12 mm au-dessus du sol. La tête est ronde
  autour de ce centre, donc rien du pied ne passe sous le sol quand il pivote. C'est vérifié jusqu'à 80°, et à
  chaque pose dans les tests.
- **Une ligne pour les cinq orteils.** Une ligne transverse ne fait pas tourner le pied vers l'intérieur ou l'extérieur
  (pas de pied « en faucille »). Le danseur monte sur les têtes du 1er et du 2e métatarsien. Les têtes du 4e et du 5e
  sont un peu en arrière de la ligne : elles montent un peu avec le talon, et leurs orteils restent à plat. L'écart
  à la base du petit orteil est mesuré et écrit plus bas.

## Le mouvement

- Quand le talon monte de θ (rotation du pied autour de la ligne de pli), les orteils plient de θ en sens inverse :
  ils gardent leur orientation à plat et leur place. La ligne de pli ne bouge pas, ni en hauteur ni à l'horizontale.
  La cheville monte et avance d'autant, et le corps monte d'un bloc avec elle (#216).
- **Le pli des orteils est limité** à une demi-pointe de danseur : le gros orteil s'étend d'au plus **90°** par
  rapport à son métatarsien. C'est la valeur que demande la demi-pointe en danse (contre 60 à 65° hors des danseurs) :
  [Physiopedia, biomécanique du pied du danseur](https://www.physio-pedia.com/Biomechanics_of_the_Dancer%E2%80%99s_Ankle_and_Foot),
  [AAU, étude de danseurs de ballet](https://projekter.aau.dk/projekter/files/334639504/10203_Article.pdf),
  [HMP, podologie du danseur](https://www.hmpgloballearningnetwork.com/site/podiatry/article/7212).
  Au repos, le gros orteil du GLB est déjà étendu de 18 à 22°, donc le pli maximal est de 90° moins l'extension au
  repos : **70°** (`toeFoldMax`, mesuré par pied). Au-delà, les orteils ne plient plus et tournent avec le pied, qui
  tient alors sur le bout des orteils. Aucun exercice ne va jusque-là.
- **La demi-pointe complète**, c'est la cheville à l'aplomb de la plante, le poids sur la ligne de pli. Le pied
  bascule alors de 69°, juste sous la limite des orteils : les deux définitions concordent.

Hauteurs mesurées sur le GLB (talon : le dessous du talon ; cheville : sa montée depuis le pied à plat) :

| Bascule du pied | Talon | Cheville | Remarque |
|---|---|---|---|
| 25° | 7,1 cm | +4,6 cm | **mi-hauteur** (élue le 25 novembre) : le talon à la moitié de sa hauteur en demi-pointe |
| 45° | 11,5 cm | +7,1 cm | trois quarts |
| 69° | 15,1 cm | +8,1 cm | demi-pointe complète, la cheville à l'aplomb de la plante |
| ancien pied d'un bloc, 25° | 9,0 cm | +6,6 cm | tenu sur le bout des orteils, l'avant-pied à 2 cm du sol |

La mi-hauteur reste la même bascule, 25°. Le talon paraît un peu plus bas qu'avant (7 cm au lieu de 9), parce que
l'avant du pied reste maintenant au sol. C'est la moitié de la hauteur qu'atteint le talon en demi-pointe complète.

## Où le moteur plie les orteils

- **Les exercices** (`isolation=`, sur pointes et l'exercice des talons) : le pied roulé de #216 pivote maintenant sur
  la ligne de pli (`pivot: "toes"`), et les orteils restent à plat.
- **Pas dans ce lot** : la marche roulée hors des figures (`src/gait.ts`, poussée du talon), le pied roulé des figures,
  du « 1 2 » et du mode jeu, ni le balancement du pied propre aux styles. Ils gardent le pied d'un bloc, avec un pli
  des orteils nul. Leurs réglages et leurs mesures enregistrées en dépendent : les à-coups du bassin (R34,
  `scripts/fixtures/saccades.json`), l'oracle, les poses finales. Les étendre est un autre lot, avec ses films.
- Un pli nul laisse le pied exactement comme avant : la pose est la même au bit près, et tous les autres tests restent
  verts sans changer leurs fixtures.

## Question ouverte, à élire

Maintenant que le talon peut monter plus haut sans que le pied tienne sur le bout des orteils, faut-il dépasser la
mi-hauteur élue au tour 17 ? Les candidats sont filmés, os et muscles visibles, sous `?essai=` (`src/essais.ts`).
Le dossier est dans `docs/elections/`. Rien ne change avant le vote : la mi-hauteur reste le comportement.

| Candidat | Bascule | Ce qu'on voit |
|---|---|---|
| A (le comportement actuel) | 25° | à mi-hauteur |
| B | 45° | aux trois quarts |
| C | 69° | tout en haut : demi-pointe complète, la cheville au-dessus de la plante |

## Moteur

- `src/orteils.ts` : `articulateToes(ankle, side)` (découpe en îlots, nœud `ToePivot_<côté>`, maillage `Toes_<côté>`,
  idempotente) ; `toeHinge` (la ligne de pli, mesurée sur les os) ; `TOE_EXTENSION_MAX` (90°).
- `src/pose.ts` : `bindSkeleton` articule les orteils (`r.toeR`, `r.toeL`) ; la jambe du modèle porte `hinge`,
  `rearSole`, `toeSole`, `toeFoldMax` ; le pied roulé prend un pivot `"toes"` : la ligne de pli reste en place, les
  orteils plient. La hauteur de la cheville se calcule sur les deux parties du pied.
- `src/anatomy.ts` : `resetRig` remet les orteils à plat.
- `src/components/Rig.tsx` : les orteils s'allument avec la chaîne d'appui (`appui=1`).

## Vérifications

- `scripts/test_orteils.mjs` (dans `npm test`) : la découpe sur le vrai GLB (14 phalanges et l'îlot dégénéré, union
  identique au pied d'origine, idempotente) ; la ligne de pli ; aucun os sous le sol jusqu'au pli maximal ; un pli nul
  ne change rien.
- `scripts/test_isolations.mjs` : sur pointes et dans l'exercice des talons, orteils posés, à plat et immobiles, plante
  au sol, talons à la hauteur voulue, os au-dessus du sol, longueurs des jambes, corps monté d'un bloc.
- `docs/features/pointes-talons.feature` : les scénarios des orteils.
- Films avant et après, os et muscles visibles (`haut=1&muscles=1`) : l'exercice des talons, et deux exercices sur
  pointes.

## Résultat mesuré

À remplir à la livraison.
