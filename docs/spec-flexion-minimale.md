# Spec — jamais de jambe tendue : un minimum de flexion des deux genoux (#203)

Issue : #203. Règle du propriétaire : R43 ([`regles-proprietaire.md`](regles-proprietaire.md)), 24 novembre 2026.

## La règle

Dans toutes les danses du comparateur, aucune jambe ne se tend : les deux genoux gardent toujours un minimum de
flexion. Les danseurs sont donc un peu plus bas.

L'alternance « une jambe pliée, l'autre tendue » des tours de vote sur le kompa servait à montrer le mouvement ; la
jambe la moins pliée reste pliée.

## Ce que fait le modèle aujourd'hui

Flexion du genou, en degrés (0° : jambe tendue), mesurée sur le GLB, au seizième de temps sur seize temps :

| Style | Seul, sur place | Seul, en déplacement | Couple, sur place | Couple, figures |
|---|---|---|---|---|
| Kizomba | 33 à 46 | 29 à 67 | 22 à 30 | **7** (quart de tour) à 73 |
| Semba | 29 à 48 | 22 à 75 | 20 à 37 | **7** (quart de tour) à 73 |
| Kompa | 23 à 45 | 51 à 68 | 30 à 38 | 20 à 44 |
| Tarraxinha | 41 à 48 | 38 à 58 | 25 à 34 | 20 à 44 |
| Suave | 35 à 49 | 34 à 70 | 23 à 30 | **7** (quart de tour) à 74 |
| Zouk | **14** à 55 | 14 à 63 | 14 à 33 | **12** à 42 |

Le pas « 1 2 » (#196) : la jambe laissée en arrière descend à 17° (semba) et 20° (kizomba).

**Pourquoi.** La hauteur du bassin est donnée par la jambe qui atteint le moins haut (`src/pose.ts`) : chaque jambe
demande sa flexion (posture du style, plus ce que le style ou la figure y ajoute) et le bassin prend la plus basse des
hauteurs qu'elles permettent. La jambe qui fixe la hauteur est donc exactement à la flexion qu'elle demande ; l'autre
plie davantage. Cette demande ne descend jamais sous un plancher de 0,12 rad (7°) : c'est le 7° du quart de tour en
couple.

## Le changement

Le plancher devient la flexion minimale de la règle, `KNEE_FLOOR`, pour toutes les jambes qui fixent la hauteur du
bassin : danseur seul, couple, figures, mode jeu, « 1 2 » (la jambe laissée en arrière l'atteint avec ce plancher
aussi). Là où une jambe se tendait, le bassin descend jusqu'à ce qu'elle garde cette flexion ; ailleurs rien ne bouge.

Une jambe dont le pied est en l'air ne fixe pas la hauteur : sa cheville est plus haute, elle est donc plus pliée.

Le rendu sans solveur des jambes (`plant=0`, mode historique) n'est pas concerné.

## Ce qui reste à trancher sur film

Le minimum est un nombre : il se choisit à l'œil. Candidats, activés par l'adresse seulement (`?flexion=<degrés>`,
de 7 à 40) tant que le vote n'a pas eu lieu, filmés avec la couche des muscles sur les scènes où une jambe se tend
le plus aujourd'hui : le quart de tour en couple (7° aujourd'hui), le kompa seul (sa jambe la moins pliée, 23°), le
« 1 2 » de la kizomba (la jambe laissée en arrière, 20°), le zouk seul (14°).

Mesures du prototype (flexion la plus faible des deux genoux, et le bassin au plus bas, en cm sous sa hauteur au repos) :

| Plancher | Kizomba seule | Kompa seul | Zouk seul | Couple sur place (kizomba) | Quart de tour en couple (suiveuse) |
|---|---|---|---|---|---|
| 7° (aujourd'hui) | 33°, −6,3 | 23°, −4,5 | 14°, −8,8 | 22°, −2,6 | 7°, −6,1 |
| 15° | 33°, −6,3 | 23°, −4,5 | 15°, −8,8 | 22°, −2,6 | 15°, −6,7 |
| 20° | 33°, −6,3 | 23°, −4,5 | 20°, −8,8 | 22°, −2,6 | 20°, −7,3 |
| 25° | 33°, −6,3 | 25°, −4,5 | 25°, −8,8 | 27°, −3,3 | 25°, −8,1 |
| 30° | 35°, −6,4 | 30°, −4,7 | 30°, −9,1 | 31°, −4,1 | 30°, −9,0 |

Jusqu'à 20°, seules les poses où une jambe se tendait changent ; à 30°, presque toutes descendent d'un peu.

## À vérifier (tests)

- Flexion de chaque genou au-dessus du plancher élu, dans toutes les figures, tous les styles, seul et en couple,
  mode jeu compris.
- Couple : aucun croisement d'os nouveau (sorties, quarts de tour, ida e volta, marche), contacts et plexus (R4).
- Hauteur du bassin (R3), saccades (R34, `scripts/fixtures/saccades.json`), sol.
- Les mesures enregistrées qui bougent sont reprises et dites dans la PR.

## Hors périmètre

- La hauteur générale des danseurs au-delà du plancher (posture de chaque style).
- Le rendu sans solveur des jambes.
