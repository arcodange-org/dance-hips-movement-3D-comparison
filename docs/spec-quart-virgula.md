# Spec — quart de tour en couple : la virgula avance, la rotation s'accélère moins vite (#208)

Issue : #208. Figure : [quarts de tour en paire, spec #37](spec-quarts-paire.md). Règle du propriétaire du 24 novembre
2026, après un cours ; à ajouter à [`regles-proprietaire.md`](regles-proprietaire.md) une fois les candidats élus.

## La règle

Le quart de tour en couple est trop rapide. Au premier pas du guideur, la **virgula** (pied gauche posé en travers)
**avance** : elle se pose un peu au-delà du bout du pied droit, et fait reculer la suiveuse d'environ **la longueur
d'un pied**. La rotation ne part donc pas d'un coup : elle s'accélère plus doucement.

Réponse du propriétaire à la question de l'issue : la virgula de la sortie fille (#127) fait déjà reculer la
suiveuse et avancer le guideur ; c'est la référence. Celle de l'ida e volta relève de l'issue #210.

## Le modèle aujourd'hui

Mesuré sur le GLB, kizomba, quinconce, amplitude 1, premier quart (les autres s'en déduisent par rotation),
`scripts/mesure_quart_virgula.mjs` :

- **Virgula** : le talon du G du guideur se pose 2,3 cm au-delà du bout de son D (cheville 20 cm devant la cheville
  D) ; le G avance de 25 cm. Le quart est une rotation rigide du couple autour du centre C qui découle de cette pose
  (`QUARTS_HEEL_AT_TOE`).
- **Suiveuse** : son D recule jusqu'à 36,5 cm, puis revient en tournant autour de C ; à la pose, il n'est que 2,3 cm
  en arrière de son départ.
- **Rotation des bassins** : la moitié du quart (45°) sur les 60 derniers pour cent du vol du premier pied (temps
  0,64 à 1), jusqu'à 182 à 191° par temps, puis un **arrêt net à la pose** (1 900° par temps² au temps 1).
  Vitesse moyenne par quart de temps, guideur : 5 2 38 135 −5 −1 1 5 17 75 75 13 −5 −2 2 5.

Dans ce modèle rigide, le D de la suiveuse se pose **en arrière d'autant que le talon de la virgula dépasse le bout du
D** : 2,3 cm aujourd'hui. Pour qu'elle recule d'une longueur de pied (21 cm), le talon doit dépasser de 21 cm.

## Les candidats (prototype, `?quart=<nom>`, rien ne change sans le paramètre)

Deux choix, indépendants :

1. **Jusqu'où va la virgula** (`beyond`, centimètres de plus qu'aujourd'hui), la rotation adoucie dans les trois cas :
   `plus5`, `plus10`, `unPied`.
2. **Quelle part de la rotation pendant l'avancée** (`turn`), la virgula à 10 cm de plus :
   - `diagonale` (`plus10`) : le bloc (bassin et buste) fait son demi-quart sur tout le vol du premier pied, en
     accélérant et ralentissant en douceur ; la diagonale est atteinte à la pose, comme le veut #106 ;
   - `apres` : le demi-quart se termine 0,4 temps après la pose (le bloc rattrape le pied pendant que le poids
     s'installe).

Mesures (kizomba, quinconce, amplitude 1, premier quart ; lacet des bassins, guideur / suiveuse) :

| Candidat | Talon au-delà du bout du D | G du guideur avance | D de la suiveuse recule (à la pose ; au plus) | Vitesse max (°/temps) | Accélération max (°/temps²) | Rotation à la pose |
|---|---|---|---|---|---|---|
| aujourd'hui | 2,3 cm | 25 cm | 2,3 ; 36,5 cm | 182 / 191 | 1 903 / 1 902 | 45° |
| `plus5` | 7,3 cm | 30 cm | 7,3 ; 37,7 cm | 140 / 143 | 815 / 1 134 | 45° |
| `plus10` | 12,3 cm | 35 cm | 12,3 ; 39,2 cm | 140 / 143 | 815 / 1 134 | 45° |
| `unPied` | 21,3 cm | 44 cm | 21,3 ; 42,2 cm | 140 / 143 | 815 / 1 134 | 45° |
| `apres` (virgula de `plus10`) | 12,3 cm | 35 cm | 12,3 ; 39,2 cm | 79 / 89 | 411 / 641 | 31° |

Vitesse moyenne par quart de temps, guideur : `plus10` 5 8 109 58 −5 −1 1 13 57 76 41 −1 −5 −2 2 5 ;
`apres` 5 4 39 76 47 4 1 13 57 76 41 −1 −5 −2 2 5.

### Précision du 25 novembre : pas de pivot au premier pas

Le propriétaire précise la correction : pas d'accélération de pivot dès le premier pas ; la rotation est progressive
entre le premier pas (qui avance et fait reculer la suiveuse) et le deuxième. D et E tournent encore beaucoup au premier
pas (45° et 31° à sa pose) : la règle #106 (le bloc fait un huitième de tour avec le premier pied, la diagonale à sa
pose) est à revoir pour le quart. Deux lectures, la virgula de `plus10` (`turn`) :

- `progressif` : le bloc fait tout le quart d'une seule courbe douce, du départ du premier pied à la pose du second ; il
  est presque de face quand le premier pied se pose ;
- `entreLesPas` : le premier pas ne fait qu'avancer ; le bloc tourne de la pose du premier pied à celle du second.

| Candidat | Rotation à la pose du premier pied | Vitesse max (°/temps) | Accélération max (°/temps²) |
|---|---|---|---|
| D `plus10` (diagonale) | 45° | 140 / 143 | 815 / 1 134 |
| E `apres` | 31° | 79 / 89 | 411 / 641 |
| `progressif` | **8°** | 71 / 69 | 376 / 449 |
| `entreLesPas` | **0°** | 94 / 79 | 438 / 414 |

Vitesse moyenne par quart de temps, guideur : `progressif` 5 2 6 21 41 60 68 68 54 32 9 −4 −5 −2 2 5 ;
`entreLesPas` 5 2 −2 −5 2 35 69 92 87 58 20 −3 −5 −2 2 5. Les accélérations les plus fortes de ces deux candidats
viennent du balancement du style au temps 0,53, pas de la rotation. Os croisés : `progressif` 116 poses sur 288 en
quinconce, 14 face à face ; `entreLesPas` 133 et 100 (à régler sur la version élue, comme les autres). La question 30 de la
page de vote est refaite avec ces deux lectures ; D et E en sont retirées.

**Ce qui n'est pas encore réglé.** Les candidats déplacent les pieds et le moment où les corps tournent : les os des
jambes se croisent de nouveau (80 à 117 poses sur 288 en quinconce, 14 à 49 face à face ; 0 aujourd'hui,
`scripts/sonde_croisements_couple.mjs`). Comme pour le minimum de flexion (#203), le candidat élu sera réglé (trajets
des pieds, moments de départ, adoucissement au croisement) et contrôlé avant de devenir la figure par défaut.

## À vérifier une fois élu (tests sur le GLB réel, `scripts/test_quarts_paire.mjs`)

- Contraintes de la spec #37 inchangées : fin de chaque quart égale au départ tourné d'un quart autour de C, retour au
  départ après quatre quarts, quinconce retrouvé ; enveloppes des pieds disjointes ; pied porteur immobile ; cibles
  atteintes ; aucun croisement des os des jambes (six styles, amplitudes 0,5 à 2, quinconce et face à face, plexus).
- Lacet des bassins : vitesse et accélération maximales mesurées avant et après (ces tableaux), sans arrêt net, sans
  pivot au premier pas (25 novembre).
- La règle #106 (spec #37, `regles-proprietaire.md`) réécrite pour le quart selon la lecture élue.
- Saccades (R34, `scripts/fixtures/saccades.json`) reprises si les mesures changent.
- La virgula de la sortie fille (#127) reste la référence : le guideur avance, la suiveuse recule.

## Hors périmètre

- L'ida e volta (#210) et le « 1 2 » (#209), chantiers distincts.
- Le cadre des bras pendant le tour.
