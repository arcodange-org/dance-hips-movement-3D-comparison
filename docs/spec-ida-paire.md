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
- **Ginga (#42)** : il partira de l'ida e volta. Ce chantier en pose la base de déplacement.

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
  longe le D du leader, bords au contact en quinconce), même longueur, même instant. Le couple reste
  emboîté.
- **Pas de marche** : chaque pas suit `gaitStep` sur un vol de 1,2 temps. Pas vers l'avant : talon qui
  se lève, passage de jambe, attaque du talon puis déroulé. Pas vers l'arrière : talon qui se lève,
  passage de jambe, pose de l'avant-pied puis du talon. Le point d'appui ne glisse pas pendant un pivot.
- **Poids et bassins (pas balancé, « rock step »)** : à l'aller, le poids passe sur le pied posé
  (temps 1 → 1,5) puis revient sur le pied resté au neutre (1,5 → 2), ce qui libère le pied pour le
  retour. Au retour, le pied revient sans poids et reprend le poids en se posant. Les deux bassins se
  déplacent **ensemble**, d'une part `carry` du pas, avec le poids. L'écart entre les bassins reste
  constant, donc le contact des plexus aussi.
- **Contraposition** : la courbe `idaContra` de la phase 15 donne le lacet du bassin (vers le pied qui
  bouge) et du buste (à l'opposé). Le suiveur la joue sur son propre pied, en miroir : les lacets des
  bassins sont de signes opposés dans le monde, comme les bassins couplés du quinconce. Le buste du leader
  guide un quart de temps en avance (`IDA_LEAD`, règle de #37). Avec l'option plexus, le buste fait face
  au partenaire (contraposition 1) ou reste aligné sur le bassin (0) ; il penche pour garder le contact.
- **Bassins couplés** : comme les quarts, le bassin du suiveur suit celui du leader (rotations du style
  en miroir), proportionnellement au rapprochement du placement.
- Hors paire (solo, comparaison) et sans `idaPaire` : comportement de la phase 8 et de la phase 15,
  inchangé (oracle et empreintes).

## Critères d'acceptation (tests sur le GLB réel, `scripts/test_ida_paire.mjs`)

1. **Neutre** : aux temps 0, 4 et 8, pieds et racines des deux danseurs sur la position neutre du
   placement (quinconce compris) ; cycle de 8 temps en boucle.
2. **Séquence** : le leader avance quand le suiveur recule, du même pas et au même instant ; le couple
   se déplace d'un bloc (écart des racines constant) ; le buste du leader précède de `IDA_LEAD`.
3. **Marche** : pendant chaque pas, le talon se lève avant que le pied ne quitte le sol ; attaque du
   talon sur les pas vers l'avant, avant-pied d'abord sur les pas vers l'arrière ; pivot sans glissement.
4. Six styles, amplitudes 0,5 ; 1 ; 2, quinconce et référence : semelles au-dessus du sol, cibles IK
   atteintes, longueurs osseuses constantes, pied d'appui immobile hors de sa fenêtre de vol, appui nul
   sur un pied levé, continuité.
5. Enveloppes des quatre semelles disjointes en continu ; aucun croisement des triangles des os des
   jambes, entre danseurs et pour chaque danseur.
6. **Plexus** (`scripts/test_plexus.mjs`) : avec contraposition, écart maximal des repères de poitrine
   ≤ 6 cm pendant tout le cycle (quinconce et référence, kizomba et kompa) ; sans contraposition, mesuré
   et rapporté.
7. Solo et comparaison inchangés : oracle, empreintes et suite existante verts sans modification.

## Paramètres proposés (à valider à l'œil par le propriétaire)

- Longueur du pas `step` = 18 cm (amplitude de la phase 8 : ±9 cm), vol de 1,2 temps.
- Part du pas suivie par les bassins `carry` (proposition : la moitié).
- Calibrages mesurés sur le GLB : section « Calibrage », complétée avec les mesures.

## Calibrage

À compléter avec les mesures du GLB (six styles, trois amplitudes, deux placements).

## Points de décision du propriétaire

- La séquence « pas balancé » (aller avec transfert du poids, retour au neutre) ou une autre lecture de
  l'ida e volta (par exemple aller-retour du couple sur plusieurs pas).
- La longueur du pas et la part suivie par les bassins.
- Le suiveur symétrique et synchrone (aucun retard des pieds, intention par le buste du leader).

## Limites

Pas de simulation de forces ni de contact de peau ; les pas restent illustratifs. Ces tests ne
constituent pas une validation chorégraphique.
