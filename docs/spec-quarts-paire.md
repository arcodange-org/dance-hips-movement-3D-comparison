# Spec #37 — quarts de tour en paire, autour du leader

Fil d'Ariane : [docs](./) › spec #37. Issue : #37. Dépend de [#28, placements](spec-placements-couple.md).

## Décisions du propriétaire (19 novembre 2026)

- **Axe** : le couple tourne **autour du leader**, mais le leader ne fait pas de sur-place. Il
  « remplit tous les quarts de la boussole » : dès le premier mouvement, il pose son pied dans un
  autre quart. Le suiveur parcourt plus de distance, ce qui est normal.
- **Placement** : le quinconce (demi-pointes au contact, genoux D intercalés) est **retrouvé à la
  fin de chaque quart**.
- **Retard du suiveur** : le suiveur répond au guidage environ **un quart de temps** après le
  leader (buste du leader, puis cadre, puis pieds du suiveur), et **le leader anticipe** d'autant,
  pour que le suiveur ne soit pas en retard sur la musique.
- Règles déjà validées (phase 14) : pour un quart à gauche, le leader amène le **talon du pied G au
  bout du pied D, en angle droit** (pied G orienté vers la gauche), puis ramène le **pied D parallèle
  au pied G** en position initiale. Le haut du corps suit le pied G, le bas du corps le pied D. Le
  suiveur pivote d'abord son **pied D en angle droit**, puis rassemble son pied G.
- Acquis de #28 : pieds orientés vers l'avant, dans l'axe des genoux, sous les hanches en position
  neutre ; bassins couplés ; rapprochement complet jusqu'à l'amplitude 1, puis atténué jusqu'à 2.

## Constat sur le code actuel

- En paire, le suiveur est le **miroir** du leader (`reverse`) : après un quart, les deux regardent
  dans la même direction ; le cadre ne peut pas tenir.
- La règle du leader (talon G au bout du D, puis D parallèle) est exactement une **rotation rigide**
  de ses appuis d'un quart de tour autour d'un point C, situé entre les danseurs, un peu de son côté.
  Ses pieds tournent donc autour de C et passent par les quatre quarts de la boussole du couple.

## Modèle

Un quart de tour est une **rotation rigide du couple** de π/2 (vers la gauche du leader) autour de
C, exprimée dans le repère du leader (+x à gauche, +z vers l'avant) :

- Configuration de départ : celle des sorties (`placementOffset`, pieds sous les hanches,
  `stagger`), racines à ±`QUARTS_PAIR_DZ` = ±0,20 m.
- **C** découle de la règle du leader : le pied G, tourné de π/2, se pose talon contre le bout du
  pied D (`L1 = R0 + (0,056 ; 0,20)`). C est l'unique centre de la rotation d'un quart qui envoie
  G0 sur L1 ; la même rotation envoie D0 parallèle à G, à l'écartement et au décalage de départ.
- À la fin du quart k, toute la configuration (pieds, racines, quinconce et contact des
  demi-pointes compris) est la configuration de départ tournée de k·π/2 autour de C. Après quatre
  quarts, le couple revient exactement au départ (cycle de 16 temps, en boucle).
- Chaque pied suit un **arc autour de C** pendant son pas, avec un lacet qui tourne avec lui.
- Séquence d'un quart (4 temps, deux demi-pas de 2 temps) :

| Demi-pas | Leader | Suiveur |
|---|---|---|
| 0 (temps 0–2) | G en angle droit, talon au bout du D ; le **haut du corps** suit le G ; appui D puis G | D en angle droit ; le haut du corps suit le D ; appui G puis D |
| 1 (temps 2–4) | D parallèle au G ; le **bas du corps** suit le D ; appui G puis D | G rassemblé parallèle au D ; le bas du corps suit le G ; appui D puis G |

- **Anticipation** : le leader joue chaque pas 0,25 temps en avance (`QUARTS_LEAD`) ; le suiveur
  pose sur le temps. Dans la boucle, l'anticipation du premier pas a lieu à la fin du cycle
  précédent ; à la première image de la lecture, le leader a déjà engagé son premier pas.
- **Bassins couplés** pendant tout le tour (le couple reste rapproché).
- Hors paire (seul, comparaison), les quarts de tour gardent le comportement de la phase 14.

## Critères d'acceptation (tests sur le GLB réel)

1. Fin de chaque quart : pieds et racines des deux danseurs égaux à la configuration de départ tournée
   de k·π/2 autour de C ; les deux danseurs se font face ; retour exact au départ après 16 temps.
2. Le leader traverse les quatre quarts de la boussole du couple ; le suiveur parcourt plus de
   distance que le leader.
3. Le leader précède le suiveur de 0,25 temps (début de chaque pas).
4. Pieds orientés vers l'avant dans l'axe des genoux, à chaque instant hors pivot (lacet = rotation
   du pied).
5. Semelles au-dessus du sol, cibles IK atteintes, longueurs osseuses constantes, pied porteur
   immobile, continuité, somme des appuis = 1.
6. Enveloppes des quatre pieds disjointes en continu (amplitudes 1 ; 1,5 ; 2) ; aucun croisement des
   triangles des os des jambes, entre danseurs et pour chaque danseur (six styles, amplitudes 0,5 ;
   1 ; 2).
7. Solo et comparaison inchangés (oracle et empreintes existants).

## Limites

- Le cadre (bras) reste rigide et suit le buste : le guidage par le coude et l'avant-bras attend la
  validation de la recherche sur le cadre (#40) et une IK des bras.
- Pas de lecture finie ni de choix de pose : le tour complet revient au départ et boucle.
- Ces tests ne constituent pas une validation chorégraphique.
