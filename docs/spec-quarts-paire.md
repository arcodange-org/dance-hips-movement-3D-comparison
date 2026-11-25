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
- Chaque pied suit un **arc autour de C** pendant son pas, avec un lacet qui tourne avec lui ; il
  peut d'abord se dégager le long de son propre axe, élargir ou resserrer l'arc, et pivoter en fin
  de vol (`QuartsStepShape`).
- **Ordre des appuis** (un quart = 4 temps) :

| Temps du quart | Suiveur | Leader |
|---|---|---|
| 0,4 → 1 | **D** : recule de 32 cm (il est coincé entre les pieds du leader, avant-pieds au contact), puis tourne autour de C et revient en glissant le long de son axe, à côté du G du leader ; posé sur le 1 | **G** : part **avec** le D du suiveur, glisse de 7 cm vers l'avant dans la place que ce D libère et se pose sur le 1, talon au bout du D, en angle droit ; son buste s'engage avec lui |
| 1,45 → 3 | **G** : part dès que le D est posé (jamais les deux pieds en l'air), recule de 18 cm, arc 35 % plus large ; posé sur le 3 | |
| 1 → 1,8 | | **D** : reste au sol, monté sur sa demi-pointe (#106, 0,18 rad au plus) pendant que le G le porte |
| 1,8 → 2,9 | | **D** : s'écarte d'abord de 7 cm vers sa droite et de 3 cm vers l'arrière, contourne le talon du G (arc 40 % plus large) et pivote dans la seconde moitié du vol, parallèle au G (posé sur le 3, il chevaucherait le G du suiveur) |

- **Départs simultanés, buste du leader engagé avec son G** (#82, propriétaire, 20 novembre : « le
  suiveur "anticipe" et bouge en avance (ça doit se faire en simultané). Et le leader engage le buste
  avec son pied gauche ») : avant, le D du suiveur partait à 0 et le G du leader à 0,8. Désormais les
  deux partent à 0,4 et se posent sur le 1. Le D du suiveur recule toujours d'abord le long de son
  chemin, ce qui laisse sa place au G du leader.
- **Bassin et buste tournent avec les pieds** (#106, propriétaire, 20 novembre : « le bassin et
  l'épaule (avec tout le haut du corps) bougent en même temps que le pied. […] l'extrémité (par
  exemple épaule gauche) est déjà en position finale et le reste est en position intermédiaire
  "diago" jusqu'à ramener l'autre pied ») : bassin et buste forment un bloc (pas de torsion). Il
  tourne d'un huitième de tour avec le premier pied, la diagonale quand ce pied se pose, puis du
  reste avec le second. Il pivote autour du point qui amène le côté du premier pied (la hanche gauche
  du leader, la droite du suiveur, à 9 cm du centre du bassin) à sa place finale. Le deuxième demi-tour
  pivote autour de ce côté : le reste du corps le rattrape. Les deux danseurs suivent la même règle.
  Le bassin ne fait que 65 % (leader) et 58 % (suiveur) du chemin entre la rotation rigide autour de C
  et cette règle : la règle entière laisse le pied arrière si loin derrière la hanche que le bassin
  s'abaisse et que le genou avant part vers le partenaire. Le bassin tourne sur les 60 derniers pour cent
  du vol du premier pied (30 % avant #126). Le buste le suit **0,25 temps plus tard**, le temps du
  transfert de poids (#126, propriétaire, 21 novembre : « le quart de tour est bien, il faut simplement
  fluidifier le début (le buste peut avoir un léger retard sur le pied : le temps de transfert) »). Mesuré :
  0 croisement ; un départ à 30 % du vol avec 0,3 temps de retard donne 2 poses croisées. La règle de la phase 14 (haut du
  corps avec le premier pied, bas du corps avec le second) et le retard du buste du suiveur
  (`QUARTS_LEAD`) sont abandonnés.
- **Bassins couplés** pendant tout le tour ; balancement du style réduit de moitié (au quart depuis #203 : avec les
  genoux pliés à 30° au moins, le semba et le suave rapprochaient les genoux d'appui des deux danseurs).
- **Genoux et style au croisement** : flexion plafonnée à 0,22 rad (≈ 13°, contre 0,45 rad dans les
  sorties). Autour du croisement (temps 1 à 1,9 de chaque quart, quand les deux paires de cuisses
  sont intercalées et que le G du leader se pose à côté du G d'appui du suiveur), les genoux se
  tendent (0,12 rad), la rotation du bassin propre au style est plafonnée à 0,04 rad et le petit
  affaissement du style est supprimé. Points à valider : c'est le prix d'un couple collé-serré
  qui tourne sans que les os se croisent.
- Hors paire (seul, comparaison), les quarts de tour gardent le comportement de la phase 14.

## Calibrage

Mené sur le GLB réel, au premier quart (les autres s'en déduisent par rotation) :

- Le leader seul, pieds partis en avance : 1 541 chevauchements de semelles (son G percute
  l'avant-pied D du suiveur).
- Recherche aléatoire puis escalade sur les trajectoires : 6 à 12 chevauchements au mieux. Le
  raisonnement sur l'**ordre d'arrivée** (qui libère la place, qui arrive de côté, qui glisse le long
  de son axe) donne 0 chevauchement, en quinconce comme en face à face, amplitudes 0,5 à 2.
- Os des jambes : la jambe d'appui du suiveur, très inclinée quand ses pieds sont écartés, croisait le
  genou du leader ; en kompa, le bassin du leader, abaissé par son grand pas G, pliait sa jambe D
  contre le genou G du suiveur. L'ordre ci-dessus, les bassins qui tournent avec le second pied et
  l'adoucissement au croisement donnent 0 croisement sur 1 728 poses (six styles, amplitudes 0,5 ;
  1 ; 2, trois placements, au huitième de temps).
- #106, bassin et buste avec les pieds : le bloc tourné de 45° autour du centre C dès le premier pied
  donne 406 croisements. Les jambes d'un même danseur se croisent quand le D du leader part, et celles
  des partenaires juste après la pose. Constat sur le GLB : avec le bassin au-dessus du G posé, le D
  du leader reste 30 cm derrière la hanche. Le bassin descend alors de 3 à 4 cm, et le genou G
  avance de 14 à 17 cm vers le suiveur. Corrections, mesurées une à une : pivot sur l'extrémité et
  bassin à mi-chemin (96 puis 20 croisements), bloc tourné en fin de vol du premier pied, D du leader
  écarté vers sa droite au départ, puis D du leader sur sa demi-pointe tant que le G le porte (le
  bassin ne s'abaisse plus). Le dernier pas a été le plafond des genoux à 0,22 rad. Résultat : 0 croisement sur 576 poses
  de couple (styles qui proposent les quarts, amplitudes 0,5 ; 1 ; 2, quinconce et face à face). Ce
  réglage est étroit : une demi-pointe à 0,22 rad fait se croiser les jambes du leader.

## Critères d'acceptation (tests sur le GLB réel)

1. Fin de chaque quart : pieds et racines des deux danseurs égaux à la configuration de départ tournée
   de k·π/2 autour de C ; les deux danseurs se font face ; retour exact au départ après 16 temps.
2. Le leader traverse les quatre quarts de la boussole du couple ; le suiveur parcourt plus de
   distance que le leader.
3. Le D du suiveur et le G du leader partent ensemble et se posent sur le 1 ; bassin et buste
   tournent ensemble, d'un demi-quart à la pose du premier pied (le côté de ce pied plus proche de
   sa place finale que l'autre), du quart entier à la pose du second (#106).
4. Pieds orientés vers l'avant dans l'axe des genoux, à chaque instant hors pivot (lacet = rotation
   du pied).
5. Semelles au-dessus du sol, cibles IK atteintes, longueurs osseuses constantes, pied porteur
   immobile (pour le D du leader sur sa demi-pointe : la demi-pointe reste en place et la semelle
   touche le sol), continuité, somme des appuis = 1.
6. Enveloppes des quatre pieds disjointes en continu (amplitudes 1 ; 1,5 ; 2) ; aucun croisement des
   triangles des os des jambes, entre danseurs et pour chaque danseur (six styles, amplitudes 0,5 ;
   1 ; 2).
7. Solo et comparaison inchangés (oracle et empreintes existants).

## Limites

- Le cadre (bras) reste rigide et suit le buste : le guidage par le coude et l'avant-bras attend la
  validation de la recherche sur le cadre (#40) et une IK des bras.
- Pas de lecture finie ni de choix de pose : le tour complet revient au départ et boucle.
- Piste notée : un algorithme génétique pourrait explorer d'autres solutions sur ces mêmes
  contraintes (semelles, os, contacts, distance) ; ici, le raisonnement a été plus efficace que le hasard.
- Ces tests ne constituent pas une validation chorégraphique.

## Règle ajoutée le 20 novembre 2026 (#67)

Distance bassin-bassin quasi constante une fois le décalage latéral retiré, et pas de « monter-descendre » permanent : voir [règles du propriétaire](regles-proprietaire.md) (R2, R3). Critère à mesurer sur le GLB pour cette figure.
