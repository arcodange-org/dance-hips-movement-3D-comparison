# Le bassin garde sa vitesse (#219, #221)

Règle R34 (transfert continu, #167) : le bassin ne s'arrête jamais et sa vitesse ne casse pas, ni dans une figure, ni
aux jonctions entre figures. Ce chantier corrige trois mécanismes communs à toutes les figures en paire ; le dessin
propre du quart de tour (#208) et de l'ida e volta (#210) se règle dans leurs PR.

## Constat (27 novembre, mode jeu, kizomba, ginga par défaut, quinconce, amplitude 1, 48 échantillons par temps)

Repère : le pas de base seul va de 2,4 à 10 cm par temps, accélère au plus de 30 cm/temps² (44 en hauteur), sans lacet.

| où | mesure | avant |
| --- | --- | --- |
| jonction pas de base → quart de tour | vitesse d'un échantillon à l'autre | 9,9 → 0,6 cm par temps (473 cm/temps²) |
| jonction quart de tour → pas de base | vitesse | 0 → 11 cm et 5,4° par temps (528 cm/temps²) |
| jonction pas de base → ida e volta | vitesse | 9,9 → 17,2 cm par temps (1 115 ; suiveuse 1 334) |
| jonction ida e volta → pas de base | lacet | −5,8 → +5,4° par temps (550 et 712 °/temps²) |
| marches, sorties | jonctions | 450 à 980 cm/temps² à l'instant de la jonction |
| hauteur dans les figures | accélération verticale | marche 1 768, quart 2 717, sortie garçon 7 028, sortie fille 2 538 cm/temps² |
| plafond de rotation | roulis de la suiveuse | 656 °/temps² (quart), 506 (ida e volta) |

## 1. Jonctions : le résidu part avec sa vitesse (#219)

À une jonction, le mode jeu efface en un temps (`GUIDE.inertia`) l'écart entre la fin d'un segment et le début du
suivant : place du bassin au sol (`residual`, `src/guidage.ts`), hauteur, pose propre du bassin et buste
(`pelvisResidual`, `src/guidagePose.ts`). L'effacement était une courbe plate aux deux bouts : la position était
continue, la vitesse non.

- **Inertialisation en vitesse** (Bollo, GDC 2018, `inertialize`) : le résidu part de `x0` avec la vitesse `v0` et
  s'éteint au bout d'un temps sans vitesse ni accélération. Avec `v0 = 0` c'est l'ancienne courbe.
- **Vitesse au sol** : `guideMotions` mesure la vitesse de la racine (au sol et son lacet propre, `rootYaw`) au début de
  chaque figure (`entry`, et `entryTouched` quand un aller-retour l'ouvre, #144) et à sa fin (`exit`, dans le repère du
  segment suivant). `planGuide` donne à chaque segment `speed` = fin du précédent − début du sien (`junctionSpeed`) ;
  un aller-retour ajouté à la position 0 la recalcule.
- **Lacet de la racine** : `rootOffset.yaw` s'ajoute au lacet propre de la figure (`src/pose.ts`) ; il n'avait pas de
  résidu.
- **Pose du bassin et buste** : chaque canal du résidu mesuré sur le squelette a sa vitesse, par différences finies
  d'ordre 2 (`JUNCTION_STEP` = 1/96 de temps) de part et d'autre de la jonction ; la hauteur et le buste sont mesurés
  avec les résidus au sol et du bassin tels qu'ils partent. Mis en cache par transition, comme avant.

## 2. Hauteur : le bassin anticipe la portée des jambes (#221)

Dans une figure, la hauteur du bassin est la plus basse que permettent les deux jambes là où sont les pieds (à la
flexion plancher de 30°, R43). Elle change aussi vite qu'un pied se pose, part ou roule, et fait un angle quand l'autre
jambe prend le relais.

- La borne est lue sur une grille de la figure autour du temps (`HEIGHT_LEAD.step` = 1/48 de temps) : la racine et son
  lacet viennent de la figure, les hanches pendent comme maintenant, chaque pied borne là où il est (roulé sur sa pointe
  ou son talon, `bear` compris).
- On en prend la plus basse sur `HEIGHT_LEAD.reach` = un quart de temps de chaque côté, puis la moyenne sur un quart de
  temps (poids en cos⁴). Le bassin descend d'autant sous la borne d'ici : il n'est **jamais plus haut** que les jambes
  ne le permettent (les pieds atteignent toujours leur cible), descend avant qu'un pied en ait besoin et remonte après.
- La hauteur d'une semelle roulée se lit sur l'enveloppe convexe basse de la semelle vue en travers de l'axe de roulis
  (exacte : quelques dizaines de points au lieu de neuf mille). Les échantillons de la grille sont gardés par figure ;
  une pose chaude coûte autant qu'avant (environ 0,15 ms).
- **Un plan ne réécrit jamais son passé** : là où le jeu peut encore changer la suite d'une figure (un aller-retour à
  une position après la première, l'enchaînement de la sortie fille), la grille ne regarde pas au-delà (elle garde la
  valeur de la jonction) et son regard en avant repousse d'un temps par temps après elle (`figureJunctions`,
  `HEIGHT_LEAD.rejoin`), comme celui du ginga.
