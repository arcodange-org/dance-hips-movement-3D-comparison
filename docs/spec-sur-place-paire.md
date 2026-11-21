# Spec #61 — couple sur place en quinconce, intention de hanche de la tarraxinha

Fil d'Ariane : [docs](./) › spec #61. Dépend de [placements #28](spec-placements-couple.md),
[marche naturelle #48](spec-marche-naturelle.md), [règles du propriétaire](regles-proprietaire.md) (R1, R16).

## Observation du propriétaire (20 novembre 2026)

« Le tarraxinha sur place est mauvais : les genoux opposés se traversent avec le partenaire et on ne voit
pas assez l'intention de la hanche vers l'avant (qui repart vers l'arrière légèrement sur le côté en
s'ouvrant mais surtout en permettant à la hanche opposée d'aller vers l'avant). »

## Constat

En paire sur place, les deux danseurs avaient les pieds face à face (`PAIR_DZ` 0,175 m, sans placement) :
les genoux opposés se rencontrent dès qu'ils fléchissent, **dans les six styles** (78 à 149 poses sur
160 avec croisement d'os). La tarraxinha faisait surtout du roulis (0,16 rad) et peu de lacet
(0,12 rad), d'où une intention de hanche vers l'avant peu visible.

## Modèle

- **Sur place en paire = position neutre** (`placePaire`, activé par l'app avec le placement) : pieds
  plantés en quinconce (décalage `o`, pieds sous les hanches, stagger du D), écart des racines
  ±0,20 m comme les figures, bassins couplés (le bassin du suiveur suit celui du leader en miroir).
- Le balancement latéral du style s'ajoute au bassin (50 %), en miroir pour le suiveur : le couple
  balance ensemble dans la salle. Plafonds : rotation du bassin 0,16 rad, flexion de portée 0,35.
- **Tarraxinha** : le lacet mène (0,22 rad, une hanche vers l'avant), le décalage latéral suit en
  quadrature (3 cm, la hanche qui revient s'ouvre sur son côté), le roulis devient secondaire (0,08 rad).

## Critères (GLB réel, `scripts/test_place_paire.mjs`)

1. Quinconce neutre (chaque pied D entre les pieds du partenaire), pieds plantés.
2. Aucun croisement des os des jambes (six styles, quatre amplitudes, quinconce, référence, plexus).
3. Tarraxinha : lacet > 2 × roulis, ouverture latérale ≥ 2,5 cm.
4. Sans `placePaire`, la pose de paire historique est inchangée.

## Paire sans figure : déplacement latéral, marka en 3 temps, corridinho (#71)

L'audit du 20 novembre (#71) a mesuré des os des jambes croisés en paire sans figure : sur place, temps3,
corridinho, dans les six styles. Sur place est couvert ci-dessus (#61). Le reste :

- **Déplacement latéral** (curseur « Déplacement » > 0) : le couple reste en quinconce et se balance
  sur le côté ensemble (le suiveur, face au leader, va vers sa droite quand il va vers sa gauche). Les
  pieds restent à leur place neutre et se lèvent chacun à leur tour, comme les pieds du solo qui se
  reposent sous le corps. Calibrage (`PLACE_PAIR.travel`) :

  | Bassins | Pieds | Réglage max | Poses croisées |
  |---|---|---|---|
  | 1 | 1 (écartement du solo) | 1 | 352/2304 (voyage 1), 336/2304 (0,5) |
  | 0,5 | 0,5 | 1 | 44/1152 (0,5) |
  | 1 | 0 | 1 | 4/1152 (0,5) |
  | **0,5** | **0** | **0,5** | **0** |

  En paire, le déplacement est donc plafonné à la moitié du réglage solo : au plus un quart de largeur
  de hanche de chaque côté, dans l'unité de largeur demandée par le propriétaire.
- **Marka en 3 temps** : sans déplacement, c'est la position sur place ; avec déplacement, un pas tous
  les 3 temps. Le pied qui se lève reste 0,6 temps en l'air, comme dans le pas de chaque temps : levé
  pendant 1,8 temps, il laissait la jambe libre au style (88/2304 poses croisées).
- **Corridinho** : en paire, c'est le tour du couple validé des quarts (#37), un cercle au sol en
  16 temps. La séquence du solo (quart de tour à droite, quart à gauche, cercle) a été essayée en
  faisant tourner le couple d'un bloc autour de son centre, quinconce gardée, un pas par temps. Le quart
  de tour, en 3 temps avec une marka (la source), passe ; la rotation libre du couple imbriqué croise
  les cuisses centrales, même en tournant sur place (25/64 poses en kizomba), et le cercle du solo
  donnait des pas de 52 cm. Les quarts n'évitent ce croisement que par une chorégraphie calibrée des
  appuis (le pied D du suiveur recule d'abord, etc.). Une séquence propre au corridinho en paire reste
  un sujet ouvert, à partir de cette chorégraphie.

Tests (`scripts/test_place_paire.mjs`) : 1 728 poses de couple avec déplacement et marka (six styles,
trois amplitudes, plexus) sans croisement, couple qui se déplace ensemble ; corridinho en paire
identique aux quarts en paire.
