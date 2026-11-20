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