- **Figures concernées** : le quart de tour, l'ida e volta, les marches et le pas de base. Pas les sorties : un bassin
  abaissé avant le grand pas de la sortie fille rapprochait les genoux (rotules croisées en amplitude 2, temps 1,2), et
  leurs descentes de 13 cm attendent la décision du propriétaire sur la longueur des pas (#167).
- Conséquence voulue : une pose dépend du demi-temps qui l'entoure. Deux tests qui exigeaient qu'une variante ne change
  rien hors de son créneau, au millionième près, en tiennent compte (`test_ida_virgula`, la marka tenue de
  `test_sortie_fille` : la pose se pose un demi-temps plus tard).

## 3. Plafond de rotation atteint en douceur (#221)

`rotationCap` tenait la rotation du bassin à plat sur le plafond : elle s'y arrêtait net et repartait net. Elle est
maintenant inchangée jusqu'à 60 % du plafond (`SOFT_CAP_KNEE`), puis courbée vers lui sans l'atteindre (tangente
hyperbolique : pente et courbure continues, `softCap`) ; la plus grande des trois composantes est une norme 8.

## Gardes (`scripts/test_bassin_continu.mjs`, dans `npm test`)

1. À chaque jonction (six styles, chaque figure depuis et vers le pas de base ; en kizomba chaque figure suivie de
   chaque autre, aller-retour d'ouverture compris), la vitesse du bassin est la même des deux côtés : moins de 1 cm par
   temps au centre, moins de 2° par temps en lacet et en roulis. Mesuré : 0,03 cm et 0,05° par temps à 708 jonctions.
2. Dans les figures concernées (kizomba), les pieds atteignent leur cible et l'accélération verticale du bassin reste
   sous la borne de sa figure : marches 150, quart de tour 200, ida e volta de `main` 1 200 (son bassin s'arrête à
   chaque créneau : #210 le corrige ; sa PR resserre la borne).

## Après (même mesure)

| où | après |
| --- | --- |
| jonctions | aucune cassure : 0,03 cm et 0,05° par temps au plus d'un côté à l'autre |
| hauteur dans les figures | marches 53 à 86, quart 125 à 146 cm/temps² (sorties inchangées) |
| roulis de la suiveuse | 163 °/temps² (quart, avec #208), 213 (ida e volta, avec #210) |

Les autres styles : les figures du semba gardent les à-coups verticaux et de roulis du style lui-même (son rebond,
environ 400 à 600 cm/temps² et 600 °/temps², présents dans chaque figure et dans le passage au pas de base dansé en
suave) ; ils ne viennent ni des jonctions ni des bornes.
