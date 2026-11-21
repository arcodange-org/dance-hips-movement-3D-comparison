# Spec #90 — enchaîner la sortie fille sur la fin de la sortie garçon

[Accueil](../README.md) · [Mode guidage](spec-mode-guidage-poc.md) · [Flèches du mode jeu](spec-jeu-fleches.md) ·
[Ontologie des figures](spec-ontologie-figures.md) (#95) · [Sortie garçon](spec-sortie-garcon.md) ·
[Sortie fille](spec-sortie-fille.md)

## Demande du propriétaire (20 novembre 2026)

« La position 2 de la sortie garçon est la configuration de la position 5 de la sortie fille si le leader
ne demande pas à la fille de reprendre la ligne mais d'avancer tout simplement : le guideur peut alors
reprendre la fin de la sortie garçon au lieu de faire la fin de la sortie fille. »

## Mesure : quelle position de la sortie fille ?

Pieds des deux danseurs dans le repère du couple (cm ; x vers la gauche du leader, z vers le suiveur),
aux fins d'action (aucun des deux ne tourne : les pieds gardent leur orientation) :

| Position | Leader G | Leader D | Suiveur G | Suiveur D | Écart à la sortie garçon pos. 2 (RMS) |
|---|---|---|---|---|---|
| Sortie garçon 2 | (29, 6) | (15, 16) | (−7, 32) | (7, 26) | — |
| Sortie fille 0 (neutre) | (12, −14) | (−4, −9) | (−12, 14) | (4, 9) | 7,8 |
| Sortie fille 2 | (7, −8) | (−24, −8) | (−56, 20) | (0, 65) | 29,4 |
| **Sortie fille 3** | (7, −39) | (−24, −8) | (−56, 20) | (−45, −8) | 16,9 |
| Sortie fille 4 | (7, −39) | (2, −61) | (−6, −38) | (−45, −8) | 26,3 |
| Sortie fille 5 (neutre translaté) | (19, −66) | (2, −61) | (−6, −38) | (11, −43) | 7,8 |

- La position 5 de nos échantillons est le neutre translaté : proche par la forme, mais ce n'est pas une
  configuration de sortie.
- La seule position de même topologie est la **position 3**, juste avant que son G ne « reprenne la
  ligne » (action 4) : côtés droits ensemble, face à face, D/D côte à côte. Elle est 20 cm plus large
  sur le côté que la position 2 de la sortie garçon.
- *Hypothèse à valider* : la « position 5 » du propriétaire est notre position 3 (sa numérotation compte
  peut-être autrement les positions de la sortie fille). C'est celle d'où elle peut reprendre la ligne
  ou avancer.

## Modèle

- Aucun pont ne garde les deux appuis plantés : entre les deux configurations, la distance entre le G
  porteur du leader et le D porteur du suiveur diffère de 32 cm.
- Le **leader garde son D planté**. Le couple de la sortie garçon est translaté pour que son D y soit à
  sa place.
- **Pont de 2 temps** (temps 3 à 5 de la figure enchaînée) :
  - leader : poids sur son D (0,12 temps), puis son G se place (jusqu'à 4,1). Son bassin part de 3,6 à
    4,5 : depuis #104 il finit près de son D (6 cm en arrière depuis #130), contre la cuisse droite du
    suiveur, donc il attend que le D du suiveur ait dégagé ;
  - suiveur : poids sur son G, puis son D se place avec le G du leader, sans partir avant lui (R24) ;
  - suiveur, suite : poids sur son D, puis son G avance et prend le poids sur le temps 5.
- Son G avancé tomberait là où se tient son D : le D part d'abord. Le D passe par un coin, d'abord en
  arrière puis vers lui : en droite ligne, il irait dans la cuisse droite du leader.
- Les deux quittent tôt le contact des cuisses D/D de la position 3. Au milieu du pont, le style est
  tenu plus petit (rotation du bassin, déhanché, flexion des genoux), avec les valeurs des sorties aux
  deux bouts. Sans cela, le suave à l'amplitude 2 serre les cuisses droites (mesuré sur le GLB ; chaque
  mesure seule laisse des croisements).
- Puis les **actions 3 à 5 de la sortie garçon** (temps 5 à 8), et sa marka tenue un temps : la figure
  enchaînée dure 9 temps.

## Mode jeu

**↑** pendant la sortie fille, entre ses temps 1 et 3, enchaîne la fin de la sortie garçon. Le segment
change de nature sans changer de début : les poses jusqu'à la position 3 sont celles de la sortie
fille, donc sans saut. Avant le temps 1, la pression est refusée (trop tôt). Après la position 3, ↑ garde
son sens habituel (la marche après la sortie). Démo : `?mode=pair&guidage=1&demo=enchainement`
([GIF](gifs/enchainement.gif), avec les muscles, vue du guideur ; la sortie fille commence par la virgula
du leader, #127).

## Tests

- `scripts/test_enchainement.mjs` (dans `npm test`) :
  - échantillons : sortie fille inchangée avant la position 3, continuité aux deux jonctions, fin de la
    sortie garçon translatée, D du leader planté, appuis aux jonctions, suiveur jamais en avance ;
  - GLB : sommets au-dessus du sol, cibles des chevilles ;
  - semelles disjointes, aucun croisement d'os des jambes (styles qui proposent les sorties, amplitudes
    0,5 à 2, placements, plexus).
- `scripts/test_guidage.mjs` : ↑ pendant la sortie fille (fenêtre, refus, marche après la sortie),
  continuité du squelette à toutes les frontières (144 enchaînements).

## Hors périmètre

- Insertion d'un ida e volta en milieu de figure (#91).
- Texte des transitions (#94) : engagement du leader, réception du suiveur, dans le cadre de
  l'ontologie (#95).
