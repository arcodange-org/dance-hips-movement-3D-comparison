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

## Le minimum élu : 30° (vote du 24 novembre 2026)

Le minimum s'est choisi à l'œil, sur film ([dossier du vote](elections/flexion-minimale/README.md), treizième tour,
question 28) : candidats 7° (l'ancien plancher), 20° et 30°. **Le propriétaire a choisi 30°**, sans commentaire.
C'est désormais le minimum de l'application (`KNEE_FLOOR_ELECTED`, `src/pose.ts`) ; `?flexion=<degrés>` (7 à 40)
montre un autre minimum, `FLEXION=<degrés>` le mesure en node.

Mesures du prototype (flexion la plus faible des deux genoux, et le bassin au plus bas, en cm sous sa hauteur au repos) :

| Plancher | Kizomba seule | Kompa seul | Zouk seul | Couple sur place (kizomba) | Quart de tour en couple (suiveuse) |
|---|---|---|---|---|---|
| 7° (aujourd'hui) | 33°, −6,3 | 23°, −4,5 | 14°, −8,8 | 22°, −2,6 | 7°, −6,1 |
| 15° | 33°, −6,3 | 23°, −4,5 | 15°, −8,8 | 22°, −2,6 | 15°, −6,7 |
| 20° | 33°, −6,3 | 23°, −4,5 | 20°, −8,8 | 22°, −2,6 | 20°, −7,3 |
| 25° | 33°, −6,3 | 25°, −4,5 | 25°, −8,8 | 27°, −3,3 | 25°, −8,1 |
| 30° | 35°, −6,4 | 30°, −4,7 | 30°, −9,1 | 31°, −4,1 | 30°, −9,0 |

Jusqu'à 20°, seules les poses où une jambe se tendait changent ; à 30°, presque toutes descendent d'un peu.

## Mise en œuvre à 30°

**Le plancher, sans à-coup.** La flexion demandée rejoint le plancher en douceur (`KNEE_FLOOR_SOFT`, 0,1 rad) : un
genou qui se tendrait au-delà ralentit en s'en approchant au lieu de s'arrêter net. Sans cela, le kompa seul (dont
la jambe la plus droite descendait à 23°) donnait au bassin un à-coup de 6,2 m/s² à chaque appui ; il en donne 4,8.
Au-dessus du plancher de 12°, la flexion est celle demandée. Les figures en couple, qui plafonnaient les genoux sous
le plancher (12° au plus), prennent le plancher lui-même : deux figures qui se suivent dans le mode jeu gardent la
même pose à leur jonction.

**Le « 1 2 ».** La jambe laissée loin atteint moins loin : le bassin plongeait à l'arrivée du pied (6,8 m/s² en
kizomba, 14,5 en semba). Le relais entre les deux hauteurs du bassin est plus doux (`UM_DOIS_SOFT` 0,025 m, au lieu
de 0,007) : le bassin descend sur toute la durée du pas, 3,8 et 7,8 m/s², les valeurs d'avant.

**Le couple.** Les genoux pliés à 30° avancent d'environ 6 cm vers le partenaire (les figures étaient calibrées avec
12° au plus) : les os des jambes se croisaient dans toutes les figures en couple (307 croisements sur 288 poses
dans le seul quart de tour en quinconce). Mesuré figure par figure (`scripts/sonde_croisements_couple.mjs`, hors `npm test`) :

- **Chaque danseur se tient 4 cm plus loin** (`COUPLE_DZ` 0,24 m au lieu de 0,20, `KNEE_ROOM`, `src/placement.ts`),
  dans toutes les figures (le mode jeu les enchaîne : un seul écart). Les pas gardent leur longueur dans le repère de
  chaque danseur ; les arrivées D/D des sorties, calculées depuis cet écart, gardent leurs contacts. Un rapprochement
  plus faible du quinconce (essayé de 6 à 0 cm) ne suffisait pas au quart de tour et faussait les premiers pas des
  sorties (la virgula ne tombait plus à côté du D du guideur).
- **Sortie fille** : son D3 se pose où il se posait dans son propre repère (son G4 croise devant lui comme avant),
  donc 8 cm plus loin derrière le D du guideur, et son bassin avance de 8 cm de plus au-dessus : les cuisses se
  touchent toujours à l'arrivée D/D.
- **Quart de tour** : la part du balancement du style gardée pendant le tour passe de 0,5 à 0,25 (le semba et le
  suave rapprochaient les genoux d'appui).
- **Plexus** : l'écart visé entre les poitrines passe de 8 à 5 cm (`PLEXUS.gap`) : le contact reste sous 6 cm dans
  le quinconce, le buste penché de 4 à 5° au plus en kizomba (sous la limite de 8°, « danseurs, pas lutteurs »).
- **Bras du cadre** : le coude de la suiveuse vise 5 cm plus haut (`CADRE_SITES.armR`) : la main du guideur va plus
  loin sur son omoplate et son coude remonte ; celui de la suiveuse reste 3 cm au-dessus.

Résultat : aucun croisement d'os des jambes, entre danseurs ni pour un même danseur, dans les sorties (crochet,
recul ; quatre placements), les quarts de tour, l'ida e volta, la marche, les allers-retours et le sur place, six
styles, amplitudes 0,5 à 2.

**Ce qui bouge dans les mesures enregistrées** (`WRITE=1`, changement voulu) :

| Mesure | Avant | À 30° |
|---|---|---|
| Saccades, quart de tour, suiveuse : bassin en un huitième de temps, en hauteur | 3,3 cm | 4,5 cm |
| idem, à l'horizontale (son arc est plus grand) | 13,1 cm | 15,7 cm |
| Saccades, sortie garçon, suiveuse, en hauteur | 12,9 cm | 13,6 cm |
| Saccades, sortie fille, guideur, en hauteur | 1,6 cm | 2,2 cm |
| R4, poitrines au plus loin : sortie garçon (partie ouverte) | 27,1 cm | 36,8 cm |
| R4 : quart de tour ; ida e volta | 10,1 ; 7,7 cm | 8,0 ; 6,6 cm |
| R21, sur place : poids sur le temps (kizomba, semba ; kompa) | 0,045 ; 0,015 temps | 0,02 ; 0,005 temps |

Les empreintes de la sortie historique (`scripts/fixtures/sorties-historiques.json`) sont régénérées.

**Contrôles ajustés** (chacun dit pourquoi dans le test) : les prototypes du kompa des tours de vote (« une jambe
presque tendue », désormais au minimum de flexion), le « 8 » mené par les genoux (moins rond vu de face, les hanches
montent moins), le buste de `assisBusteAvant` (2,3 cm derrière les genoux), le corridinho à reculons (le bassin creuse
un peu plus sur les grands pas : marge de 22 % au lieu de 15 %), les gardes du plexus en position de référence
(tests seulement), le saut aux jonctions du mode jeu (0,4 mm au lieu de 0,2 : 0,3 mm à la tête, en zouk, où la
sortie enchaînée rejoint le pas de base, invisible).
## Vérifié (tests)

- Flexion de chaque genou au-dessus du plancher élu, dans toutes les figures, tous les styles, seul et en couple,
  mode jeu compris.
- Couple : aucun croisement d'os nouveau (sorties, quarts de tour, ida e volta, marche), contacts et plexus (R4).
- Hauteur du bassin (R3), saccades (R34, `scripts/fixtures/saccades.json`), sol.
- Les mesures enregistrées qui bougent sont reprises et dites dans la PR.

## Hors périmètre

- La hauteur générale des danseurs au-delà du plancher (posture de chaque style).
- Le rendu sans solveur des jambes.
