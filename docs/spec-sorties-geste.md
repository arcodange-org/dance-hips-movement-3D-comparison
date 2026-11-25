# Spec — Sorties : la hanche porte le pas, un seul geste (#213, #214)

Issues : #213 (sortie garçon), #214 (sortie fille). Règle **R45** ([règles](regles-proprietaire.md)) : le ginga se fond
dans le mouvement ; le mouvement de la hanche porte le pas au lieu de le suivre. Lecture élue le 25 novembre pour le
« 1 2 » (page de vote, seizième tour, question 32 : **la hanche d'abord**, [spec](spec-un-deux-geste.md), #209) ; elle
s'applique ici aux deux sorties.

## La règle appliquée aux sorties

Le bassin part vers le pas suivant avant que le pied ne quitte le sol, et le pied suit le chemin du bassin : on ne voit
plus un pied posé, puis le corps qui le rejoint. Ce qui ne change pas :

- où se posent les pieds, où se tient le bassin à chaque appui, et l'instant où chaque pied se pose (calibrés contre
  les jambes du partenaire : D1 de la suiveuse posé tôt pour dégager le G1 du guideur, crochet, D4 qui attend le G4…) ;
- le transfert du poids (R21 : le poids arrive sur le temps) ;
- les contraintes des figures : aucun croisement des os des jambes, semelles disjointes, pied porteur immobile, R22
  (le pas du guideur égale le recul qu'il provoque), R24 (la suiveuse ne part jamais avant le guideur : son bassin part
  avec celui du guideur), la virgula (#127), le contact des cuisses D/D.

## Mise en œuvre

Module pur `src/gesteHanche.ts` (`FIGURE_GESTURE`, défaut `hancheDabord`) :

- `head` = 0,3 temps : le chemin du bassin vers chaque appui commence ce temps-là avant que le pied ne parte (au premier
  pas, au début de la figure) et finit sur le temps, comme avant. Les chemins de deux actions se recouvrent : le
  bassin ne s'arrête plus entre deux pas (somme des chemins, continue et sans à-coup) ;
- `follow` = 1 : entre son départ et sa pose, le pied avance au rythme du bassin (`followWay`) au lieu de sa propre
  course, plus rapide au début ; les détours (crochet, contournement du genou de la suiveuse) restent les mêmes.

Deux réglages mesurés sur le GLB :

- sortie garçon, croisé (action 3) : les bassins ne prennent que la moitié de l'avance (`SORTIE_GARCON_CROSS_HEAD`,
  0,15 temps). Plus tôt, le D3 de la suiveuse qui quitte le contact D/D amène son fémur droit contre celui du guideur
  pendant que son G3 croise (suave, avec le ginga du mode jeu) ;
- sortie fille, D3 de la suiveuse : son bassin n'attend plus qu'un dixième de temps sur son G (un quart avant), avant
  l'avance de hanche. Attendre plus longtemps ramasse son chemin et son balancement de côté en un à-coup (R34).

Essai écarté : poser chaque pied plus tard (à 0,85 du temps, comme le « 1 2 » élu). Le D1 de la suiveuse, posé tôt pour
dégager le G1 du guideur, et les pas calibrés contre les jambes du partenaire se chevauchaient alors en mode jeu.

`?geste=ancien` montre l'ancien calendrier (`head` = `follow` = 0, identique au bit près à la version d'avant).

## Mesures

`scripts/sonde_geste_hanche.mjs` (kizomba, amplitude 1, quinconce ; mesure partagée `scripts/geste_hanche_mesure.mjs`),
fenêtre ouverte 0,3 temps avant le départ du pied (`AVANT=0.3`) et fermée 0,15 temps après sa pose (`APRES=0.15`), pour
voir un bassin qui part avant le pied. Décalage : le bassin arrive à mi-chemin ce temps-là après le pied ; pied fait :
la part de son trajet quand le bassin a fait un dixième du sien.

