# Interactions physiques des corps : contacts, non-pénétration, équilibre

[Hub de la recherche](README.md) · [Physique, IK, procédural](physique-ik-procedural.md) · [Interactions à deux](interactions-a-deux.md) · [Confrontation avec le moteur](confrontation-moteur.md) · [Cadre leader / suiveur](../cadre/README.md) · [Issue #67](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/67)

Le propriétaire, le 20 novembre 2026 : « J'espère que de l'idée du jeu vidéo on pourra améliorer
les interactions physiques des corps. » Il demande aussi (#67) une distance avant-arrière entre les
bassins **presque constante** (décalage latéral des sorties mis à part) et **pas de changement de
niveau permanent** : « On danse proche. »

Cette page rassemble ce que les jeux et la recherche proposent pour que les deux corps **se
touchent juste**, **ne se traversent pas** et **restent en équilibre**, et comment ces techniques
peuvent faire converger le comparateur vers des mouvements de danse corrects. Documentation seule.

> [!IMPORTANT]
> **En bref.** Les règles du propriétaire (contacts du cadre, quinconce, bassins couplés, distance
> des bassins, hauteur stable) s'écrivent comme des **contraintes** : un contact à tenir, une distance
> à garder, une interpénétration à interdire, un centre de masse à garder au-dessus des appuis. Les
> jeux résolvent ce genre de liste par **projection de positions** (*Position Based Dynamics*, XPBD),
> par **IK à plusieurs effecteurs** entre deux personnages et par **maillage d'interaction**. Résolue
> sans mémoire, à partir de la pose paramétrique de chaque image, avec un nombre fixe d'itérations,
> la couche reste une fonction du temps, donc testable. Elle sert d'abord **hors ligne**, pour
> calibrer les échantillonneurs, puis éventuellement en direct pour le mode guidage.

## Ce que le moteur fait déjà

| Règle physique | Où | Comment aujourd'hui | Limite |
| --- | --- | --- | --- |
| Pas d'os de jambe qui se croisent, entre danseurs ni pour un même danseur | `scripts/test_*_paire.mjs`, `test_sortie_*.mjs`, `test_plexus.mjs` | **Testé**, pas empêché : les paramètres sont réglés à la main jusqu'à ce que le test passe (`search_pas_courts.mjs`, `calibrate_placements.mjs`) | Chaque nouvelle figure ou option se recalibre à la main |
| Pied d'appui immobile, semelles au-dessus du sol | `gaitStep`, IK des jambes, tests | Construit dans l'échantillonneur et l'IK | — |
| Plexus contre plexus | `PLEXUS` dans `src/pose.ts` | Le buste se penche vers le partenaire (écart visé 8 cm, inclinaison plafonnée) | `pelvisPull = 0` : rapprocher les **bassins** croisait les jambes sur le GLB ; les distances des sorties restent trop grandes (#51) |
| Bassins couplés | `coupling` dans `src/pose.ts`, `startCoupling` / `endCoupling` | Le bassin du suiveur suit celui du leader en miroir pendant le contact, puis se découple quand la position s'ouvre | Règle cinématique ; pas de mesure de distance entre bassins |
| Hauteur du bassin | `dip`, portée des jambes | La figure limite le rebond ; la **portée des jambes** fixe la hauteur | Un pas long fait descendre le bassin : c'est le « monter-descendre » de #67 |
| Contacts du cadre (main sur le dos, coude et côtes, mains jointes, bras du suiveur) | [Spécification du cadre](../cadre/spec-implementation.md) (#41) | **Spécifiés** : dix contacts, sites sur les deux corps, critères A0 à A14 (distances, non-interpénétration des bras A6) | Pas encore implémentés |
| Règle des hanches | [Actions et intentions](../cadre/actions-et-intentions.md#règle-des-hanches) | **Spécifiée** : attraction par défaut du bassin du suiveur, fenêtres de répulsion décidées par le leader (A9) | Lue et contrôlée seulement, sans effet sur les bassins |

Le constat : les règles physiques sont **vérifiées après coup** par des tests et **satisfaites à la
main** par calibration. Les jeux font l'inverse : ils écrivent ces règles comme des contraintes et
laissent un solveur les satisfaire.

## Les techniques de jeu qui aident

### 1. Résolution de contraintes par projection (PBD, XPBD)

**Principe.** *Position Based Dynamics* (Müller et al., AGEIA, 2006) travaille directement sur les
positions : chaque contrainte (distance, collision, contact) **projette** les points vers une
position valide, contrainte après contrainte, sur quelques itérations. Les auteurs soulignent que
les pénétrations se résolvent complètement en projetant les points ; la méthode a servi à une
bibliothèque physique pour jeux. **XPBD** (Macklin, Müller, Chentanez, NVIDIA, 2016) ajoute une
**souplesse** (*compliance*) par contrainte : la raideur ne dépend plus du nombre d'itérations ni du
pas de temps, et le solveur donne une **estimation de la force** de chaque contrainte.

**Pour le comparateur.** Le modèle qui convient le mieux aux règles du propriétaire :

- une contrainte **dure** pour ce qui ne se négocie pas (pied d'appui immobile, pas de croisement) ;
- des contraintes **souples** pour ce qui peut varier un peu (distance des bassins, hauteur, écart
  des plexus), avec une souplesse par contrainte ;
- l'**estimation de force** de XPBD donnerait une valeur à l'échelle de pression 0 à 3 du
  [catalogue des contacts](../cadre/points-de-contact.md) : un indicateur, pas une mesure.

On n'a pas besoin de simuler la dynamique : on projette seulement **quelques variables** (racine de
chaque danseur dans le repère du couple, hauteur du bassin, inclinaison du buste, cibles des bras)
à partir de la pose paramétrique. Sans vitesse ni mémoire d'une image à l'autre, le résultat reste
une fonction du temps.

Sources : M. Müller, B. Heidelberger, M. Hennix, J. Ratcliff, *Position Based Dynamics*, VRIPHYS
2006 — https://matthias-research.github.io/pages/publications/posBasedDyn.pdf (lu, première page) ;
M. Macklin, M. Müller, N. Chentanez, *XPBD: Position-Based Simulation of Compliant Constrained
Dynamics*, 2016 — https://matthias-research.github.io/pages/publications/XPBD.pdf (lu, première page).

### 2. IK à deux personnages et à plusieurs effecteurs

**Principe.** FABRIK (Aristidou et Lasenby, 2011) gère plusieurs effecteurs et des contraintes
articulaires. Kim et al. (2009) éditent des mouvements de plusieurs personnages avec des
**contraintes linéaires** : position relative, orientation, synchronisation. Le **maillage
d'interaction** (Ho, Komura, Tai, 2010) relie les deux corps et préserve leurs relations spatiales en
déformant le moins possible ; la suite de 2013 pilote en temps réel un partenaire de danse.

**Pour le comparateur.** C'est l'outil des contacts du cadre : la main D du leader vise un site sur
le dos du suiveur, le coude D les côtes, les mains jointes se rejoignent, le bras G du suiveur se
pose sur le bras D du leader, chacun avec la tolérance de la spécification (A2, A4, A5). Les sites
bougent avec l'autre corps : l'IK doit voir **les deux** squelettes. Le maillage d'interaction
donne en plus un **critère** : de combien les distances entre corps (mains, bustes, cuisses,
bassins) changent quand un paramètre varie.

Sources : A. Aristidou, J. Lasenby, *FABRIK*, 2011 — https://www.andreasaristidou.com/FABRIK (lu) ;
M. Kim et al., *Synchronized Multi-Character Motion Editing*, SIGGRAPH 2009 —
https://history.siggraph.org/?p=108837 (lu) ; E. S. L. Ho, T. Komura, C.-L. Tai, SIGGRAPH 2010 —
https://researchportal.northumbria.ac.uk/en/publications/spatial-relationship-preserving-character-motion-adaptation/
(lu) ; E. S. L. Ho et al., ACM TOMM 2013 —
https://researchportal.northumbria.ac.uk/en/publications/interactive-partner-control-in-close-interactions-for-real-time-a/ (lu).

### 3. Collisions par capsules et priorité aux pieds

**Principe.** Les jeux approchent chaque segment par une **capsule** et repoussent les capsules
qui s'interpénètrent ; la correction ne doit jamais faire glisser un pied d'appui (verrouillage des
pieds de Holden : on corrige le bassin, le buste et les cibles, puis l'IK).

**Pour le comparateur.** La garde « aucun croisement d'os » devient une **contrainte de collision**
entre capsules de cuisse, de tibia et de genou (et entre bras, A6). Elle se résout sur ce qui peut
bouger sans glisser : racines dans le repère du couple, hauteur du bassin, pôle du genou, cible du
**pied libre**. Le pied d'appui reste verrouillé. Les tests GLB restent le juge final.

Source : D. Holden, *Code vs Data Driven Displacement*, 2021 —
https://theorangeduck.com/page/code-vs-data-driven-displacement (lu).

### 4. Équilibre : centre de masse au-dessus des appuis

**Principe.** Un corps est en équilibre statique si la projection de son centre de masse tombe dans
le polygone d'appui ; SIMBICON déplace la cible du pied libre selon l'écart et la vitesse du centre
de masse. Voir [physique, IK, procédural](physique-ik-procedural.md).

**Pour le comparateur.** En abrazo, les partenaires s'appuient un peu l'un sur l'autre au plexus :
on vérifie le **centre de masse du couple** dans l'enveloppe des quatre pieds, et celui de chaque
danseur avec une tolérance. Pendant un transfert d'appui, la projection passe d'un pied à l'autre :
c'est aussi un contrôle de cohérence entre `support` (déclaré par la figure) et la géométrie.

Sources : K. Yin, K. Loken, M. van de Panne, *SIMBICON*, 2007 —
https://www.cs.ubc.ca/~van/papers/2007-siggraph-simbicon.pdf (lu) ; Wikipédia, *Zero moment point* —
https://en.wikipedia.org/wiki/Zero_moment_point (lu).

### 5. Personnages physiques à contrôleurs PD (Euphoria, DeepMimic, DReCon)

**Principe.** Le squelette devient des corps rigides tirés vers la pose voulue par des servomoteurs
proportionnel-dérivé ; la physique gère contacts et équilibre. DReCon (Ubisoft La Forge, 2019) fait
suivre à un personnage physique une animation de référence.

**Pour le comparateur.** Ce serait la voie la plus « physique » (forces de contact, équilibre
naturel), mais elle perd la reproductibilité exacte et la garantie « aucun croisement », et demande
un long réglage. Usage raisonnable : **hors ligne**, comme juge de plausibilité d'une figure (« un
personnage physique peut-il suivre cette pose sans tomber ? »), pas comme moteur de rendu.

Sources : X. B. Peng et al., *DeepMimic*, 2018 — https://arxiv.org/pdf/1804.02717 (lu) ; Ubisoft La
Forge, *DReCon* —
https://www.ubisoft.com/en-us/studio/laforge/news/VjEIwquaIyEZZSw5RZI0V/drecon-datadriven-responsive-control-of-physicsbased-characters (lu).

### 6. Inertialisation des corrections

Quand un contact s'établit ou se rompt (fenêtre de répulsion des hanches, ouverture d'une sortie),
la correction du solveur change d'un coup. Comme pour une transition de figure, on **efface l'écart**
sur une courbe fermée au lieu de le laisser sauter (Bollo, *Gears of War*). Le couplage actuel des
bassins (`startCoupling`, `endCoupling`) le fait déjà à la main par un fondu.

Source : D. Bollo, *Inertialization*, GDC 2018 —
https://gdcvault.com/play/1025165/Inertialization-High-Performance-Animation-Transitions (lu, résumé).

## Les règles du propriétaire écrites comme contraintes

| Règle | Contrainte | Variable corrigée | Type | Test |
| --- | --- | --- | --- | --- |
| Pied d'appui immobile | position du pied verrouillée | aucune (prioritaire) | dure | existant |
| Aucun croisement d'os de jambe | distance entre capsules ≥ 0 | racines dans le repère du couple, pôle du genou, pied libre | dure | existant |
| **Distance bassin-bassin avant-arrière presque constante (#67)** | écart dans l'axe où les danseurs se font face, décalage latéral retiré, dans [d₀ − ε ; d₀ + ε] | racines des deux danseurs, **symétriquement** le long de cet axe | souple | à créer (#67) |
| **Pas de « monter-descendre » (#67)** | hauteur du bassin dans une bande étroite | longueur de pas (raccourcir plutôt que descendre), flexion des genoux | souple | à créer (#67) |
| Plexus contre plexus (#51) | écart des marqueurs de poitrine ≈ 8 cm | inclinaison du buste (déjà), puis racines si la distance des bassins le permet | souple | `test_plexus.mjs` |
| Règle des hanches (cadre) | distance des `contactPelvis` sous le seuil, sauf en fenêtre de répulsion | bassin du suiveur | souple, cible qui change avec l'intention | A9 |
| Contacts du cadre | main, coude, mains jointes, bras du suiveur sur leurs sites | chaînes des bras (IK à deux personnages) | souple, tolérances A2 à A5 | A2 à A6 |
| Quinconce, cuisses D/D | proximité des cuisses D au milieu ou en haut du fémur aux temps prévus | racines, pied libre | souple | A10 |
| Équilibre | centre de masse du couple dans l'enveloppe des appuis | racines, bassin | vérification d'abord | à créer |

**Ordre de priorité proposé** : pied d'appui > non-croisement > distance des bassins > hauteur >
plexus > hanches > bras. Les deux premières ne cèdent jamais ; une contrainte souple qui ne peut
pas être satisfaite **sans** violer une contrainte dure est signalée, pas forcée. C'est exactement
le cas observé avec `pelvisPull` : rapprocher les bassins croisait les jambes ; un solveur avec
cette priorité aurait rapproché les bassins **jusqu'à** la limite de non-croisement, et dit de
combien il restait.

### Pourquoi #67 s'y prête bien

- **Distance** : dans l'ida e volta, les deux bassins voyagent déjà ensemble (`carry`) ; dans les
  sorties, le décalage latéral est voulu. Une contrainte qui porte **seulement sur l'axe face à face**
  dans le repère du couple, appliquée symétriquement aux deux racines, ne touche ni au décalage
  latéral ni aux pieds : l'IK absorbe.
- **Hauteur** : aujourd'hui, la portée des jambes fixe la hauteur ; un pas long fait descendre le
  bassin. Les jeux font de même (*stride warping* : le bassin descend quand les jambes seraient trop
  tendues). La règle du propriétaire demande l'**inverse** : garder la hauteur et **raccourcir le
  pas** (ou ajuster la flexion des deux genoux), ce qui rejoint #56 et la « hauteur stable » du
  ginga #42.

## Faire converger vers des mouvements corrects

Trois usages, du plus sûr au plus ambitieux :

1. **Mesurer** (immédiat, #67) : distance avant-arrière des bassins, hauteur des bassins, centre de
   masse du couple, carte des distances entre corps, pour chaque figure en paire. On sait alors ce
   qui varie et de combien.
2. **Calibrer hors ligne avec un solveur** : remplacer les recherches à la main
   (`search_pas_courts.mjs`, `calibrate_placements.mjs`) par une projection de contraintes qui
   trouve les **paramètres** des échantillonneurs (longueurs de pas, placements, `carry`, couplage)
   satisfaisant toutes les règles, dans l'ordre de priorité. Le moteur en direct reste analytique,
   les tests GLB jugent. C'est l'usage qui fait le plus pour le réalisme à court terme.
3. **Projeter en direct** (mode guidage, niveau 3) : une couche de contraintes après la pose
   paramétrique et avant l'IK des jambes, sans mémoire, nombre fixe d'itérations, corrections
   inertialisées quand un contact change. Nécessaire seulement si le joueur peut déformer les
   figures (direction, longueur de pas).

Ordre dans le pipeline (usage 3) : pose paramétrique → contraintes du couple (racines, distance des
bassins, hauteur) → contraintes du haut du corps (plexus, bras du cadre) → IK des jambes, pieds
d'appui verrouillés → vérifications (croisement, sol, centre de masse).

## Questions ouvertes au propriétaire

1. **#67** : quelle tolérance pour la distance avant-arrière des bassins (quelques millimètres,
   un ou deux centimètres) et pour la variation de hauteur ?
2. **Ordre de priorité** des contraintes : celui proposé convient-il (pied d'appui, non-croisement,
   distance des bassins, hauteur, plexus, hanches, bras) ?
3. **Contact des bassins par style** : les sources divergent (espace en kizomba, contact en zouk et
   parfois en semba). La distance cible d₀ change-t-elle par style ?
4. **Solveur hors ligne d'abord** (calibrer les échantillonneurs) ou couche en direct ?
