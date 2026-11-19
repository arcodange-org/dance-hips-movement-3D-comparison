# Placements rapprochés du couple dans les sorties

[Accueil](../README.md) · [Issue #28](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/28) ·
[Sortie garçon](spec-sortie-garcon.md) · [Sortie fille](spec-sortie-fille.md)

## Décisions du propriétaire (19 novembre 2026)

- **Quinconce, variante par défaut** : les **jambes droites** s'intercalent. Le D du leader se place
  entre les pieds du suiveur et le D du suiveur entre ceux du leader.
- **Face à face** : les pointes de pied sont presque en contact frontal.
- **Arrivées relatives conservées** : les arrivées définies par rapport au partenaire (proximité
  des cuisses D/D, retour sur la ligne, marka final) restent celles des figures validées. Les autres pas
  gardent leur amplitude depuis le départ rapproché.
- **Portée** : d'abord les sorties garçon et fille en paire. L'extension à tous les mouvements en
  paire viendra après validation. Le combiné `sortieGF` et les autres mouvements gardent
  `PAIR_DZ`.

## Géométrie mesurée (GLB réel, pose de départ)

Repère local de chaque danseur : +x à sa gauche, +z vers l'avant. Le suiveur est tourné de π,
face au leader. Les sorties gardent leur écartement de référence : les racines sont à ±0,20 m
(`SORTIE_*_PAIR_DZ`), et ce repère extérieur ne change pas.

| Mesure (enveloppe convexe des semelles) | Valeur |
| --- | --- |
| Cheville au repos | x = ±0,071 m, z ≈ 0 par rapport à la racine |
| Pied | 15,6 cm devant la cheville, 5,6 cm derrière |
| Écart pointe à pointe à l'écartement de référence | 8,4 cm |
| Demi-écartement minimal sans chevauchement, pieds alignés | 0,158 m |
| Idem, suiveur décalé de 8,4 cm vers la droite du leader | 0,109 m |

## Modèle

Un placement est un **décalage de départ `o = (x, z)`**, identique pour les deux rôles et exprimé
dans le repère propre de chaque danseur. Chacun se décale de `x` vers sa gauche et avance de `z`.
Le couple reste centré sur la ligne de danse. L'écart relatif vaut `2x` latéralement, le suiveur
passant à la droite du leader, et `2z` longitudinalement.

| Placement | `o` | Demi-écartement effectif | Résultat au départ |
| --- | --- | --- | --- |
| Référence (interne, tests) | (0 ; 0) | 0,20 m | Figures validées, inchangées |
| Face à face | (0 ; 0,037) | 0,163 m | Pointes à environ 1 cm |
| Quinconce | (0,042 ; 0,080) | 0,120 m | D/D intercalés, environ 1 cm de marge entre semelles |

Le décalage latéral total de 8,4 cm vaut la moitié de l'écart des articulations de hanche
(0,168 m). Chaque jambe droite arrive ainsi dans l'axe de l'intervalle entre les jambes du partenaire.

### Absorption du décalage, sans glissement

- Au départ, les deux pieds et la racine de chaque danseur sont décalés de `o`.
- Chaque atterrissage est soit **décalé** (cible validée + `o`, amplitude du pas conservée), soit
  **validé** (cible validée exacte). Un pied ne change de décalage qu'en vol : le pied porteur ne
  glisse jamais.
- Les atterrissages qui participent à l'arrivée relative de la figure, et tous ceux qui la suivent,
  sont validés. À partir de cet instant, la figure est identique à la figure de référence.
- La racine suit les pieds : `racine = racine validée + o × (pieds encore décalés / 2)`, interpolée
  pendant le pas.
- Les coins de trajectoire gardent leur forme. Au crochet du D du leader, le segment latéral garde
  le z du départ décalé et le segment longitudinal absorbe le reste.

| Figure | Arrivée relative | Atterrissages décalés |
| --- | --- | --- |
| Sortie garçon | Action 2 : D du leader contre la cuisse D du suiveur, posée à l'action 1 | Leader : G1. Suiveur : G2 |
| Sortie fille | Action 3 : D du suiveur à côté du D du leader, posé à l'action 2 | Leader : G1. Suiveur : D1, G2 |

Les autres atterrissages sont validés. Les marka finals et les variantes (fin à droite, recul)
sont donc inchangés.

## Interface, partage, export

- Sélecteur « Placement du couple » (Quinconce / Face à face), visible pour les deux sorties en paire.
  Quinconce par défaut, état persistant.
- Partage : `placement=quinconce|face`. Une valeur absente ou inconnue donne `quinconce`.
- Changer de placement remet la figure au départ, en pause, comme un changement de variante.
- L'export WebM utilise le placement courant. La durée reste de cinq temps.

## Critères d'acceptation (tests sur le GLB réel)

1. **Référence** : avec `o = 0`, les poses des deux sorties restent identiques aux empreintes
   existantes (non-régression des figures validées).
2. **Départ** : pour chaque placement, les écarts relatifs des chevilles valent `2o`, sans
   chevauchement des enveloppes de semelles. En quinconce, le D de chaque danseur est
   latéralement entre les pieds du partenaire.
3. **Arrivées relatives** : à partir de l'action 2 (garçon) ou 3 (fille), poses identiques à la
   référence, pour les deux rôles et toutes les variantes.
4. **Appuis** : les pieds porteurs ne glissent pas, la séquence des transferts est inchangée,
   et les amplitudes des pas décalés sont conservées.
5. **Contrôles existants rejoués pour chaque placement** : six styles, trois amplitudes ; semelles au
   sol, cibles IK, longueurs osseuses ; continuité ; enveloppes des pieds et triangles des
   jambes, entre partenaires et pour un même danseur ; proximité D/D des cuisses.
6. **Partage et interface** : analyse de `placement`, construction de l'URL de partage, remise au départ.

## Limites

Les distances sont un calibrage du modèle (squelettes BodyParts3D, enveloppes des semelles), pas
une norme de danse. Les tests ne couvrent que les os des jambes et les semelles : ni la peau, ni
les tissus mous, ni les bras, ni les forces. Avant toute validation chorégraphique, le propriétaire
reçoit des vues comparables (départ et arrivée relative, vue de dessus et de face) pour chaque
placement.
