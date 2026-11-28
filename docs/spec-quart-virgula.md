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

## Le suiveur recule droit au « 1 » (27 novembre, prototypes `?quart=reculDroit` et `?quart=reculUnPied`)

Correction du 27 novembre, après les films de f8619a1 : au « 1 », la suiveuse recule tout droit sur la ligne au lieu de
commencer le pivot. Mesuré sur la version retenue (mode jeu, kizomba, quinconce) : son D recule de 21,3 cm et part de
31 cm vers sa droite (55° hors de la ligne), son bassin de 20,1 cm et 16,1 cm ; les bustes ont déjà tourné de 29 à 30°
au « 1 ».

Deux prototypes, rien ne change sans le paramètre :

- **`reculDroit` (H)** : la virgula retenue ; elle se pose dans le couloir du D de la suiveuse, au-delà de ses orteils :
  son D recule de 34 cm, droit.
- **`reculUnPied` (H′)** : la virgula 10 cm plus à gauche du guideur, hors de ce couloir ; son D recule d'un pied (21 cm).
- Dans les deux : son bassin recule droit avec son D ; ce D la porte et pivote sur son avant-pied pendant que le couple
  tourne ; son G fait le tour au « 3 » ; son D, libéré, se replace au « 4 » à la place du quart (le quart reste rigide,
  spec #37). Le bassin rejoint ensuite le trajet retenu (`QUART_RECUL`).
- Bustes (`chestLead`) : la figure tourne elle-même les bustes, au lieu du contact des plexus qui les faisait tourner
  de 30° au « 1 ». Chacun fait face au partenaire comme au départ du quart. Au « 1 » le buste du guideur tourne de 15°
  vers le tour à venir, les bassins restant de face ; celui de la suiveuse le suit 0,1 temps après. Les bustes reviennent
  sur leur bassin à mesure que le bloc tourne.

Mesuré (quinconce, amplitude 1 ; mode jeu pour le « 1 » et le bassin) :

| | retenu | H `reculDroit` | H′ `reculUnPied` |
| --- | --- | --- | --- |
| D de la suiveuse au « 1 » | 21,3 cm en arrière, 31 cm de côté | **34 cm, 0 de côté** | **21 cm, 0 de côté** |
| bassin de la suiveuse au « 1 » | 20,1 cm, 16,1 de côté | 27,4 cm, 2,6 de côté | 17,5 cm, 2,4 de côté |
| buste au « 1 » (guideur / suiveuse) | 30,5° / 29,2° | 15,6° / 13,1° | 15,6° / 13,2° |
| lacet des bassins au « 1 » | 0,5° / −0,8° | 0,5° / −0,8° | 0,5° / −0,8° |
| enveloppes des pieds (quinconce, amplitude 1) | disjointes | disjointes | la virgula sur le D, 0,86 à 3,68 |
| enveloppes, autres placements et amplitudes | disjointes | D contre D vers 3,3 ; G et D de la suiveuse de 2,4 à 3,5 | D contre D de 2,6 à 3,4 |
| os croisés (`sonde_croisements_couple`, quinconce, 288 poses) | 0 | **103** | **330** |
| bassin de la suiveuse (kizomba) : au sol, en hauteur, vitesse | 308 / 793 cm/temps², 55 cm/temps | 367 / 1 677, 70 | 365 / 937, 71 (semba) |

Pourquoi ça croise. Le quart est rigide autour de C : le D du guideur se pose au « 3 » à la place de son D de départ
tournée d'un quart, en (9,6 ; 66,9) dans le repère du couple. C'est dans le couloir du D de la suiveuse, 30 cm derrière
son départ. Un D qui recule droit et y reste jusqu'au « 4 » occupe donc la place où le D du guideur se pose : les
jambes droites se croisent pendant qu'il arrive (2,4 à 2,5), puis pendant qu'elle se replace en passant devant son D
posé (3,1 à 3,25). Pousser la virgula vers sa gauche écarte son D d'autant (C bouge : 15 cm avec 10 cm de virgula), mais
le talon de la virgula reste sur les orteils d'un D qui ne recule que d'un pied, et le pivot sur l'avant-pied amène la
cheville vers la virgula. Le pied porteur bouge aussi par construction : il pivote puis se replace au « 4 », un troisième
pas que la garde « pied porteur immobile » de `test_quarts_paire` refuse (`QUART=<candidat>` lance ces tests sur un
candidat).

Ce qui reste à trancher : avec un quart rigide autour du guideur (R11, quinconce retrouvé à chaque quart, #37), un D qui
recule droit doit croiser la place où le D du guideur se pose au « 3 ». Pistes : le guideur gère la place (son D se pose
au « 3 » hors du chemin de la suiveuse et rejoint sa place au « 4 », comme #110) ; ou le quinconce n'est retrouvé qu'à la
fin de la figure ; ou le recul n'est pas tout à fait droit (`pivotSuiveur`, 13 cm vers sa droite).

## Le quart en deux temps (28 novembre, prototypes `?quart=deuxTemps` et `?quart=deuxTempsRecul`)

Correction du 28 novembre : le quart se danse en deux temps, pas en quatre. Au « 1 », la virgula du guideur avance (un
pied au-delà du bout de son D) et la suiveuse recule ; les bassins ne tournent pas encore. Au « 2 », le couple tourne et
revient à la position neutre du départ, tourné d'un quart (quinconce retrouvé). Quatre quarts font huit temps. La
question du « 3 » (section précédente) tombe : il n'y a plus de « 3 ».

Ce que font les prototypes (rien ne change sans le paramètre ; `QUART_TWO`, `quartBeats` dans `src/quartsPaire.ts`) :

- Le « 1 » est celui du quart en quatre temps : les premiers pieds partent ensemble à 0,4 et se posent sur le temps.
- Le « 2 » rejoue la partie du quart en quatre temps qui va de son « 1 » à la pose du second pied (temps 2,9), 1,9 fois
  plus vite : les mêmes poses, dans le même ordre. Le G de la suiveuse part à 1,24, le D du guideur à 1,42 ; tous deux se
  posent sur le « 2 » (le D du guideur se posait à 2,88 : l'écart de R21 disparaît). Le bloc tourne de 1 à 2.
- Le bassin fait le tour de C sur ce même temps (`QUART_TWO.root`). Un premier essai où il allait plus vite que le bloc
  ne tournait (75 % du chemin à mi-rotation au lieu de 50 %) croisait la jambe de la virgula avec le D de la suiveuse au
  milieu du « 2 » (150 croisements sur 288 poses) ; allonger la fenêtre où les genoux s'assouplissent empirait (222).
- Mode jeu : la figure dure deux temps (`GUIDE_FIGURES.quart`), et `?quart=` y est lu aussi (`GuidageApp`).

Les deux prototypes :

- **`deuxTemps`** : le quart retenu, en deux temps. Son D se pose au « 1 » à sa place du quart, déjà tourné (comme dans
  f8619a1).
- **`deuxTempsRecul`** : son D recule au « 1 » sans tourner, puis pivote sur son avant-pied au « 2 » pendant que le
  couple tourne. Les bustes de la section précédente (`chestLead`) : au « 1 », celui du guideur tourne de 15° vers le tour
  à venir et celui de la suiveuse le suit.

Mesuré (quinconce, amplitude 1 ; mode jeu, kizomba, pour le « 1 », les bustes et le bassin) :

| | retenu (quatre temps) | `deuxTemps` | `deuxTempsRecul` |
| --- | --- | --- | --- |
| D de la suiveuse au « 1 » | 21,3 cm en arrière, 31 cm de côté, tourné de 90° | pareil | **31,3 cm en arrière, 17,6 de côté (29° hors de la ligne), sans tourner** |
| bassin de la suiveuse au « 1 » | 20,1 cm en arrière, 16,1 de côté | pareil | pareil |
| lacet des bassins (guideur / suiveuse) | 0,5° / −0,8° au « 1 » | pareil au « 1 » ; 89,5° / 90,7° au « 2 » | pareil |
| bustes au « 1 » (guideur / suiveuse) | 30,5° / 29,2° | 30,5° / 29,2° | 15,5° / 12,9° |
| pied porteur, du « 1 » au départ suivant | immobile | immobile (cheville et avant-pied : 0 cm) | G du guideur immobile ; D de la suiveuse : l'avant-pied ne bouge pas, la cheville tourne autour (16,7 cm) |
| position neutre au « 2 » | au temps 4 | écart 0,00 cm | 0,00 cm |
| enveloppes des pieds | disjointes | disjointes (quinconce et face à face, amplitudes 1 à 2) | **quinconce, amplitude 1 : ses orteils sur ceux de la virgula, de 0,8 à 1,44 de chaque quart** ; disjointes ailleurs |
| os croisés (quinconce, face à face, plexus ; 288 poses chacun) | 0 | 0 | 0 |
| bassin au sol (guideur / suiveuse) | 324 / 308 cm/temps² | 456 / 434 | 456 / 434 |
| bassin en hauteur | 468 / 793 cm/temps² | 595 / 1 471 | 595 / 1 413 |
| vitesse au plus, au plus lent | 57 / 55 cm/temps ; jamais immobile | 79 / 69 ; jamais immobile (2,4 cm/temps au plus lent) | pareil |
| lacet, accélération au plus | 149 / 168 °/temps² | 521 / 527 | 521 / 527 |

Semba et suave : du même ordre (au sol 451 à 452 et 434 à 435 cm/temps², en hauteur 597 à 1 367). Le lacet suit la
règle : tourner le quart en un temps, en douceur aux deux bouts, demande 520 °/temps² ; en quatre temps le bloc tournait
sur 1,9 temps.

Pourquoi `deuxTempsRecul` ne recule pas tout droit. Au « 2 », son D doit être à sa place de la position neutre, à 31,7 cm
de la virgula dans la direction tournée d'un quart. Du « 1 » au « 2 », ce D porte et pivote sur son avant-pied : sa
cheville ne bouge que de 13 cm de côté. La place de son D au « 1 » par rapport à la virgula est donc fixée, où que la
virgula se pose (la déplacer déplace d'autant la place de son D). Un D exactement droit arrive au « 2 », une fois pivoté,
à 18 cm de sa place, sous le D du guideur : c'étaient les croisements de H. Le plus droit possible est 29° hors de la
ligne, et ses orteils arrivent alors sur ceux de la virgula dans le quinconce du mode jeu (amplitude 1 ; libres à 1,5).
Poser son D déjà un peu tourné ne libère les orteils qu'à partir de 45° : 29 cm en arrière et 26 de côté, à mi-chemin du
D tourné de `deuxTemps`.

## La version retenue (28 novembre) : le quart en deux temps, son D qui recule

Après les films de 57c32da, le propriétaire a choisi `deuxTempsRecul` : son D recule puis pivote (plutôt que posé déjà
tourné). C'est le quart de tour en paire, dans le mode jeu comme dans le comparateur (`QUART_ELECTED`, plus de
paramètre) ; `?quart=quatreTemps` montre le quart en quatre temps d'avant (f8619a1), `?quart=deuxTemps` l'autre
prototype. Le quart seul (sans partenaire) reste en quatre temps : question ouverte.

Réglages, sans toucher au choix (`QUART_TWO`) :

- **Les orteils** : la pointe de la virgula et les orteils de son D se chevauchaient de sa pose à 1,44 (un coin de 3 cm
  sur 2, quinconce, amplitude 1). La position neutre au « 2 » fixe où son D se pose par rapport à la virgula, quelle que
  soit la place de celle-ci. La virgula se pose donc 10° plus ouverte que l'angle droit et se referme sur son talon
  pendant le « 2 » (1,3 à 1,9), pendant que son D pivote et s'écarte. Sur l'avant-pied, la pointe ne bouge presque pas
  (encore 48 échantillons à 20°) ; sur le talon, 10° suffisent ; 20° touchent son G face à face.
- **Le départ de la rotation** : le bloc tourne dès 0,85 (1,5° au « 1 ») au lieu de partir sur le « 1 » ; son D pivote
  à partir de sa pose.
- **L'à-coup vertical de son bassin** : quand son G partait à 1,24, son bassin montait de 3 cm en un dixième de temps.
  Il part à 1,05, dès que son D la porte. Partir en roulant le talon l'empirait (2 000 à 3 300 cm/temps²).
- **Son D répond à la virgula** : il fait la moitié de son chemin dans le premier dixième de son vol. Plus lent, son
  genou rencontrait la cuisse de la virgula à 0,5 avec le ginga du mode jeu (3 à 8 poses, kizomba au réglage
  `discret`, semba, aller-retour inséré) ; reculer d'abord tout droit et ne partir vers sa droite qu'en fin de vol
  laissait son pied dans le couloir où arrive le G du guideur. Estomper le ginga à cet endroit faisait sauter la
  hauteur du bassin (près de 2 000 cm/temps²) : écarté.
- **Les bustes** gardent le contact des plexus (R4) : ils suivent le partenaire et tournent donc de 30° au « 1 », vers
  le tour à venir (de 12,5° vers sa droite à 17,5° vers sa gauche contre son bassin, pour le guideur). Tournés de 15°
  seulement (`chestLead`, comme filmé en 57c32da), ils s'écartaient de 16 cm au « 1 » (R4 : 6 cm) ; cette lecture reste
  visible sous `?quart=buste15`. Le buste suit le bassin 0,05 temps plus tard (0,13 tournait le buste du guideur de 27°
  contre son bassin au milieu du « 2 », au-delà des 18° de « danseurs, pas lutteurs »).

Deux corrections trouvées en route : le buste qui suit le bassin 0,13 temps plus tard, et celui de la suiveuse qui suit
celui du guideur, regardent désormais dans le quart précédent au début d'un quart (en deux temps le précédent tourne
encore à sa fin : saut de 1° au début de chaque quart). Le talon gauche est mesuré sur le GLB (les deux pieds ne sont
pas symétriques au millimètre).

Mesuré (quinconce, amplitude 1 ; mode jeu, kizomba, guideur / suiveuse) :

| | filmé (57c32da) | retenu |
| --- | --- | --- |
| son D au « 1 » | 31,3 cm en arrière, 17,6 de côté, sans tourner | pareil |
| lacet des bassins au « 1 » | 0,5° / −0,8° | 2,2° / 0,9° (1,5° sans le ginga) |
| bustes au « 1 » (depuis le départ) | 15,5° / 12,9° | 32,2° / 30,8° (plexus au contact) |
| contact des plexus (R4, `test_ecarts_regles`) | 16 cm | 8,4 cm (8,1 en quatre temps) |
| poids sur le temps (R21) | | 0,015 temps (0,12 en quatre temps) |
| enveloppes des pieds | orteils sur la virgula, 0,8 à 1,44 (quinconce, amplitude 1) | disjointes (quinconce et face à face, amplitudes 1 à 2) |
| pied porteur | immobile | immobile : la virgula se referme sur son talon, son D pivote sur son avant-pied |
| os croisés (`test_quarts_paire`, 288 poses) | 0 | 0 |
| bassin au sol | 456 / 434 cm/temps² | 465 / 434 |
| bassin en hauteur | 595 / 1 413 | **471 / 780** |
| vitesse au plus | 79 / 69 cm/temps | 80 / 71 |
| lacet, accélération au plus | 521 / 527 °/temps² | **396 / 421** |

Semba et suave : au sol 450 à 456 et 434, en hauteur 509 à 697 (guideur) et 726 à 1 023 (suiveuse, en suave sur son
premier pas, à 0,42), lacet 392. Le quart en quatre temps : au sol 324 / 308, en hauteur 468 / 793, lacet 149 / 168 :
le même chemin en deux fois moins de temps. Gardes de `scripts/test_quarts_paire.mjs` en deux temps (au sol 500, en
hauteur 1 100, lacet 450, vitesse 85) ; le même test passe sur `QUART=quatreTemps`. Cliquets enregistrés à nouveau
(`WRITE=1`) : `scripts/fixtures/ecarts-regles.json` (le pas du guideur de R8 : 54,8 cm au lieu de 54,2, la virgula
plus ouverte ; celui de la suiveuse, 52,7) et `scripts/fixtures/saccades.json` (le bassin de la suiveuse bouge de
3,2 cm en hauteur en un huitième de temps à 1,06, quand son G part, contre 2,3 en quatre temps ; les autres figures
bougent de 1 à 2 mm, les séances du mode jeu ayant des quarts plus courts).

## À vérifier une fois élu (tests sur le GLB réel, `scripts/test_quarts_paire.mjs`)

- Contraintes de la spec #37 inchangées : fin de chaque quart égale au départ tourné d'un quart autour de C, retour au
  départ après quatre quarts, quinconce retrouvé ; enveloppes des pieds disjointes ; pied porteur immobile ; cibles
  atteintes ; aucun croisement des os des jambes (six styles, amplitudes 0,5 à 2, quinconce et face à face, plexus).
- Lacet des bassins : vitesse et accélération maximales mesurées avant et après (ces tableaux), sans arrêt net, sans
  pivot au premier pas (25 novembre).
- La règle #106 (spec #37, `regles-proprietaire.md`) réécrite pour le quart selon la lecture élue.
- Saccades (R34, `scripts/fixtures/saccades.json`) reprises si les mesures changent.
- La virgula de la sortie fille (#127) reste la référence : le guideur avance, la suiveuse recule.

## Le bassin sans arrêt ni accélération subite (27 novembre)

Demande du 27 novembre : le quart de tour sans interruption du mouvement des hanches et sans accélération subite.
Mesuré dans le mode jeu (`scripts/bassin_mesure.mjs` : quart commandé depuis le pas de base, kizomba, ginga par défaut,
quinconce, amplitude 1, 48 échantillons par temps, bassin des deux danseurs ; repère, le pas de base : 30 cm/temps²).

- **Jonctions** (#219, branche fusionnée ici) : le résidu part avec sa vitesse ; plus de saut de vitesse au sol, en lacet
  ni en roulis d'un échantillon à l'autre (entrée : 9,9 → 0,6 cm par temps, 473 cm/temps² ; sortie : 528 → 49).
- **Trajet du bassin autour de C** (`QUART_ROOT`, `quartRootShare`) : une seule courbe monotone sur le quart au lieu de
  deux élans séparés par des arrêts. Il part un peu avant les premiers pieds (1,2 % du quart à 0,35), est au-dessus de la
  virgula quand elle se pose (45 % au temps 1, comme avant), glisse pendant que le bloc tourne (47 % à 1,75), finit
  après la pose du second pied (97 % à 3) et dérive encore de 2 % du quart par temps aux deux bouts, pour que les quarts
  s'enchaînent sans arrêt. Kizomba : vitesse au plus 57 cm par temps (80), accélération au sol 324 (419), jamais
  immobile (arrêt de 0,08 temps avant la fin).
- **Roulis** (#221) : le plafond de rotation est atteint en douceur. Suiveuse : 656 → 163 °/temps².
- **Lacet** : la rotation élue (G, entre les deux pas) est inchangée : 149 à 168 °/temps² au plus.

Ce qui borne le trajet, mesuré sur les os : un bassin encore derrière la virgula quand elle se pose croise les jambes
(amplitude 0,5, 30 poses) ; un bassin en avance sur le pied arrière quand celui-ci pousse fait sauter la hauteur (la
portée de la jambe arrière, 1 400 à 3 000 cm/temps²). Étaler davantage demanderait que les premiers pieds partent plus
tôt (aujourd'hui à 0,4 temps, posés sur le temps 1) : c'est le dessin de la figure, à soumettre au propriétaire.

**Reste** : la hauteur suit la portée des jambes (468 à 1 020 cm/temps² selon le style et le rôle, contre 507 à 914
avant ; 44 dans le pas de base) : quand un pied part, roule ou se pose, la jambe qui borne la hauteur change. Un bassin
qui anticipe cette borne, même abaissé de 5 mm, croise les os de cette figure (spec du bassin continu, #221). Garde dans
`scripts/test_quarts_paire.mjs` (kizomba, semba, suave ; hauteur et roulis du semba : le rebond du style lui-même).

## Hors périmètre

- L'ida e volta (#210) et le « 1 2 » (#209), chantiers distincts.
- Le cadre des bras pendant le tour.
