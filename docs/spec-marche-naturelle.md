# Spec #48 #49 #50 — fin de figure en quinconce, marche naturelle, contact des pieds D au temps 2

Fil d'Ariane : [docs](./) › spec #48 #49 #50. Dépend de [#28, placements](spec-placements-couple.md),
[sortie garçon](spec-sortie-garcon.md), [sortie fille](spec-sortie-fille.md),
[quarts de tour en paire](spec-quarts-paire.md).

## Demandes du propriétaire (19 novembre 2026)

- **#48** — « La position neutre est en quinconce, donc en fin de figure on retrouve le quinconce
  (dès que les danseurs partagent la même ligne de danse). »
- **#49** — « Actuellement on dirait plus que le leader marche sur la lune qu'il danse. On doit avoir
  l'impression qu'il marche normalement même s'il place ses pieds en réalisant une figure
  chorégraphique. »
- **Indicateur** — « Un bon indicateur, c'est que les danseurs doivent pouvoir maintenir un contact
  plexus contre plexus en appliquant une contraposition. » Précision : la variante avec
  contraposition doit être possible, la variante sans contraposition est très courante ; la
  première sert d'indicateur de la bonne distance (#51).
- **#50** — « À la position 2 de la sortie garçon, l'extérieur du pied droit est au contact de
  l'extérieur du pied droit du suiveur : on cherche le contact qui permet de guider des mouvements.
  La jambe gauche peut ainsi se décaler moins loin. »

## Constats sur le code

- Sorties : le rapprochement du départ est absorbé dès les premiers pas ; la figure finit à
  l'écartement de référence, pieds sous la largeur native des chevilles (#48).
