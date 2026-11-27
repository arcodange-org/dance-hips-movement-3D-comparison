# Le bassin garde sa vitesse (#219, #221)

Règle R34 (transfert continu, #167) : le bassin ne s'arrête jamais et sa vitesse ne casse pas, ni dans une figure, ni
aux jonctions entre figures. Ce chantier corrige deux mécanismes communs aux figures en paire (les jonctions, le plafond
de rotation) ; le dessin propre du quart de tour (#208) et de l'ida e volta (#210) se règle dans leurs PR.

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
  d'ordre 2 (`JUNCTION_STEP` = 1/96 de temps) de part et d'autre de la jonction ; le buste est mesuré avec les résidus
  au sol et du bassin tels qu'ils partent. Mis en cache par transition, comme avant.
- **Sauf la hauteur**, qui s'efface sur place comme avant : emportée vers le bas, sa vitesse plie les genoux plus que la
  figure suivante ne le permet (fémurs croisés un quart de temps après le début d'une sortie fille dansée après un ida
  e volta, kizomba, et même avec une vitesse éteinte en un tiers de temps) ; emportée vers le haut, elle sortirait de
  la portée des jambes. Le saut de vitesse verticale reste donc aux jonctions (jusqu'à 96 cm par temps entre l'ida e
  volta de `main` et la sortie fille, où la hauteur de l'ida varie vite au dernier instant).

## 2. Plafond de rotation atteint en douceur (#221)

`rotationCap` tenait la rotation du bassin à plat sur le plafond : elle s'y arrêtait net et repartait net. Dans le
quart de tour et l'ida e volta (les marches partagent les bornes de l'ida), elle est maintenant inchangée jusqu'à 60 %
du plafond (`SOFT_CAP_KNEE`), puis courbée vers lui sans l'atteindre (tangente hyperbolique : pente et courbure
continues, `softCap`) ; la plus grande des trois composantes est une norme 8. Les autres figures gardent le plafond à
plat : leurs dégagements et leurs poses enregistrées (sortie garçon historique) ont été calibrés avec lui.

## 3. Essayé et écarté : la hauteur qui anticipe la portée des jambes

Dans une figure, la hauteur du bassin est la plus basse que permettent les deux jambes là où sont les pieds (à la
flexion plancher de 30°, R43). Elle change aussi vite qu'un pied se pose, part ou roule, et fait un angle quand l'autre
jambe prend le relais : c'est la source des à-coups verticaux. Essai du 27 novembre : lire cette borne sur une grille
de la figure autour du temps, prendre la plus basse sur un quart de temps de chaque côté et la moyenner, le bassin
descendant d'autant sous la borne (jamais au-dessus). Les à-coups verticaux tombaient de 500 à 7 000 cm/temps² à moins
de 200 (marches 83, quart de tour 146). Mais un bassin abaissé, **même de 5 mm**, croise les os des jambes du quart de
tour (kizomba, amplitude 0,5, temps 0,44 à 0,88) et de l'ida e volta (suave, temps 5,44), et rapproche les rotules dans
la sortie fille (amplitude 2) : ces figures n'ont aucune marge. Il faudrait aussi que la grille ne regarde pas au-delà
d'une jonction où le jeu peut encore changer la suite (un plan ne réécrit jamais son passé), ce qui la prive de son
effet juste après. Écarté : les à-coups verticaux se corrigent figure par figure, à leur cause (voir #208, #210).

## Gardes (`scripts/test_bassin_continu.mjs`, dans `npm test`)

À chaque jonction (six styles, chaque figure depuis et vers le pas de base ; en kizomba chaque figure suivie de chaque
autre, aller-retour d'ouverture compris), la vitesse du bassin est la même des deux côtés : moins de 1 cm par temps au
sol, moins de 2° par temps en lacet et en roulis. Mesuré : 0,03 cm et 0,05° par temps à 708 jonctions. La vitesse
verticale est relevée, pas bornée (voir plus haut). Les tests de croisement des os du mode jeu (`test_guidage`) passent.

La mesure de séance (`scripts/bassin_mesure.mjs` : bassin des deux danseurs, figure commandée depuis le pas de base,
48 échantillons par temps, accélérations au sol, en hauteur, en lacet et en roulis, arrêts) sert aux gardes propres
des figures (`test_quarts_paire`, `test_ida_paire`).

## Après (même mesure, `main`)

| où | après |
| --- | --- |
| jonctions | aucune cassure au sol, en lacet ni en roulis : 0,03 cm et 0,05° par temps au plus d'un côté à l'autre ; marches 54 à 60 cm/temps² à la sortie (843 à 978 avant) ; hauteur inchangée |

Les autres styles : les figures du semba gardent les à-coups verticaux et de roulis du style lui-même (son rebond,
environ 400 à 600 cm/temps² et 600 °/temps², présents dans chaque figure et dans le passage au pas de base dansé en
suave) ; ils ne viennent ni des jonctions ni des bornes.
