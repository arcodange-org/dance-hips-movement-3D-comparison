# Spec — quart de tour en couple : la virgula avance, la rotation s'accélère moins vite (#208)

Règle consolidée : R47 de [`regles-proprietaire.md`](regles-proprietaire.md).

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

## La version retenue (25 novembre) : C et G, par défaut

Votes : question 29 → C (`unPied`). La question 30 refaite (F `progressif` / G `entreLesPas`) n'a pas reçu de vote, mais
la précision du propriétaire décrit G : le suiveur recule d'abord, puis tourne ; le guideur avance son pied G, genou
tourné vers la gauche, et n'entame la rotation qu'après ce premier pas ; la rotation monte progressivement entre le
premier et le second pas. G est mis par défaut **comme hypothèse de travail** ; la PR reste en brouillon jusqu'à sa
confirmation. `?quart=ancien` montre le quart d'avant #208 ; les autres candidats restent sous `?quart=<nom>`.

`QUART_ELECTED` (`src/quartsPaire.ts`) : virgula de C (`beyond` 19 cm), rotation de G, et des réglages pour que les os
des jambes ne se croisent plus (`scripts/sonde_croisements_couple.mjs quarts` : 0 croisement sur 288 poses en quinconce,
face à face et plexus, contre 220, 240 et 220 avec G tel que filmé pour le vote ; ginga discret, marqué et ample
compris) :

- **le bassin suit les pas, pas le lacet** : sa place fait le tour de C avec les pieds (`QUART_LEAD` 0,9 : 45 % du quart
  à la pose du premier pied, le reste avec le second pied), seul son lacet attend la pose ; laissé en arrière de la
  virgula, il poussait le genou D du guideur dans la jambe G de la suiveuse. La diagonale de #106 (l'extrémité en place
  à la première pose) appartenait à un bloc qui tourne avec le premier pas : elle n'est plus suivie ;
- **genoux** : le genou G du guideur suit son pied (la virgula tournée vers la gauche, le bassin encore de face), puis
  revient au-dessus du bassin à mesure que le bloc rattrape le pied ; son genou D s'ouvre vers la droite en proportion,
  au plus 0,6 rad (`QUART_KNEE`) ;
- **virgula 3,4 cm plus à gauche** (`beside`) : le talon reste au-delà du bout du D, un peu à gauche, à l'écart de la
  jambe G de la suiveuse, qui ne bouge pas pendant le premier pas ;
- **le D du guideur décrit son arc dès qu'il quitte le sol** (`QUART_BETWEEN_SHAPES`) : son chemin est plus long ; parti
  tard, il rattrapait l'arc à la fin et le bassin remontait de 6 cm en un quart de temps.

Mesures de la version retenue (kizomba, quinconce, amplitude 1, premier quart, `scripts/mesure_quart_virgula.mjs`) :
talon 21,3 cm au-delà du bout du D, G avancé de 43,9 cm ; D de la suiveuse 21,3 cm en arrière à la pose (42,9 au plus) ;
lacet nul à la pose du premier pied ; vitesse max 94 / 79 °/temps, accélération max 438 / 414 °/temps² (guideur /
suiveuse). Vitesse moyenne par quart de temps, guideur : 5 2 −2 −5 2 35 69 92 87 58 20 −3 −5 −2 2 5.

À-coups du bassin dans les séances du mode jeu (R34, `scripts/test_saccades.mjs`, enregistrés) : en un huitième de
temps, au plus 2 cm en hauteur et 9,7 cm à l'horizontale pour le guideur (2,5 et 13,4 avant), 2,3 et 10 cm pour la
suiveuse (4,5 et 15,7 avant).

**Conséquence à faire valider.** Le quart reste une rotation rigide du couple (le quinconce est retrouvé à chaque fin
de quart, spec #37) ; son centre est fixé par l'endroit où la virgula se pose. Une virgula qui avance d'un pied place ce
centre **entre les deux danseurs** et non plus à côté du guideur : le bassin du guideur parcourt 2,69 m par tour, celui
de la suiveuse 2,58 m (1,55 et 1,71 m avant #208). La règle R11 (« le suiveur fait plus de distance ») n'est donc plus
tenue au sens strict ; le test l'exige à 10 % près. Question posée au propriétaire.

Deux autres écarts, conséquences du même choix, enregistrés (`scripts/fixtures/ecarts-regles.json`) :

- **R8 (pas d'un pied)** : le plus long pas du guideur passe de 38 à 54 cm (sa virgula avance de 44 cm, son D fait le
  tour sur 57 cm), celui de la suiveuse de 30 à 33 cm ; en largeur 24 et 55 cm (14 et 48 avant) ;
- **R4 (plexus contre plexus)** : 8,1 cm en quinconce (8 avant). Dans l'espacement de référence des tests (pieds face aux
  pieds, hors de l'app), les poitrines s'écartent de côté jusqu'à 20 cm à la pose du premier pied : les pieds prennent
  déjà les places du quart pendant que les corps restent de face (garde portée de 16 à 21 cm, `scripts/test_plexus.mjs`).

## Le pivot de la suiveuse (précision du 25 novembre, prototype `?quart=pivotSuiveur`)

G est confirmé, avec une précision : la suiveuse recule son D droit, sans rotation, en réponse à la virgula ; puis elle
pivote sur ce pied, posé et chargé, pendant que le couple tourne (entre son premier et son second pas, en même temps que
le guideur).

Le quart reste rigide (le quinconce retrouvé à chaque fin de quart, spec #37) : le D de la suiveuse doit finir à la place
du quart. Un pivot sur l'avant-pied déplace la cheville (le talon balaie) : posé à la bonne place, le D recule de 31 cm
et de 13 cm seulement vers sa droite (27 cm de côté et 21 en arrière dans la version par défaut), puis il pivote d'un
quart sur son avant-pied (`QUART_BALL`, mesuré sur le GLB ; l'avant-pied reste fixe au centième de millimètre). Son pied
ne tourne pas pendant le recul ; son genou D s'ouvre un peu vers sa droite (`QUART_KNEE.follower`, 0,3 rad) pendant le
recul et le pivot.

Mesuré :

- os des jambes : **0 croisement** sur 288 poses (quinconce, face à face, plexus) ;
- semelles : en quinconce à l'amplitude 1 (le placement par défaut de l'app), **les orteils du D de la suiveuse se
  posent sur ceux de la virgula** : leurs enveloppes se chevauchent de 0,8 à 1,9 temps environ (55 échantillons sur un
  quart). Le pied de la virgula, perpendiculaire, pointe vers la gauche du guideur, là où le D de la suiveuse arrive en
  reculant droit. Aucun chevauchement aux amplitudes 1,5 et 2 ni face à face. Le point de pivot n'y change rien : talon,
  milieu du pied ou avant-pied, 27 à 55 échantillons ; une virgula plus courte ou plus à gauche non plus (50 à 65).

Le test des enveloppes de pieds (`scripts/test_quarts_paire.mjs`, section 6) échouerait : ce pivot n'est donc pas la
figure par défaut. Il est filmé pour être jugé (`pivot-pieds.gif`, `pivot-dessus.gif`, `pivot-guideur.gif` dans le dossier du vote).

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