- Le pied qui avance reste **à plat** pendant tout le pas et glisse près du sol sur une cloche lente
  et symétrique (4,5 cm), sans attaque du talon, sans déroulé, sans décollement des orteils ; le
  genou fléchit à peine pendant le passage de la jambe (#49).
- Temps 2 de la sortie garçon : seules les cuisses D/D sont au contact ; les pieds D sont écartés (#50).

## Modèle

### Fin de figure en position neutre (#48)

Dès que le couple revient face à face sur la ligne (sortie garçon : D4 et marka G5 du leader, G4 et
marka D5 du suiveur ; sortie fille : idem aux actions 4 et 5), les pas se posent en **position
neutre** : décalage de placement `o`, pieds sous les hanches et `stagger` du pied D, comme au départ.
La pose finale est la pose de départ translatée le long de la ligne : le quinconce et le contact des
demi-pointes sont retrouvés. Le bassin suit le pied d'appui comme pour les autres atterrissages.

### Contact des pieds D au temps 2 de la sortie garçon (#50)

Le D2 du leader se pose bord externe contre bord externe du D du suiveur (écart des enveloppes de
semelles ≤ 3 mm, sans chevauchement). Le G1 du leader s'écarte moins sur le côté.

Conséquence géométrique : pieds D bord à bord, les jambes convergent vers le bas et le contact des
cuisses D/D descend au tiers inférieur des fémurs (s ≈ 0,87 de la hanche au genou), toujours au-dessus
de la rotule. Rapprocher les bassins pour remonter le contact à mi-cuisse fait s'interpénétrer les
cuisses (−57 mm) : à valider à l'œil par le propriétaire.

### Pas de marche (#49)

Chaque pas d'une figure suit un cycle de marche, sur la fenêtre de vol déjà définie par la figure :

| Part du vol | Pas vers l'avant | Pas vers l'arrière ou de côté |
|---|---|---|
| 0 → 0,2 | le talon se lève, appui sur l'avant-pied (pivot sur la demi-pointe) | idem |
| 0,2 → 0,75 | la jambe passe : le pied quitte le sol, le genou fléchit, la pointe se relève | la jambe passe, pointe légèrement tendue |
| 0,75 → 1 | attaque du talon puis déroulé jusqu'à plat (pivot sur le talon) | pose de l'avant-pied puis du talon (pivot sur la demi-pointe) |

- Le déplacement du pied se concentre pendant le passage de la jambe ; il reste sur la trajectoire
  de la figure (mêmes appuis, mêmes arrivées).
- Pendant un pivot, le point d'appui (demi-pointe ou talon) reste fixe au sol : seule la cheville se
  déplace.
- Le marka garde un pied posé sans transfert, pointe au sol.

## Critères d'acceptation (tests sur le GLB réel)

1. Sorties : pose finale = pose de départ translatée le long de la ligne (garçon : 70 cm ; variante
   à droite : 10 cm de côté en plus), quinconce compris ; contact des demi-pointes retrouvé.
2. Sortie garçon, temps 2 : bords externes des pieds D au contact (≤ 3 mm), cuisses D/D toujours au
   contact, au-dessus des rotules (s ≤ 0,90) ; G1 moins latéral qu'avant.
3. Marche : pendant chaque pas, le talon se lève avant que le pied ne quitte le sol ; attaque du talon
   sur les pas vers l'avant ; le point d'appui ne glisse pas pendant un pivot ; flexion du genou de
   la jambe qui passe supérieure à celle de la jambe d'appui.
4. **Plexus contre plexus** : pendant toute la figure (sorties, quarts de tour en paire),
   contraposition comprise, les repères de poitrine des deux danseurs restent au contact (écart
   mesuré et rapporté à chaque temps ; seuil fixé après le relevé de l'état actuel).
5. Invariants inchangés : semelles au-dessus du sol, cibles IK atteintes, longueurs osseuses, pied
   d'appui immobile, continuité, semelles disjointes, aucun croisement des os des jambes (six
   styles, trois amplitudes), contacts des cuisses.

## Calibrations retenues (mesurées sur le GLB, six styles, trois amplitudes, deux placements)

- **Roulé réduit** des pas croisés ou au contact : G3 (croisé) et D4 (décroisé) du leader de la
  sortie garçon à 30 %, D1 du suiveur à 30 % (il part avant que le talon du leader ne monte), D2 du
  leader posé à plat (il ferme le contact D/D) ; deux premiers pas de la sortie fille à 20 %, G4
  croisé du suiveur à 30 % ; quarts de tour : pas de roulé pendant le croisement.
- Sortie garçon : détour du D2 de 6 cm au contact (3 cm sans contact) ; le G3 croise 0,2 temps après
  le début de l'action 3.
- Sortie fille : au marka final le bassin arrive avec le pied ; après le G4, bassin du suiveur 12 cm
  derrière son pied (fenêtre mesurée 0,11–0,12 : marge étroite).
- Bassins recouplés de 3 à 3,8 temps (avant les atterrissages neutres), comme au départ.
- Plexus (`plexus: true`, contraposition 1) : seul le buste penche vers le partenaire. Rapprocher
  les bassins (jusqu'à 34 ou même 45 cm d'écart) ou faire descendre le couple ensemble fait se
  croiser les os des jambes des partenaires (mesuré sur le GLB, six styles) : `pelvisPull` vaut 0.
  Écart maximal des repères de poitrine : 16 cm (sortie garçon), 7,5 à 9,5 cm (quarts en paire),
  15 à 21 cm (sortie fille). Sans contraposition : 30 à 34 cm dans les sorties.
- **Lecture de l'indicateur** : dans les sorties, le couple reste trop loin pour que les poitrines se
  touchent sans que les jambes se croisent. Selon l'indicateur du propriétaire, les distances des
  sorties sont encore trop grandes ; les raccourcir est un choix chorégraphique (#51).
- Les runners des sorties et des quarts en paire sont rejoués en mode plexus (`TEST_PLEXUS=1`,
  quinconce), le mode que l'application active dès qu'un placement est choisi.

### Sortie fille et plexus (suite de #51)

- Le D1 du suiveur recule de 45 cm dans le crochet (55 cm avant) : écart maximal 18,9 → 15,6 cm.
  Plus court, ses genoux rencontrent ceux du leader (quinconce, kompa). Dans la variante recul, aucun
  raccourcissement sans collision ne réduit l'écart de plus de 1 cm : le D1 reste à 42 cm.
- Les deux écarts restants viennent de la chorégraphie, pas des réglages :
  - **action 2** : le G2 du suiveur s'ouvre de 55 cm sur le côté (crochet). Une ouverture plus
    courte fait se chevaucher les pieds du couple ;
  - **action 4** : le D du suiveur reste au contact D/D pendant que son G recroise : pieds écartés
    de 55 cm, bassin plus bas de 12 cm, poitrine plus basse que celle du leader. Le buste penché ne
    comble pas une différence de hauteur ; décaler le bassin vers le D fait croiser ses propres jambes.
- Décision du propriétaire attendue : raccourcir l'ouverture latérale et le contact D/D de l'action 3,
  ou faire descendre le leader avec la suiveuse (le couple s'abaisse ensemble).

## Limites

Pas de simulation de forces ni de contact de peau ; les pas restent illustratifs. Les amplitudes du
déroulé (angles, hauteurs) sont des propositions à valider à l'œil par le propriétaire.
