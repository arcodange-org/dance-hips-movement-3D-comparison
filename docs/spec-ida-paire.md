# Spec #54 — ida e volta en paire : marche naturelle, quinconce, plexus contre plexus

Fil d'Ariane : [docs](./) › spec #54. Issue : #54 (suite de #51, préalable du ginga #42).
Dépend de [la marche naturelle #48–#51](spec-marche-naturelle.md), [des quarts en paire #37](spec-quarts-paire.md)
et [des placements #28](spec-placements-couple.md).

## Demandes du propriétaire (19 novembre 2026)

- **Indicateur (#51)** : « les danseurs doivent pouvoir maintenir un contact plexus contre plexus en
  appliquant une contraposition ». La variante sans contraposition est très courante, elle reste proposée.
  Le propriétaire ajoute que cela « peut se travailler encore une fois avec la figure ida e volta ».
- **Marche (#49)** : on doit avoir l'impression que les danseurs marchent normalement.
- **Neutre (#48)** : la position neutre est le quinconce, retrouvé dès que le couple revient sur sa ligne.
- **Ginga (#42)** : il partira de l'ida e volta. Ce chantier en pose la base de déplacement. Le
  propriétaire : « on n'oublie pas les transferts de poids avec le ginga déclenché à chaque alternance
  droite/gauche gauche/droite » : chaque transfert d'appui est explicite et mesurable.
- **Pas plus petits (#56)** : « faire des déplacements plus petits (longueur de pied) pour la plupart
  des figures ». Le pas de l'ida e volta (18 cm) reste sous la longueur d'un pied (21 cm).

## Constat sur le code

- `idaEVoltaStep` (phase 8) : cycle de 8 temps, un pas tous les 2 temps : **G avant, G retour, D avant,
  D retour** (±9 cm autour d'une position reculée de 9 cm), bassin immobile. Contraposition de la
  phase 15 (`idaContra`) : le bas du corps tourne vers le pied qui avance, le haut du côté opposé.
- En paire, les deux corps reçoivent `ida` sans `reverse` : **les deux danseurs avancent leur G en même
  temps, l'un vers l'autre**. Pieds à plat (pas de cycle de marche), écartement `PAIR_DZ` historique,
  sans placement ni plexus.

## Modèle (opt-in `idaPaire`, activé par l'app en paire)

Repère du couple : celui du leader (+x à gauche, +z vers le suiveur). Écartement des racines
±`IDA_PAIR_DZ` = ±0,20 m, comme les sorties et les quarts : les placements sont calibrés pour cet écart.

- **Position neutre** : celle des figures en paire (`placementOffset`, pieds sous les hanches,
  `stagger` du D, quinconce par défaut). Elle est retrouvée **à chaque retour** (temps 4 et 8).
- **Séquence** (8 temps, un pas tous les 2 temps, ordre de la phase 8 conservé pour le leader) :

| Temps | Leader | Suiveur | Couple |
|---|---|---|---|
| 0 → 2 | **G avance** (ida) | **D recule** | avance avec le poids, puis revient |
| 2 → 4 | **G revient** au neutre (volta) | **D revient** | au neutre, quinconce |
| 4 → 6 | **D avance** | **G recule** | avance avec le poids, puis revient |
| 6 → 8 | **D revient** | **G revient** | au neutre, quinconce |

  Le suiveur fait le pas symétrique du leader : même couloir de pieds (son D longe le G du leader, son G
  longe le D du leader, bords au contact en quinconce), même longueur. Le couple reste emboîté.
- **Le pied qui recule libère la place** (même raisonnement que les quarts #37) : à l'aller, le pied du
  suiveur part sur le temps et celui du leader `delay` = 0,5 temps plus tard ; au retour, c'est le pied
  du leader (qui recule) qui part le premier et celui du suiveur qui suit. Les deux pieds se posent au
  même moment (1,2 temps). L'intention du leader passe par le buste (`IDA_LEAD`).
- **Pied G ouvert** : en quinconce, chaque paire de pieds qui bougent ensemble a un pied G à l'extérieur
  (G du leader contre D du suiveur, G du suiveur contre D du leader). Le pied G qui bouge s'écarte de
  2 cm vers sa gauche pendant le vol, pour que les deux genoux qui avancent côte à côte se croisent sans
  se toucher.
- **Pas de marche** : chaque pas suit `gaitStep` sur sa fenêtre de vol. Pas vers l'avant : talon qui
  se lève, passage de jambe, attaque du talon puis déroulé. Pas vers l'arrière : talon qui se lève,
  passage de jambe, pose de l'avant-pied puis du talon. Le point d'appui ne glisse pas pendant un pivot.
  Le roulé est réduit à 30 % (pas au contact, comme les pas croisés des sorties) : à 100 %, le talon
  qui se lève pousse les deux genoux l'un vers l'autre.
- **Poids et bassins (pas balancé, « rock step »)** : une fois les deux pieds posés (fin du vol, 1,2),
  le poids passe sur le pied posé (1,2 → 1,5) ; à l'aller il revient ensuite sur le pied resté au neutre
  (1,55 → 1,95), ce qui libère le pied pour le retour. Au retour, le pied revient sans poids et reprend
  le poids en se posant.
- **Transferts d'appui explicites (pour le ginga #42)** : `idaTransfers(follower)` liste les six
  transferts du cycle (début, fin, pied quitté, pied chargé), alternés D/G : D→G à 1,2, G→D à 1,55,
  D→G à 3,2, G→D à 5,2, D→G à 5,55, G→D à 7,2 pour le leader ; mêmes instants, pieds en miroir, pour le
  suiveur. L'échantillon donne `support` (pied porteur) et `transfer` (transfert en cours et sa
  progression). Hors transfert, tout le poids est sur un pied. Les deux bassins se
  déplacent **ensemble**, d'une part `carry` du pas, avec le poids. L'écart entre les bassins reste
  constant, donc le contact des plexus aussi.
- **Contraposition** : la courbe `idaContra` de la phase 15 donne le lacet du bassin (vers le pied qui
  bouge, réduit de moitié dans le couple serré : il rapproche les cuisses d'appui du couloir extérieur)
  et du buste (à l'opposé). Le suiveur la joue sur son propre pied, en miroir : les lacets des
  bassins sont de signes opposés dans le monde, comme les bassins couplés du quinconce. Le buste du leader
  guide un quart de temps en avance (`IDA_LEAD`, règle de #37). Avec l'option plexus, le buste fait face
  au partenaire (contraposition 1) ou reste aligné sur le bassin (0) ; il penche pour garder le contact
  (le buste seul : `PLEXUS.pelvisPull` = 0 depuis #52, rapprocher les bassins croise les os).
- **Bassins couplés** : comme les quarts, le bassin du suiveur suit celui du leader (rotations du style
  en miroir), proportionnellement au rapprochement du placement.
- Hors paire (solo, comparaison) et sans `idaPaire` : comportement de la phase 8 et de la phase 15,
  inchangé (oracle et empreintes).

## Critères d'acceptation (tests sur le GLB réel, `scripts/test_ida_paire.mjs`)

1. **Neutre** : aux temps 0, 4 et 8, pieds et racines des deux danseurs sur la position neutre du
   placement (quinconce compris) ; cycle de 8 temps en boucle.
2. **Transferts** : six transferts d'appui par cycle, alternés, simultanés et en miroir pour les deux
   danseurs, les deux pieds au sol ; le poids ne change que pendant un transfert et finit entièrement
   sur le pied chargé ; les appuis du moteur (GLB) sont ceux de l'échantillonneur.
3. **Séquence** : le leader avance quand le suiveur recule, du même pas, avec le pied opposé ; le pied
   qui recule part le premier et garde l'avance, les deux se posent ensemble ; le couple se déplace d'un
   bloc (écart des racines constant) ; le buste du leader précède de `IDA_LEAD`.
4. **Marche** : pendant chaque pas, le talon se lève avant que le pied ne quitte le sol ; attaque du
   talon sur les pas vers l'avant, avant-pied d'abord sur les pas vers l'arrière ; pivot sans glissement.
5. Six styles, amplitudes 0,5 ; 1 ; 2, quinconce et référence : semelles au-dessus du sol, cibles IK
   atteintes, longueurs osseuses constantes, pied d'appui immobile hors de sa fenêtre de vol, appui nul
   sur un pied levé, continuité.
6. Enveloppes des quatre semelles disjointes en continu (quinconce, face à face, amplitudes 0,5 à 2) ;
   aucun croisement des triangles des os des jambes, entre danseurs et pour chaque danseur (quinconce,
   référence, et la vue par défaut de l'app : quinconce avec plexus et contraposition).
7. **Plexus** (`scripts/test_plexus.mjs`) : avec contraposition, écart maximal des repères de poitrine
   ≤ 6 cm pendant tout le cycle en quinconce (kizomba et kompa) ; référence gardée à 10 cm ; sans
   contraposition, mesuré et rapporté.
8. Solo et comparaison inchangés : oracle, empreintes et suite existante verts sans modification.

## Paramètres retenus (`IDA_PAIR`, à valider à l'œil par le propriétaire)

| Paramètre | Valeur | Rôle |
|---|---|---|
| `step` | 18 cm | longueur du pas (amplitude de la phase 8 : ±9 cm) |
| `flight` | 1,2 temps | fin du vol de chaque pas |
| `delay` | 0,5 temps | retard du pied qui avance sur le pied qui recule |
| `aside` | 2 cm | ouverture du pied G pendant son vol |
| `carry` | 0,5 | part du pas suivie par les deux bassins (9 cm) |
| `forwardRoll`, `backRoll` | 30 % | roulé du pas (`gaitStep`) |
| `weight` | 1,2 → 1,5 → 1,55 → 1,95 | poids sur le pied posé (deux pieds au sol), puis retour (pas balancé) |
| `pelvisYaw` | 0,5 | part du lacet de bassin de la phase 15 gardée en paire |
| `kneeCap` | 0,3 rad | flexion maximale des genoux (0,45 dans les sorties) |
| `rotationCap` | 0,05 rad | rotation du bassin propre au style (0,12 dans les sorties ; 0,06 avant #61, abaissé quand le lacet de la tarraxinha est devenu dominant) |

## Calibrage

Mesuré sur le GLB réel (os des jambes : triangles qui se croisent, entre danseurs et pour un même
danseur ; enveloppes des semelles), six styles, amplitudes 0,5 ; 1 ; 2, quinconce et référence, au
huitième de temps (poses en collision) :

| Étape | Poses en collision |
|---|---|
| Pieds synchrones, roulé complet | 325 sur 2 304 (jambes face à face en référence, genoux côte à côte en quinconce) |
| Le pied qui recule part 0,3 temps avant | 76 (trois styles seulement) |
| Retard 0,5, roulé à 30 % | 5 |
| + flexion des genoux plafonnée à 0,3 rad | 2 (kompa : genou G du leader contre genou D du suiveur, décalé en quinconce) |
| + pied G ouvert de 2 cm | 1 (tarraxinha : jambes d'appui, rotation du bassin du style) |
| + rotation du bassin du style plafonnée à 0,06 rad (0,05 depuis #61) | 0 |
| Poids reporté après la pose (1,2) et plexus sans traction des bassins (#52) | 2 (tarraxinha : cuisses d'appui, lacet du bassin) |
| + lacet du bassin réduit de moitié | **0**, aussi au seizième de temps, trois placements, plexus coupé, avec et sans contraposition |

Plexus (`scripts/test_plexus.mjs`, kizomba et kompa, amplitude 1, buste seul : `PLEXUS.pelvisPull` = 0
depuis #52) : écart maximal des repères de poitrine **3,4 cm** avec contraposition en quinconce (vue
par défaut de l'app) ; 9,2 cm sans contraposition ; 9,6 cm sans l'option plexus. En référence, les
bassins restent à 40 cm : 8,3–9,2 cm (garde de non-régression à 10 cm). Les bassins se déplacent
ensemble : l'écart reste celui du départ, contrairement aux sorties.

## Points de décision du propriétaire

- La séquence « pas balancé » (aller avec transfert du poids, retour au neutre) ou une autre lecture de
  l'ida e volta (par exemple aller-retour du couple sur plusieurs pas).
- La longueur du pas et la part suivie par les bassins.
- Le pied qui recule part le premier (0,5 temps d'avance) : le suiveur part sur le temps à l'aller, le
  leader au retour. L'autre lecture (le suiveur répond un quart de temps après le leader) fait se
  toucher les genoux.
- Le roulé réduit à 30 %, le pied G ouvert de 2 cm, genoux et bassin du style plafonnés (0,3 et
  0,06 rad) : le prix d'un couple serré qui avance et recule sans que les os se croisent.
- Le lacet du bassin de la phase 15 réduit de moitié en paire.
- Les instants des transferts d'appui (après la pose des deux pieds), point d'accroche du ginga (#42).
- Le bassin qui suit le poids de 9 cm (la moitié du pas) et le pas balancé (le poids revient avant le
  retour du pied).

## Limites

Pas de simulation de forces ni de contact de peau ; les pas restent illustratifs. Ces tests ne
constituent pas une validation chorégraphique.
