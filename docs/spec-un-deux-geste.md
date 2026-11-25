# Spec — « 1 2 » : le ginga de la hanche porte le pas de côté, un seul geste (#209)

Issue : #209. Figure : [le pas de base « 1 2 »](spec-pas-de-base-1-2.md) (#196, R42). Règle du propriétaire du
24 novembre 2026, ajoutée aux [règles](regles-proprietaire.md) : **R45, le ginga se fond dans le mouvement**.

## La règle

Dans le « 1 2 », le mouvement de la hanche en ginga engage assez le fessier et le reste de la jambe pour produire à lui
seul l'écart du pas de côté. On ne doit pas voir deux actions, le pas puis la hanche, mais un seul geste. C'est la règle
de presque tous les mouvements, pas seulement du « 1 2 ».

À garder (élu le 24 novembre) : l'écart de 28 cm, la hanche plus douce de la kizomba, celle du pas élu du semba, le poids
entier sur la jambe écartée aux comptes 1 et 2. À concilier : au kompa, le propriétaire a élu une hanche qui **finit** le
transfert du poids (tours 6 et 7, [élection](elections/ginga-huit.md)) ; ici, la hanche **porte** le pas.

## Le modèle aujourd'hui

Mesuré sur le GLB, danseur seul, au soixante-quatrième de temps (`scripts/mesure_un_deux_geste.mjs`). Le pied gauche
quitte sa marque au temps 3,05 de l'horloge et se pose à 3,5 ; le corps est porté d'une place à l'autre pendant tout le
temps (de 3 à 4) ; le poids passe de 3,5 à 4.

| | Kizomba | Semba |
|---|---|---|
| Pied à mi-chemin | 3,28 | 3,28 |
| Bassin à mi-chemin | 3,58 | 3,59 |
| **Décalage** | **0,30 temps** | **0,31 temps** |
| Trajet du pied fait quand le bassin a fait un dixième du sien | **57 %** | **62 %** |
| Genou de la jambe qui s'écarte | 40° à 59° | 39° à 59° |

Le pied part seul et se pose ; le bassin fait l'essentiel de son chemin ensuite. À la marque, le pied qui rejoint
voyage de 0,2 à 0,72 pendant que le bassin fait son petit rond sur place.

## Les candidats (prototype, `?geste=<nom>`, rien ne change sans le paramètre)

Trois lectures du même geste, dans `src/umDois.ts` (`UM_DOIS_GESTURES`) :

- `land` : quand le pied se pose dans le temps du pas (aujourd'hui 0,5) ; le poids passe ensuite, jusqu'au compte ;
- `lead` : de combien le corps part avant le temps du pas (aujourd'hui 0) ;
- `follow` : le pied suit le chemin du bassin, balancement de la hanche compris (1), au lieu de sa propre course rapide
  (0, aujourd'hui) ;
- `join` : la fenêtre où l'autre pied rejoint pour la marque (aujourd'hui 3,1 à 3,8 temps après la marque du pied ; 3 à
  3,95 dans les trois candidats : il rejoint pendant tout le petit rond).

| Candidat | Ce qu'on voit | `land` | `lead` | `follow` |
|---|---|---|---|---|
| A `hancheFinit` | Pied et bassin partent ensemble ; le pied se pose tôt, la hanche finit le transfert (la lecture du kompa) | 0,6 | 0 | 0,5 |
| B `ensemble` | Un seul geste : le pied va avec le bassin et se pose juste avant que le poids arrive | 0,8 | 0 | 1 |
| C `hancheDabord` | La hanche part la première (un tiers de temps avant) et emmène la jambe | 0,85 | 0,3 | 1 |

Mesures (le pas de côté de la jambe gauche, temps 3 à 4) :

| Candidat | Décalage, kizomba / semba | Pied fait quand le bassin part | Genou de la jambe qui s'écarte | Le poids passe |
|---|---|---|---|---|
| aujourd'hui | 0,30 / 0,31 temps | 57 % / 62 % | 40° à 59° | de 3,5 à 4 |
| A `hancheFinit` | 0,19 / 0,20 | 27 % / 29 % | 44° à 59° | de 3,6 à 4 |
| B `ensemble` | 0,05 / 0,06 | 5 % / 5 % | 51° à 59° | de 3,8 à 4 |
| C `hancheDabord` | 0,03 / 0,03 | 2 % / 3 % | 52° à 59° | de 3,85 à 4 |

Les trois candidats passent `scripts/test_um_dois.mjs` (pieds au sol, pied qui ne bouge que sans poids, marque sans
poids, os de longueur constante, accélération du bassin, hauteur du bassin, aucun saut d'articulation). Dans A, le pied
qui suivrait entièrement le bassin et se poserait à 0,6 ferait un saut de 3,6 cm en un trente-deuxième de temps : il suit
le bassin à moitié.

## Les autres figures (relevé de R45)

`scripts/sonde_geste_hanche.mjs` : dans chaque pas des figures (pied qui voyage d'au moins 8 cm), quand le pied et le
bassin arrivent à mi-chemin, et quelle part de son trajet le pied a faite quand le bassin part. Kizomba, amplitude 1,
quinconce. Un pas se fait « pied puis hanche » quand le pied a fait au moins la moitié de son trajet avant que le bassin
ne parte, ou que le bassin arrive à mi-chemin un quart de temps ou plus après lui.

| Figure | Pas « pied puis hanche » (décalage ; pied fait quand le bassin part) | Suite |
|---|---|---|
| « 1 2 » seul | pas de côté, kizomba et semba (0,31 ; 52 à 62 %) | ce chantier |
| Quart de tour en couple | la virgula du guideur (0,19 ; 70 %) | #208 (la virgula avance, la rotation s'adoucit) |
| Sortie garçon | guideur G1 (0,25 ; 27 %), suiveuse D1 (0,31 ; 77 %), suiveuse G2 (0,28 ; 63 %) | #213 |
| Sortie fille | suiveuse G2 (0,31 ; 86 %, les deux variantes), guideur D4 (0,25), en recul guideur G3 (0,34) et suiveuse D3 (0,25 ; 52 %) | #214 |
| Ida e volta en couple | aucun : le bassin part avec le pied ou avant lui | — |
| Marche (avance, recule, double) | aucun (décalage de 0,22 au plus, pied fait 44 % au plus) | — |
| Sur place en couple | pas de pas de plus de 8 cm | — |

## À vérifier une fois élu

- `scripts/test_um_dois.mjs` avec la version élue par défaut ; R21 (le poids arrive sur le temps) et R34 (ni saccade, ni
  relais soudain : le poids passe plus vite quand le pied se pose plus tard, à vérifier à l'œil et dans les mesures).
- Les comptes 1 et 2 gardent le poids entier sur la jambe écartée ; l'écart reste 28 cm.
- Les films du pas de base (#155) sont refaits quand c'est dans `main`.

## Hors périmètre

- Les sorties : #213 (sortie garçon), #214 (sortie fille).
- La virgula du quart de tour : #208.
