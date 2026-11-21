# Spec #144 — tout pas qui avance ou recule peut devenir un ida e volta

[Accueil](../README.md) · [Ida en paire](spec-ida-paire.md) · [Ida inséré](spec-insertion-ida.md) (#91) ·
[Mode jeu](spec-jeu-file-auto.md) (#140) · [Virgula](virgula.md) · [Règles du propriétaire](regles-proprietaire.md) ·
[Issue #144](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/144)

**Statut : livré dans le mode jeu** (PR #145). Modèle validé par le propriétaire le 21 novembre 2026
(réponses ci-dessous), sauf les pieds de la suiveuse (deux questions en attente, dont celle de
l'issue #86) : la spec applique le miroir de l'ida e volta en paire en attendant.

## Demande du propriétaire (21 novembre 2026)

> chaque pied qui avance ou qui recule peut devenir un "ida e volta" (un simple aller retour du pied, en
> virgula ou non)

## Ce que cela change

L'ida e volta n'est plus seulement une figure de 8 temps, ni un ajout possible en deux endroits. C'est un
**geste** : un pied part, puis revient. Tout pas d'une figure où un pied avance ou recule peut prendre
cette forme.

| Sujet | Aujourd'hui | Avec la règle |
|---|---|---|
| Ida e volta en figure | 8 temps : quatre allers-retours (G avant, G arrière, D avant, D arrière) | inchangé |
| Ida inséré (#91) | position 2 des deux sorties, G du leader seulement | à tout pas qui avance ou recule |
| Virgula (#127, #128) | sortie fille crochet ; option de l'ida en paire | option de tout aller-retour où le G du leader avance |
| Danse automatique (#140) | « début d'une figure » possible à la position neutre et aux deux jonctions des sorties | possible à chacun de ces pas |

## Mesure : les pas qui avancent ou reculent

Relevé sur les échantillonneurs (GLB, quinconce, amplitude 1), dans le repère de chaque danseur. Un pas
« avance » ou « recule » quand son déplacement est plus long en profondeur que de côté. Longueurs en cm,
profondeur puis côté.

### Leader

| Figure | Action 1 | Action 2 | Action 3 | Action 4 | Action 5 |
|---|---|---|---|---|---|
| Avancer | G avance 18 | D avance 18 | | | |
| Reculer | G recule 18 | D recule 18 | | | |
| Double | G avance 18 | D avance 18 | | | |
| Quart de tour | G avance 25 (côté 11) | D avance 37 (côté 11) | | | |
| Sortie garçon | G avance 26 (côté 23) | D avance 25 (côté 23) | **G avance 28 (côté 28)** | D avance 24 (côté 23) | G se referme (5), pas retenu |
| Sortie fille | G avance 15, en virgula | D de côté (20), pas retenu | **G recule 21** | D recule 37 | G recule 21 |

En gras : les deux points d'insertion qui existent déjà (#91). Le relevé donne **16 pas du leader** qui
avancent ou reculent, dont 2 déjà couverts. L'ida e volta de 8 temps n'est fait que de tels pas : il
n'entre pas dans le tableau. L'enchaînement (#90) reprend les pas de la sortie fille jusqu'à sa
position 3, un pont (G avance 17, côté 15), puis les actions 3 à 5 de la sortie garçon.

### Suiveur, au même moment

| Figure | Action 1 | Action 2 | Action 3 | Action 4 | Action 5 |
|---|---|---|---|---|---|
| Avancer | D recule 18 | G recule 18 | | | |
| Reculer | D avance 18 | G avance 18 | | | |
| Double | D recule 18 | G recule 18 | | | |
| Quart de tour | D de côté (20) | G de côté (41) | | | |
| Sortie garçon | D recule 17 | G recule 21 | D recule 54 | G recule 28 | D avance 22 |
| Sortie fille | D recule 32 | G de côté (50) | D de côté (45) | G de côté (41) | D de côté (41) |

Dans la marche et la sortie garçon, le suiveur fait le pas opposé du leader : le miroir de l'aller-retour
est direct. Dans le quart de tour et la sortie fille, le suiveur se déplace surtout de côté pendant que
le leader avance ou recule : son aller-retour est à définir (question 4).

## Réponses du propriétaire (21 novembre 2026)

| Question | Réponse (ses mots) |
|---|---|
| 1. L'aller-retour ajoute 2 temps, puis le pas prévu ? | « Oui » |
| 2. Poids | « Le ida volta consiste en un "touch"/marka en aller retour donc si c'est le pied gauche qui sort et revient le poids reste à droite au début et à la fin et c'est encore au pied gauche de bouger ensuite. On peut faire ida e volta + quart de tour ensuite : le transfert de poids se fera donc au pas gauche du premier temps du quart de tour » |
| 3. Quels pas | « une sortie garçon (G1) peut être remplacée par une ida volta et reprendre ensuite, un retour de sortie fille (D4) peut être un ida volta. D2 et G5 non dans ces cas-ci » |
| 4. Suiveur quand il va de côté | « Je n'ai pas compris la question » : reposée plus bas |
| 5. Virgula par une touche maintenue, tirée en danse seule | « ok » |
| 6. La touche de l'ida pendant une figure transforme le prochain pas possible | « ok » |

## Modèle

Il prolonge l'ida inséré de #91.

1. **Où** : avant un pas du leader qui avance ou recule. On note la **position** `p` : la fin de
   l'action `p`, donc `p = 0` avant le premier pas de la figure (le G1 de la sortie garçon, exemple du
   propriétaire), `p = 3` avant le D4 de la sortie fille (son autre exemple).
2. **Quoi** : ce pied part dans le sens de son pas, sur un temps, et revient sur le temps suivant. C'est
   un créneau de 2 temps du cycle de l'ida e volta en paire (#107), ajouté à la position tenue.
3. **Poids** : touche, marka. Le poids est sur l'autre pied au début et à la fin ; le pied qui est sorti
   n'a pas pris l'appui, c'est donc encore à lui de bouger.
4. **Ensuite** : la figure reprend au pas qui était prévu, et c'est ce pas qui fait le transfert de
   poids. La figure dure 2 temps de plus par aller-retour.
5. **Suiveur** : le miroir de l'ida e volta en paire. Quand le leader avance son pied, le suiveur recule
   le sien, dans le même couloir ; quand il recule, le suiveur avance. C'est ce que fait déjà l'ida inséré
   de la sortie fille (#91). *À confirmer* : voir « Questions en attente du propriétaire ».
6. **Virgula** : quand c'est le G du leader qui avance, le pied peut se poser perpendiculaire (R26), avec
   la géométrie de #127. Sans effet sur le suiveur.
7. **Plusieurs fois** : chaque pas possible d'une même figure peut devenir un aller-retour, une fois.

### Le temps du style

Pendant un aller-retour, le style (déhanché, flexions) garde le temps de la figure : il s'arrête sur la
position tenue, puis reprend avec le pas. Toute pose en dehors d'un aller-retour est donc une pose de la
figure, déjà contrôlée par ses propres tests ; un aller-retour ajoute les déplacements de l'ida e volta à
une pose de la figure. L'ida inséré de #91 laissait le style avancer pendant l'aller-retour : le mode jeu
ne le fait plus (à la position D2 de la sortie garçon, cela croisait des fémurs en suave à l'amplitude 2).

### Positions retenues

Une position n'est gardée que si ses contrôles sur le GLB passent dans les trois styles qui proposent
l'ida e volta (kizomba, semba, suave), aux amplitudes 0,5, 1 et 2, dans la configuration du mode jeu
(quinconce, plexus). Table : `TOUCH_POSITIONS` (`src/insertion.ts`).

| Figure | Position | Pas du leader | Ajustement mesuré |
|---|---|---|---|
| Avancer | 0 | G en avant | |
| Avancer | 1 | D en avant | |
| Reculer | 0 | G en arrière | |
| Reculer | 1 | D en arrière | pied levé à 50 % (à pleine hauteur, deux rotules se touchent en suave à l'amplitude 2, sur une pose) |
| Double | 0 | G en avant | |
| Quart de tour | 0 | G en avant | |
| Sortie garçon | 0 | G1 en avant | pied levé à 50 % (en virgula et à pleine hauteur, deux rotules se touchent en semba à l'amplitude 2, sur une pose) |
| Sortie garçon | 1 | D2 en avant | aller-retour à 80 % de sa longueur, 14 cm (en entier, le fémur droit du leader croise celui du suiveur en semba) |
| Sortie garçon | 2 | G3 en avant | D du suiveur ouvert de 3 cm (#91) |
| Sortie fille | 0 | G1 en avant | pied levé à 50 % |
| Sortie fille | 2 | G3 en arrière | (#91) |
| Sortie fille | 3 | D4 en arrière | |
| Sortie fille | 4 | G5 en arrière | |
| Enchaînement (#90) | 0, 2 | comme la sortie fille | |
| Enchaînement (#90) | 5 | G en avant (le G3 de la sortie garçon) | |

Soit 13 pas, plus 3 positions de l'enchaînement.

**Virgula** : proposée quand le G du leader avance depuis la position neutre (position 0 d'avancer, du
double, du quart de tour et des sorties). C'est la géométrie validée de #127 et #128.

**Non retenus**, avec leur mesure :

| Pas | Raison |
|---|---|
| Sortie garçon, D4 (position 3) | Le leader a les jambes croisées ; son D, en partant droit devant, traverse sa jambe gauche : 12 poses sur 25 dans chaque style et à chaque amplitude |
| Quart de tour, D (position 1) | Le couple est en train de tourner : les semelles du leader se recouvrent (13 poses sur 25) et ses jambes se croisent |
| Double, second pas | Il tombe à un demi-temps |
| Sortie fille, D2 | Pas de côté (exclu par le propriétaire) |
| Sortie garçon, G5 | Fermeture (exclue par le propriétaire) |

Pour le D4 de la sortie garçon, une piste : faire partir le pied dans la direction de son pas (en
diagonale) plutôt que droit devant. Non fait.

## Mode jeu et danse automatique

- **Commande** : la touche de l'ida transforme en aller-retour le **prochain pas possible** de la danse
  en cours : celui de la figure qui se danse, sinon le premier pas possible de la figure qui attend en
  tête de file. Sans figure en cours ni en attente (pas de base), elle commande l'ida e volta de
  8 temps, comme avant. *Choix de l'agent, à essayer* : viser aussi la figure en attente est ce qui rend
  accessible le G1 d'une figure (« sortie garçon (G1) peut être remplacée par une ida volta ») ; en
  contrepartie, pour danser un ida e volta de 8 temps après une figure, il faut le commander quand elle
  n'a plus de pas possible devant elle.
- Une pression sur le temps même d'une position arrive trop tard pour elle : c'est la suivante qui est
  prise.
- **Sens** : l'aller-retour suit le sens du pas qu'il précède. Les flèches maintenues (jambe droite,
  arrière d'abord) ne le changent pas.
- **Virgula** : **Maj** maintenue avec la touche de l'ida, quand le pas visé la propose. Sur écran
  tactile : le bouton à bascule « Virgula ». Ailleurs l'aller-retour se fait sans virgula.
- **Segments** : la figure garde son nom et son début ; chaque aller-retour lui ajoute 2 temps et décale
  les positions suivantes. Les anciennes figures « sortie avec ida e volta » (#91) disparaissent : ce sont
  des sorties avec un aller-retour à la position 2.
- **Enchaînement** (#90) : une sortie fille peut être à la fois ornée d'allers-retours et enchaînée. Un
  aller-retour à partir de sa position 3 (D4, G5) la continue : ↑ redevient alors une commande ordinaire.
- **Danse automatique** : « à chaque position le choix de faire le début d'une figure si possible ou de
  terminer l'actuelle » (#140). À chaque position retenue le simulateur tire : faire le pas, ou
  l'aller-retour d'abord. Probabilité 0,12 ; 0,8 quand l'aller-retour amène une position neutre sur la fin
  de phrase ; 0,05 quand la figure y arrive sans lui. La virgula est tirée 3 fois sur 10 quand elle est
  possible (`GUIDE_AUTO.touch`, `.virgula`).
- **Styles** : un aller-retour est un ida e volta. Il n'existe que dans les styles qui proposent l'ida e
  volta (kizomba, semba, suave), pas en kompa, tarraxinha ni zouk.
- Démonstration : `?mode=pair&guidage=1&demo=allerretour` (les deux exemples du propriétaire : G1 de la
  sortie garçon, en virgula ; D4 de la sortie fille). [GIF](gifs/aller-retour.gif), avec les muscles, vue du guideur.

## Questions en attente du propriétaire

Elles portent toutes les deux sur la suiveuse. La spec applique partout la convention de l'ida e volta en
paire d'aujourd'hui (#54) ; une réponse différente changerait l'ida e volta en paire et tous les
allers-retours d'un coup, puisqu'ils partagent le même échantillonneur.

1. **Quel pied de la suiveuse** (issue #86, « Ida e volta : utiliser les mêmes pieds (ida e volta : aller
   et retour) », 20 novembre). La première lecture est acquise : le pied qui part est celui qui revient
   (réponse du 21 novembre : « si c'est le pied gauche qui sort et revient […] c'est encore au pied gauche
   de bouger ensuite »). Reste la seconde : quand le leader avance son pied gauche, la suiveuse recule
   aujourd'hui son pied **droit**, celui qui est en face du sien, dans le même couloir. Doit-elle plutôt
   reculer son pied **gauche**, le même pied que lui ? En quinconce, son pied gauche n'est pas dans le
   couloir du pied gauche du leader : les deux pieds partiraient dans deux couloirs voisins.
2. **La suiveuse quand elle allait de côté** (question 4 du 21 novembre, « Je n'ai pas compris la
   question »). Dans la sortie fille, au moment où le leader va faire son pas en arrière, la suiveuse
   s'apprêtait à faire un pas de côté. Pendant l'aller-retour du leader, la spec lui fait faire le miroir
   (son pied avance puis revient), comme le fait l'ida inséré de #91. Doit-elle plutôt rester en appui sans
   bouger le pied ?

## Critères (tests)

`scripts/test_touches.mjs`, `scripts/test_guidage.mjs`, `docs/features/mode-jeu.feature`, dans `npm test`.

1. Avant l'aller-retour, la figure est inchangée ; après, elle reprend à l'identique, décalée de 2 temps.
2. Le pied part dans le sens de son pas et revient ; le poids est sur l'autre pied au début et à la fin ;
   le retour se fait sans poids ; le pied d'appui ne bouge pas ; le suiveur fait le miroir et n'est jamais
   en avance (R24).
3. GLB, pour chaque position, styles qui proposent la figure et l'ida e volta, amplitudes 0,5 à 2 :
   os au-dessus du sol, cibles des pieds atteintes, semelles disjointes, aucun croisement d'os des jambes
   (entre danseurs ni pour un même danseur), de une demi-temps avant à une demi-temps après l'aller-retour.
4. Squelette continu au début et à la fin de chaque aller-retour ; poses de la figure inchangées en dehors.
5. Mode jeu : prochain pas possible (figure en cours, figure en attente), virgula, enchaînement, rejeu
   exact, danse automatique reproductible, chaque position tirée.

## Rapport (21 novembre 2026)

- **Positions** : 16 proposées (13 pas, plus 3 positions de l'enchaînement), 6 d'entre elles aussi en
  virgula : 22 cas. Trois ajustements mesurés (tableau des positions) ; deux pas écartés avec leur mesure.
- **Échantillonnage** (`scripts/test_touches.mjs`) : pour les 22 cas, figure inchangée avant, reprise à
  l'identique après, continuité aux deux bouts, pied dans le sens de son pas (plus de 10 cm), pied d'appui
  immobile, poids sur l'autre pied au début et à la fin (plus de 95 %), retour sans poids, suiveur en
  miroir et jamais en avance.
- **GLB** : 4 482 poses de couple (kizomba, semba, suave ; amplitudes 0,5, 1, 2 ; quinconce et plexus) :
  os au-dessus du sol, cibles des pieds atteintes, semelles disjointes, aucun croisement des os des
  jambes.
- **Mode jeu** (`scripts/test_guidage.mjs`) : poses de la figure inchangées hors de l'aller-retour
  (654 poses, écart nul) ; squelette continu au début et à la fin des allers-retours (saut de 0,001 mm) ;
  rejeu de 12 séances en direct (448 appuis, 4 727 instants d'aller-retour) identique au plan calculé d'un
  coup ; aucun croisement d'os sur 2 181 poses des séances commandées et 1 005 poses de la danse
  automatique.
- **Danse automatique**, 40 graines × 320 temps en kizomba : 510 allers-retours tirés, dont 73 en virgula,
  dans 443 figures ; chaque position proposée est tirée au moins une fois ; entre 10 % et 50 % des
  figures en portent un. Une position neutre tombe sur **77 %** des fins de phrase (81 % avant #144,
  25 % avec un tirage à poids égaux).
- **Gherkin** : cinq scénarios de plus dans `docs/features/mode-jeu.feature` (12 en tout).

Limites : la suiveuse fait toujours le miroir avec le pied opposé, y compris quand elle allait de côté
(deux questions en attente, dont celle de l'issue #86). L'aller-retour part droit devant ou droit derrière, pas dans la diagonale du pas. Ces tests ne
valident pas la chorégraphie.

## Hors périmètre

- Un aller-retour de côté pour un pas de côté (la règle parle des pieds qui avancent ou reculent).
- Les figures seul (hors paire).
