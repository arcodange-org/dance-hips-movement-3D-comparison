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

**Ce qui n'est pas encore réglé.** Les candidats déplacent les pieds et le moment où les corps tournent : les os des
jambes se croisent de nouveau (80 à 117 poses sur 288 en quinconce, 14 à 49 face à face ; 0 aujourd'hui,
`scripts/sonde_croisements_couple.mjs`). Comme pour le minimum de flexion (#203), le candidat élu sera réglé (trajets
des pieds, moments de départ, adoucissement au croisement) et contrôlé avant de devenir la figure par défaut.

## À vérifier une fois élu (tests sur le GLB réel, `scripts/test_quarts_paire.mjs`)

- Contraintes de la spec #37 inchangées : fin de chaque quart égale au départ tourné d'un quart autour de C, retour au
  départ après quatre quarts, quinconce retrouvé ; enveloppes des pieds disjointes ; pied porteur immobile ; cibles
  atteintes ; aucun croisement des os des jambes (six styles, amplitudes 0,5 à 2, quinconce et face à face, plexus).
- Lacet des bassins : vitesse et accélération maximales mesurées avant et après (ce tableau), sans arrêt net.
- Saccades (R34, `scripts/fixtures/saccades.json`) reprises si les mesures changent.
- La virgula de la sortie fille (#127) reste la référence : le guideur avance, la suiveuse recule.

## Hors périmètre

- L'ida e volta (#210) et le « 1 2 » (#209), chantiers distincts.
- Le cadre des bras pendant le tour.
