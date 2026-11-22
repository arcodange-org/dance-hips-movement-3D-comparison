# Spec — transfert de poids continu : ni saccade, ni téléportation, ni relais soudain (#167)

[Accueil](../README.md) · [Règles du propriétaire](regles-proprietaire.md) (R34, R3, R23) ·
[Issue #167](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/167) ·
[Ginga du couple](spec-ginga-couple.md) (#157, #163) · [Marche naturelle](spec-marche-naturelle.md) ·
[Mode jeu](spec-jeu-file-auto.md)

## La règle (R34, 22 novembre 2026)

Le plus important dans le mouvement : ni saccade, ni téléportation, ni relais soudain entre la gauche et la
droite. La transition, c'est-à-dire le transfert de poids, est la source du déhanché et de la trajectoire
« en 8 ». Les changements de position brusques rendent les déplacements robotiques au lieu d'organiques.

## Ce que cela demande

1. **Aucun à-coup.** Le bassin ne fait jamais, en un instant, un déplacement sans rapport avec ce qu'il fait
   d'habitude.
2. **Aucun relais soudain.** Le bassin ne reste pas sur un appui pour passer brusquement sur l'autre : le
   passage occupe l'intervalle entre deux appuis.
3. **Le transfert d'abord.** Le déhanché et le « 8 » sont la trace de ce transfert. Leur forme et leur taille
   se choisissent ailleurs (élection de #159).

## Les mesures

Toutes sont prises sur le GLB, dans une séance du mode jeu (`planGuide`, `applyGuidePose`) : ce que le jeu
montre, frontières entre figures comprises.

- **À-coup** : le plus grand déplacement du bassin en un huitième de temps (83 ms à 90 bpm), en hauteur
  d'une part, à l'horizontale d'autre part. Le bassin est échantillonné tous les 1/32 de temps.
- **Passage d'un côté à l'autre** (`soudain`) : la vitesse de pointe du bassin d'un côté à l'autre, divisée
  par celle d'un balancier de même largeur et de même période. 1 = aussi progressif qu'un balancier ;
  2 = deux fois plus brusque.

## Constat (22 novembre 2026, `main` après #164)

### Les à-coups viennent des figures

Kizomba, démonstration `demo=ginga` et danse automatique de 64 temps. Déplacement habituel du bassin en un
huitième de temps (médiane) : 0,3 cm en hauteur, 0,5 à 1 cm à l'horizontale.

| Figure | Temps de la figure | Danseur | Déplacement du bassin en 1/8 de temps |
|---|---|---|---|
| Sortie garçon | 3,25 | suiveuse | **12,9 cm vers le haut** |
| Sortie fille | 1,31 | suiveuse | **10,5 cm en hauteur** |
| Quart de tour | 0,75 et 2,75 | les deux | **13 à 14 cm à l'horizontale** |
| Sortie garçon | 2,53 | suiveuse | 10,5 cm à l'horizontale |
| Sortie fille | 1,72 | suiveuse | 9,3 cm à l'horizontale |
| Double et marka | 0,38 | les deux | 9 cm à l'horizontale |
| Ida e volta | 1,03, 2,84, 4,84 | leader | 8 cm à l'horizontale |
| Avancer, reculer | 0,84 | les deux | 7,5 cm à l'horizontale |
| Sortie garçon | 0,5 | leader | 4,1 cm en hauteur |

- Ces à-coups sont les mêmes sans ginga (`ginga=sans`) et en semba.
- **Sortie garçon, suiveuse.** Ses pieds sont écartés de 45 cm d'avant en arrière ; le bassin est descendu
  à 73 cm pour que les jambes atteignent le sol (R3 : variation de hauteur de 14 à 17 cm dans les sorties).
  La descente prend plus d'une demi-temps. Quand le pied gauche se lève, le bassin remonte à 86 cm en un
  huitième de temps.
- **Avancer, suiveuse.** Le bassin fait 18 cm en deux temps, par à-coups : 4,5 cm, un arrêt d'un quart de
  temps, 8,9 cm en trois seizièmes de temps, un arrêt, 4,5 cm, puis une demi-temps immobile.
- Ce ne sont pas des sauts d'une image à l'autre : aux frontières entre figures le squelette est continu
  (`scripts/test_guidage.mjs`, moins de 0,2 mm). Ce sont des mouvements trop rapides, entre deux attentes.

### Le relais soudain

| | `soudain` | Le bassin traverse la moitié centrale de son trajet en |
|---|---|---|
| Couple, marche, ginga par défaut (`ample`) ou `marque` | **2,0** | 0,19 temps |
| Danseur seul : kizomba, semba, suave, tarraxinha, zouk | 1,0 | 0,34 temps |
| Danseur seul : kompa | 4,6 | 0,16 temps |
| Prototypes arrondis du « 8 » (#159, non fusionnés) | 1,0 | 0,34 temps |

- En couple, le bassin attend sur l'appui puis passe de l'autre côté deux fois plus brusquement qu'un
  balancier.
- Dans la marche, le poids passe d'un pied à l'autre en trois seizièmes de temps (125 ms à 90 bpm), juste
  avant le temps ; le bassin fait pendant ce court instant la moitié de son trajet.
- Dans une marche, les deux passages ne se ressemblent pas. Le premier se fait en une demi-temps, puis le
  bassin attend. Le second est coupé par la frontière entre deux figures : la phase du ginga repart
  « posée » à chaque figure, le jeu efface l'écart en un temps, et ce passage finit lentement.

### Lecture

Dans le modèle, le transfert de poids d'une figure tient dans une courte fenêtre : le bassin attend,
traverse vite, attend. La règle demande l'inverse : la transition occupe tout l'intervalle entre deux
appuis.

## Étapes

Chaque étape est une PR. Chacune garde les contrôles existants sur le GLB : os au-dessus du sol, semelles
disjointes, aucun croisement d'os, positions des allers-retours (`TOUCH_POSITIONS`), plexus, R21 (le poids
arrive sur le temps).

1. **Mesurer et verrouiller.** `scripts/test_saccades.mjs` mesure les à-coups de chaque figure du mode jeu
   et le passage d'un côté à l'autre dans la marche. L'état d'aujourd'hui est enregistré
   (`scripts/fixtures/saccades.json`) ; le test échoue si une figure fait pire. Aucun mouvement ne change.
2. **La hauteur du bassin.** La descente et la remontée s'étalent dans le temps. Les sorties d'abord
   (12,9 et 10,5 cm).
3. **Le trajet du bassin d'un appui à l'autre.** Continu sur toute la durée du pas : la marche d'abord, puis
   le quart de tour, les sorties, l'ida e volta.
4. **Le passage latéral du ginga calibré.** Aussi progressif qu'un balancier, et poursuivi d'une figure à la
   suivante.

## Avancement

| Étape | Figure | Avant | Après | PR |
|---|---|---|---|---|
| 3 | Avancer : bassin à l'horizontale, leader / suiveuse | 7,4 / 7,6 cm | **2,7 / 2,7 cm** | marche fluide |
| 3 | Reculer | 7,5 / 7,7 cm | **3,0 / 3,1 cm** | marche fluide |
| 3 | Double et marka | 9,0 / 9,0 cm | **5,6 / 5,7 cm** | marche fluide |

(Plus grand déplacement du bassin en un huitième de temps.)

**La marche.** Le poids passe d'un pied à l'autre dans le dernier cinquième du temps, pour arriver sur le
temps (R21). Le bassin suivait le poids : il faisait la moitié de son trajet à ce moment-là. Il voyage
maintenant pendant tout le pas, du départ du pied du leader jusqu'au temps, sur la même horloge pour les deux
danseurs. Sa place sur chaque temps ne change pas, ni les pieds, ni l'instant où le poids arrive.

Les seuils à atteindre ne sont pas fixés ici : ils le seront après la première correction, à l'œil. Le cliquet de l'étape 1 garantit seulement que rien n'empire.

## Ce que cette spec ne fait pas

- La forme, le sens et la taille du « 8 » : élection de #159 (PR #160).
- La posture (le buste au-dessus des genoux, légèrement devant) : #166.
- Le double rebond du semba : #162.
- Ces mesures ne valident pas la chorégraphie.
