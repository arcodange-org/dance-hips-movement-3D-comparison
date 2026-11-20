# Spec #56 — déplacements plus petits (≈ une longueur de pied)

Fil d'Ariane : [docs](./) › spec #56. Dépend de [marche naturelle, quinconce, plexus](spec-marche-naturelle.md),
[sortie garçon](spec-sortie-garcon.md).

## Demande du propriétaire (19 novembre 2026)

« Faire des déplacements plus petits (longueur de pied) pour la plupart des figures. » Avec « on n'oublie
pas les transferts de poids avec le ginga déclenché à chaque alternance droite/gauche, gauche/droite »
(#42) : des pas courts laissent le transfert de poids porter le mouvement.

## Constat

Longueur du pied (enveloppe de la semelle) : 21 cm. Dans la sortie garçon, les longs pas viennent
surtout de la **progression du couple le long de la ligne** (validée : 17, 34, 66 et 70 cm après les
actions 1 à 4). Le contact D/D du temps 2 ne demande qu'environ 19 cm de déplacement relatif entre
les deux pieds D.

## Modèle

- Seule la progression commune est réduite : chaque atterrissage reprend `(1 − share)` de la
  progression d'une action donnée (`SORTIE_GARCON_TRAVEL`), en avant pour le leader, en arrière dans
  le repère du suiveur. Un pied posé ne glisse jamais ; la géométrie relative (contact D/D, croisé,
  fin neutre en quinconce) suit les tables d'affectation.
- Tables retenues : leader et suiveur `[2, 2, 2, 4, 5]` (index de la progression prise
  par chaque atterrissage), `share` 0,7 : le couple avance de 49 cm au lieu de 70.
- Le G1 du leader roule à 30 % (son genou dégage la cuisse D du suiveur) ; son D2 recule d'abord de
  5 cm puis contourne le D1 du suiveur, plus proche, avant d'avancer. Après son G4, le bassin du
  suiveur reste 1,5 cm derrière lui (variante à droite, quinconce : sinon cuisses G/D au contact).

## Résultat (GLB, placement quinconce)

| Pas | Leader | Suiveur |
|---|---|---|
| Avant | 35, 40, 40, 40, 7 cm | 27, 28, 54, 42, 12 cm |
| Après | 27, 31, 40, 31, 6 cm | 17, 18, 54, 33, 22 cm |

## Pourquoi pas une longueur de pied partout

`scripts/search_pas_courts.mjs` explore les tables et les parts de progression gardées, sur trois
placements, quatre amplitudes et les deux variantes. En dessous de 70 % de la progression, des
pieds se chevauchent ou des os de jambe se croisent (genou du leader contre la cuisse du suiveur à
l'action 1, D2 contre le genou D du suiveur à l'action 2). Deux pas restent longs quoi qu'il arrive :
le G3 croisé du leader (40 cm) et le D3 du suiveur (54 cm), son passage le long du leader pendant le
croisé. Les raccourcir change la géométrie relative du croisé : décision chorégraphique du
propriétaire (plusieurs petits pas, ou pivot sur place).

## Critères (tests sur le GLB réel)

1. Pose finale = pose de départ translatée de `share × 70 cm` le long de la ligne (quinconce compris).
2. Contact D/D du temps 2 conservé (bords externes ≤ 3 mm), cuisses D/D au contact.
3. Seul le D2 du leader recule (≤ 5 cm) avant d'avancer ; aucun autre pas ne revient en arrière avant
   les atterrissages neutres.
4. Invariants : aucun croisement d'os de jambe (six styles, trois amplitudes, trois placements, avec et
   sans plexus), semelles disjointes, pied d'appui immobile.

## Hors périmètre

Sortie fille (pas jusqu'à 98 cm, même nature : le D3 du suiveur) et quarts de tour en paire (rotation
rigide) : à traiter avec la décision sur le passage du suiveur.
