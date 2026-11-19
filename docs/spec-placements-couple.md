# Placements rapprochés du couple dans les sorties

[Accueil](../README.md) · [Issue #28](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/28) ·
[Sortie garçon](spec-sortie-garcon.md) · [Sortie fille](spec-sortie-fille.md)

## Décisions du propriétaire (19 novembre 2026)

- **Quinconce, variante par défaut** : les **jambes droites** s'intercalent. Le D du leader se place
  entre les pieds du suiveur et le D du suiveur entre ceux du leader.
- **Face à face** : les pointes de pied sont presque en contact frontal (limité par les genoux, voir Calibrage).
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
| Idem, suiveur décalé de 8,4 cm vers la droite du leader | 0,109 m (semelles seules) |

## Modèle

Un placement est un **décalage de départ `o = (x, z)`**, identique pour les deux rôles et exprimé
dans le repère propre de chaque danseur. Chacun se décale de `x` vers sa gauche et avance de `z`.
Le couple reste centré sur la ligne de danse. L'écart relatif vaut `2x` latéralement, le suiveur
passant à la droite du leader, et `2z` longitudinalement.

| Placement | `o` (amplitude ≤ 1) | Demi-écartement effectif | Résultat au départ |
| --- | --- | --- | --- |
| Référence (interne, tests) | (0 ; 0) | 0,200 m | Figures validées, inchangées |
| Face à face | (0 ; 0,010) | 0,190 m | Pointes à 6,4 cm au lieu de 8,4 cm |
| Quinconce | (0,036 ; 0,035) | 0,165 m | Genoux D intercalés, racines à 33 cm au lieu de 40 cm |

En quinconce, le décalage latéral relatif de 7,2 cm centre le genou D de chacun entre les genoux du
partenaire. Les deux jambes droites se retrouvent côte à côte au centre, chacune entre les jambes
de l'autre. Élargir ce décalage rapprocherait les deux genoux droits l'un de l'autre.

### Calibrage : ce qui limite le rapprochement

Les valeurs viennent d'un balayage de non-croisement des os des jambes (fémur, tibia, péroné,
rotule) sur le GLB réel : six styles, figures et variantes, par pas de 0,1 temps jusqu'à l'arrivée
relative. **Ce sont les genoux, pas les pieds, qui limitent.** La flexion des styles porte les
rotules au-delà des pointes.

| Placement | Amplitude ≤ 1 | Amplitude 2 |
| --- | --- | --- |
| Face à face | Rotules croisées dès 2 cm de rapprochement par danseur ; 1 cm sûr | 1 cm sûr |
| Quinconce (x = 0,036) | 4 cm sûrs, croisement à 4,5 cm ; retenu 3,5 cm | Croisement dès 2 cm |

Décision du propriétaire : le rapprochement est complet jusqu'à l'amplitude 1, puis il **décroît
linéairement jusqu'à l'écartement validé à l'amplitude 2** (`o × clamp(2 − amp, 0, 1)`). Aucun
croisement d'os, et les styles restent inchangés. Un rapprochement plus fort, avec des pointes
presque en contact, exigerait des genoux moins fléchis en placement rapproché : c'est une décision
chorégraphique distincte, non prise ici.

### Absorption du décalage, sans glissement

- Au départ, les deux pieds et la racine de chaque danseur sont décalés de `o`.
- Chaque atterrissage est soit **décalé** (cible validée + `o`, amplitude du pas conservée), soit
  **validé** (cible validée exacte). Un pied ne change de décalage qu'en vol : le pied porteur ne
  glisse jamais.
- Les atterrissages qui participent à l'arrivée relative de la figure, et tous ceux qui la suivent,
  sont validés. Dès que chaque pied a atterri sur une cible validée, la figure est identique à la
  figure de référence.
- La racine suit le décalage du **pied porteur** : `racine = racine validée + o` tant que le danseur
  repose sur un atterrissage décalé, `racine validée` sinon, interpolée pendant le pas. Le bassin est
  donc validé dès que l'appui l'est, en particulier à l'arrivée relative.
- Les coins de trajectoire gardent leur forme. Au crochet du D du leader, le segment latéral garde
  le z du départ décalé et le segment longitudinal absorbe le reste.

| Figure | Arrivée relative | Atterrissages décalés |
| --- | --- | --- |
| Sortie garçon | Action 2 : D du leader contre la cuisse D du suiveur, posée à l'action 1 | Aucun : chaque pied absorbe `o` à son premier pas |
| Sortie fille | Action 3 : D du suiveur à côté du D du leader, posé à l'action 2 | Suiveur : D1, G2. Leader : aucun, car au crochet son D rejoint le niveau de son G |

Dans la sortie garçon, l'arrivée D/D suit immédiatement le premier pas. La hauteur du bassin du
leader dépend aussi de son pied libre : garder l'amplitude du G1 relèverait le bassin d'environ
2 cm et ouvrirait l'écart des cuisses D/D à 3,1 cm, au-delà du seuil de proximité de 3 cm. L'arrivée
relative prime, donc le rapprochement se résorbe sur le premier pas de chaque pied. Les autres atterrissages sont validés. Les marka finals et les variantes (fin à droite, recul)
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
3. **Arrivées relatives** : à l'arrivée D/D (action 2 garçon, action 3 fille), les chevilles D et
   les bassins sont ceux de la référence. Les poses complètes sont identiques à la référence dès
   que chaque pied a atterri sur une cible validée : action 2 (garçon), action 4 (fille, après le
   croisé du G libre du suiveur). Pour les deux rôles, toutes les variantes, amplitudes 0,5 et 1 ;
   à l'amplitude 2, identité sur toute la figure.
4. **Appuis** : les pieds porteurs ne glissent pas, la séquence des transferts est inchangée,
   et les amplitudes des pas décalés sont conservées.
5. **Contrôles existants rejoués pour chaque placement** : six styles, trois amplitudes ; semelles au
   sol, cibles IK, longueurs osseuses ; continuité ; enveloppes des pieds et triangles des
   jambes, entre partenaires et pour un même danseur ; proximité D/D des cuisses.
6. **Partage et interface** : analyse de `placement`, construction de l'URL de partage, remise au départ.

## Limites

Les vues comparables (dessus et profil, poses de départ) sont dans
[`placements/comparaison-garcon.jpg`](placements/comparaison-garcon.jpg) et
[`placements/comparaison-fille.jpg`](placements/comparaison-fille.jpg), en kizomba à amplitude 1.

Les distances sont un calibrage du modèle (squelettes BodyParts3D, enveloppes des semelles), pas
une norme de danse. Les tests ne couvrent que les os des jambes et les semelles : ni la peau, ni
les tissus mous, ni les bras, ni les forces. Avant toute validation chorégraphique, le propriétaire
reçoit des vues comparables (départ et arrivée relative, vue de dessus et de face) pour chaque
placement.
