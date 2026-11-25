# Placements rapprochés du couple dans les sorties

[Accueil](../README.md) · [Issue #28](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/28) ·
[Sortie garçon](spec-sortie-garcon.md) · [Sortie fille](spec-sortie-fille.md)

## Décisions du propriétaire (19 novembre 2026)

- **Quinconce, variante par défaut** : les **jambes droites** s'intercalent. Ordre des pieds, de la
  droite du leader vers sa gauche : G suiveur, D leader, D suiveur, G leader. Au départ,
  l'extérieur de l'avant du pied D du leader touche l'intérieur de l'avant du pied G du suiveur, et
  l'intérieur de l'avant du pied G du leader touche l'extérieur de l'avant du pied D du suiveur, dans
  le premier tiers du pied (zone de la demi-pointe, *ball of the foot*). Le haut du buste peut se toucher.
- **Pieds neutres** : pieds orientés vers l'avant, dans l'axe des genoux, et sous les hanches en
  position initiale.
- **Genoux décalés en profondeur** : le genou D du leader passe un peu devant celui du suiveur,
  entre ses genoux.
- **Bassins couplés** : les hanches du suiveur cherchent celles du leader, qui les repousse.
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

### Pieds neutres

Le pied du GLB est ouvert d'environ 25° (axe talon → demi-pointe). Dans les sorties, une correction
de lacet par pied l'aligne sur l'axe du genou (`footAxisYaw`, `toeOut` dans `src/pose.ts`). Pieds droits,
les demi-pointes (8,6 cm de large) ne laissent que 5,6 cm entre elles à l'écart natif des chevilles
(±7,1 cm), trop peu pour y glisser celle du partenaire. La position initiale place donc les pieds
**sous les hanches** (±8,4 cm). Chaque pied rejoint la trajectoire validée à son premier pas, comme
le décalage de placement.

### Placement

Un placement est un **décalage de départ `o = (x, z)`**, identique pour les deux rôles et exprimé
dans le repère propre de chaque danseur. Chacun se décale de `x` vers sa gauche et avance de `z`,
le pied D de `stagger / 2` de plus. Le couple reste centré sur la ligne de danse.

| Placement | `o` (amplitude ≤ 1) | Résultat au départ |
| --- | --- | --- |
| Référence (interne, tests) | (0 ; 0) | Figures validées, base sous les hanches |
| Face à face | (0 ; 0,010) | Pointes rapprochées de 2 cm |
| Quinconce | (0,0405 ; 0,060), `stagger` 0,10 | Demi-pointes au contact (≈ 1 mm), genoux D croisés |

En quinconce, le contact se fait à 31 % de la longueur du pied du leader et à 22 % de celle du
suiveur, mesurés depuis la pointe : les deux sont dans le premier tiers. Les deux pieds droits
restent à 2,4 cm l'un de l'autre.

### Calibrage : ce qui limite le rapprochement

Balayage de non-croisement des os des jambes (fémur, tibia, péroné, rotule) sur le GLB réel : six
styles, deux figures, par pas de 0,1 temps. **Ce sont les genoux, pas les pieds, qui limitent.**

1. Au contact des demi-pointes, le genou est au-dessus de la demi-pointe : les deux genoux D se
   trouvent côte à côte, à 8,6 cm et à la même profondeur. Les os du genou font environ 8 cm de large ;
   dès qu'un style plie ou balance, ils se croisent (dès l'amplitude 0,5 en tarraxinha et en kompa).
2. **Décalage en profondeur** : avancer chaque pied D de 5 cm vers le partenaire fait passer le genou D
   du leader devant celui du suiveur. Les demi-pointes restent dans le premier tiers.
3. **Bassins couplés** : chaque danseur applique le même style dans son propre repère, et ils se font
   face. Le suiveur reçoit donc les rotations et le déplacement latéral du bassin en miroir. Le kompa
   décale le bassin de 1,8 cm : sans miroir, les deux hanches D convergent. Une même rotation verticale
   autour de deux centres distants de 24 cm balance les cuisses centrales l'une vers l'autre : elle
   est aussi mise en miroir. Le couplage est complet pendant la première action, s'efface pendant la
   deuxième, et ne s'applique pas sans rapprochement.

| Configuration (amplitudes 0,5 et 1, temps 0 à 2,5) | Poses en collision |
| --- | --- |
| Demi-pointes au contact, sans décalage ni couplage | dès le temps 0,1 (kompa, tarraxinha) |
| Décalage de 8 cm, couplage sans miroir de la rotation verticale | 6 sur 312 |
| Décalage de 8 cm, couplage complet | 1 sur 312 |
| **Décalage de 10 cm, couplage complet** | **0 sur 312** |

Décision du propriétaire : le rapprochement est complet jusqu'à l'amplitude 1, puis il **décroît
linéairement jusqu'à l'écartement validé à l'amplitude 2** (`o × clamp(2 − amp, 0, 1)`).

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
| Sortie fille | Action 3 : D du suiveur à côté du D du leader, posé à l'action 2 | Suiveur : G2. Son D1 est validé pour libérer le genou du leader ; son bassin finit son recul à 80 % du pas. Leader : aucun ; son crochet part 0,08 temps après le G2 |

Dans la sortie garçon, l'arrivée D/D suit immédiatement le premier pas. La hauteur du bassin du
leader dépend aussi de son pied libre : garder l'amplitude du G1 relèverait le bassin d'environ
2 cm et ouvrirait l'écart des cuisses D/D à 3,1 cm, au-delà du seuil de proximité de 3 cm. L'arrivée
relative prime, donc le rapprochement se résorbe sur le premier pas de chaque pied. Les autres atterrissages sont validés. Les marka finals et les variantes (fin à droite, recul)
sont donc inchangés.

## Écart du couple avec les genoux pliés (#203, 24 novembre 2026)

Depuis la règle R43 (jamais de jambe tendue, minimum de flexion de 30°), les genoux avancent d'environ 6 cm vers le
partenaire. Toutes les figures en couple partagent un écart plus grand : `COUPLE_DZ` = 0,24 m au lieu de 0,20
(`src/placement.ts`), chaque danseur 4 cm plus loin (`KNEE_ROOM`). Les placements décalent les pieds depuis cet écart
comme avant ; les pas gardent leur longueur dans le repère de chaque danseur, et les arrivées D/D, calculées depuis
l'écart, leurs contacts. [Spec](spec-flexion-minimale.md#mise-en-œuvre-à-30).

## Contact des cuisses à l'arrivée D/D (demande du 19 novembre)

À l'action 2 (garçon) et à l'action 3 (fille), le milieu et le haut des cuisses D des deux
danseurs **se touchent**. Le contact est défini sur les enveloppes illustratives de 8,5 cm : écart
compris entre −6 et +3 mm, points de contact sur la moitié haute ou le milieu des deux fémurs
(s ≤ 0,70, de la hanche au genou). L'arrivée relative étant commune à tous les placements, ce contact
vaut pour la référence, le quinconce et le face à face. Il suit la même atténuation selon
l'amplitude. Détails : [sortie garçon](spec-sortie-garcon.md), [sortie fille](spec-sortie-fille.md).
Les empreintes de non-régression `sortieG` du fixture sont régénérées (348 sur 504 changent, aux
amplitudes ≤ 1 et, pour le pas 1, à toutes les amplitudes). Celles du combiné `sortieGF` sont inchangées.

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