| Pas | avant (décalage ; pied fait) | après |
|---|---|---|
| sortie garçon, guideur G1 | 0,13 ; 19 % | 0,06 ; 1 % |
| sortie garçon, guideur G3 (croisé) | 0,13 ; 28 % | 0 ; 1 % |
| sortie garçon, guideur D4 | 0,13 ; 30 % (0,19 ; 41 % à droite) | 0 ; 0 % |
| sortie garçon, suiveuse D1 | 0,25 ; **77 %** | 0,09 ; 1 % |
| sortie garçon, suiveuse D3 | 0,13 ; 19 % | 0,03 ; 0 % |
| sortie fille (crochet), guideur G1 (virgula) | 0,16 ; 23 % | 0,06 ; 1 % |
| sortie fille (crochet), guideur D2 (crochet) | 0,16 ; 1 % | 0 ; 0 % |
| sortie fille (crochet), guideur D4 | 0,16 ; **44 %** | 0 ; 0 % |
| sortie fille (crochet), suiveuse D1 | 0,13 ; 22 % | 0,03 ; 1 % |
| sortie fille (crochet), suiveuse G2 | 0,19 ; **75 %** | 0,06 ; 0 % |
| sortie fille (recul), guideur G1 | 0,13 ; 17 % | 0,03 ; 0 % |
| sortie fille (recul), guideur D4 | 0,16 ; 5 % | 0 ; 0 % |
| sortie fille (recul), suiveuse G2 | 0,19 ; **75 %** | 0,03 ; 0 % |

Les autres pas portés étaient déjà d'un seul geste et le restent. Avec la fenêtre de l'issue (`AVANT=0`, `APRES=0.5`),
les mêmes pas étaient à 0,22 à 0,34 temps et jusqu'à 86 %. Après : sur les 29 pas portés des deux sorties (quatre
variantes), le bassin arrive à mi-chemin au plus 0,09 temps après le pied, et le pied a fait au plus 1 % de son trajet
quand le bassin part. La marque (action 5) n'est pas un pas porté.

Ce qui change aussi, à l'œil : dans la sortie fille, le contact des cuisses D/D arrive un peu avant le temps 3 (2,91 en
crochet, 2,86 en recul), les corps arrivant avant le pied.

## Contrôles

- `scripts/test_geste_sorties.mjs` (dans `npm test`) : la mesure ci-dessus sur chaque pas porté des deux sorties,
  décalage au plus 0,1 temps et pied fait au plus 5 % ; avec `ancien`, la même mesure trouve 21 pas « pied puis
  hanche ».
- Contrôles des sorties repris sans changer leurs seuils (croisements d'os, semelles, pied porteur immobile, appuis,
  R22, R24, virgula, contact D/D, mode jeu avec le ginga, allers-retours insérés). Ceux qui lisaient un instant du
  calendrier d'avant le cherchent maintenant : le coin du crochet par dichotomie (le dernier instant où le pied est sur
  sa ligne de départ), le contact D/D de la sortie fille au premier toucher des cuisses avant le temps 3, la fenêtre où
  la sortie garçon est identique d'un placement à l'autre jusqu'au départ du bassin vers la fin neutre. À l'arrivée D/D
  de la sortie fille, le bassin a déjà fait jusqu'à un cinquième de son chemin vers la fin neutre, qui porte le décalage
  du placement : les bassins des placements y diffèrent d'autant, les chevilles restent exactes.
- Empreintes historiques de la sortie garçon (`scripts/fixtures/sorties-historiques.json`, `WRITE=1` de
  `scripts/test_sortie_garcon.mjs`) et mesures enregistrées reprises.

Films avant / après, vus de derrière le guideur, muscles visibles : [dossier](elections/sorties-geste/README.md).

## Hors périmètre

- La virgula du quart de tour (#208).
- Le combiné historique `sortieGF`.
