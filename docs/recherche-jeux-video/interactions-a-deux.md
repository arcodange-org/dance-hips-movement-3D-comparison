# Machines à états et interactions à deux personnages

[Hub de la recherche](README.md) · [Animation de sport](animation-sport.md) · [Physique, IK, procédural](physique-ik-procedural.md) · [Confrontation avec le moteur](confrontation-moteur.md) · [Mode guidage](mode-guidage.md)

Comment les jeux enchaînent des animations et coordonnent deux personnages qui se touchent (prises,
corps à corps, combats), et ce que la recherche propose pour les couples. Recherche du 20 novembre 2026.

Légende : **lu** = page ouverte et lue ; **recherche** = vu seulement dans un résultat de recherche.

> [!IMPORTANT]
> **En bref.** Le comparateur fait **déjà** de l'« animation appariée », mais calculée au lieu
> d'être capturée : un seul échantillonneur et une seule horloge pour les deux danseurs, donc aucune
> désynchronisation possible. Ce qui manque est **entre** les figures. La réponse des jeux est une
> **machine à états** dont les sorties tombent sur le temps, un **état pivot** (la quinconce, poids
> sur des pieds connus) et une règle de compatibilité : la figure B ne suit A que si A finit sur le
> pied d'appui où B commence.

## Machines à états et transitions (Unity, Unreal)

Un graphe d'états (un clip ou un mélange de clips) reliés par des transitions à sens unique, chacune
avec une condition et une durée de fondu. Unity ajoute un **temps de sortie** : la transition n'est
examinée qu'à partir d'un moment donné du clip. Unreal ajoute des **conduits** (carrefours) et des
**alias d'état** pour éviter l'explosion du nombre de transitions.

**Pour le comparateur : c'est le squelette du mode de jeu.** Les figures sont les états. Le temps de
sortie devient une **sortie calée sur le temps** : une figure ne se quitte qu'à son dernier temps,
ou à des temps de sortie listés. Le conduit devient la **quinconce neutre**, d'où toutes les figures
partent : on évite un graphe N × N. Un état vaut (figure, temps dans la figure) et la pose vaut
`échantillonneur(figure, temps)` : pas de temps de clip qui dérive.

Sources : Unity, *Animation transitions* —
https://docs.unity.com/en-us/engine/current/manual/animation-section/animation-mecanim/animation-animator-controller/animation-state-machines/class-transition
(lu) ; Epic, *State Machines in Unreal Engine* —
https://dev.epicgames.com/documentation/en-us/unreal-engine/state-machines-in-unreal-engine (lu).

## Espaces de mélange (*blend spaces*)

Un nœud qui interpole plusieurs clips selon un à trois paramètres continus (vitesse, direction).
**Pour le comparateur :** les échantillonneurs prennent déjà des paramètres continus (style,
amplitude, longueur de pas). Un espace de mélange revient à **évaluer l'échantillonneur avec des
paramètres interpolés**, sans mélanger deux poses. Mélanger deux figures **différentes** pose par
pose est risqué : pieds qui glissent, os qui se croisent. Mélanger les paramètres d'une figure, oui ;
mélanger deux figures, non.

Source : Epic, *Blend Spaces in Unreal Engine* —
https://dev.epicgames.com/documentation/en-us/unreal-engine/blend-spaces-in-unreal-engine (recherche).

## Groupes et marqueurs de synchronisation (Unreal)

Les animations d'un groupe partagent une ligne de temps : l'une **mène**, les autres adaptent leur
vitesse. Des **marqueurs** nommés (« pied droit posé ») alignent les cycles. Sans marqueurs communs,
Unreal revient à une simple mise à l'échelle des durées.

**Pour le comparateur : l'idée est déjà là, en mieux.** L'horloge des temps est le meneur unique ;
les **transferts d'appui** explicites sont les marqueurs naturels. L'emprunt utile : le marqueur
comme **clé de compatibilité** entre figures (même pied porteur à la sortie de A et à l'entrée de B).

Source : Epic, *Animation Sync Groups in Unreal Engine* —
https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-sync-groups-in-unreal-engine (lu).

## Animations appariées (action, combat)

Deux personnages jouent **une animation écrite ensemble** (l'attaque et la réaction), calés au départ
sur un repère commun ; aucun ne peut agir seul avant la fin. Défaut connu : l'animation ignore ce
qui précédait, donc le couple « saute » en place à l'entrée. Exemples : *Assassin's Creed* avant
*Origins*, *Batman Arkham*, prises des jeux de combat. Le contenu croît avec le nombre d'interactions.

**Pour le comparateur : le moteur fonctionne déjà ainsi.** Un échantillonneur qui sort les deux
danseurs à partir d'un même temps **est** une animation appariée. Il hérite du même défaut : entrer
dans une figure depuis n'importe quel état ferait sauter le couple. Le remède est le même : n'entrer
que depuis un état compatible (quinconce, pieds d'appui concordants) et garder le verrou explicite
(pendant une figure, le suiveur ne peut pas être guidé ailleurs avant le prochain temps de sortie).

Source : C. Wagar, *What the Heck is Paired Animation?*, CritPoints, 2020 —
https://critpoints.net/2020/03/24/what-the-fuck-is-paired-animation/ (lu).

## Fenêtres d'annulation et de contre (jeux de combat, WWE 2K)

Un coup a un démarrage, une phase active et une récupération. Une **annulation** saute la
récupération vers un autre coup, mais seulement dans une **fenêtre**. Dans *WWE 2K*, le contre est
une pression à placer pendant le coup adverse ; la largeur de la fenêtre dépend du coup et de la
difficulté, et le jeu dit « trop tôt / trop tard » (recherche).

**Pour le comparateur : s'adapte directement.** En danse sociale, le leader **prépare** la figure
suivante avant qu'elle commence. L'équivalent est une **fenêtre d'intention sur les un ou deux
derniers temps** de la figure en cours. Une intention dans la fenêtre choisit la suite ; sans
intention, le couple revient au pas de base. « Trop tôt / trop tard » devient « la suiveuse n'a pas
reçu le guidage ».

Sources : games.gg, *WWE 2K26 reversals, counters, kick-outs* —
https://games.gg/wwe-2k26/guides/reversals-counters-kick-outs/ (recherche) ; Prima Games, *Reading
frame data* — https://primagames.com/eguides/street-fighter-v-eguide/primer/reading-frame-data (recherche).

## Combat « Freeflow » de Batman Arkham

Le joueur frappe ou contre avec une direction ; Batman rejoint l'ennemi choisi et enchaîne des paires
attaque / réaction. Une version de développement était **calée sur la musique** ; Rocksteady l'a
abandonnée. L'objectif affiché : un combat chorégraphié, cinématographique et rythmé.

**Pour le comparateur : leçon de conception.** Une entrée par créneau, une direction, et une chaîne de
figures écrites qui paraît chorégraphiée : c'est la forme d'un mode leader. Un jeu de danse ne peut
pas abandonner le calage musical (c'est le sujet), mais il peut être **indulgent** en ramenant une
entrée un peu tôt ou un peu tard sur le temps suivant.

Sources : D. L. Craddock, *Welcome to the Madhouse, chapitre 3*, 2016 —
https://episodiccontentmag.com/2016/03/11/batmanaa_chapter3/ (lu) ; S. Costiuc, *Batman: Arkham
Design Analysis (Part 1)*, Game Developer, 2018 —
https://gamedeveloper.com/design/batman-arkham-design-analysis-part-1- (lu).

## Animation contextuelle et *motion warping* (Unreal)

Une scène déclare des **rôles** (celui qui agit, la cible), un montage par rôle et des critères
d'entrée (cône, distance). Le *motion warping* déforme la trajectoire de la racine de l'initiateur
dans une **fenêtre** pour atteindre une **cible** posée sur l'autre acteur.

**Pour le comparateur : un vocabulaire à reprendre.** Rôles (leader, suiveur), **ancre de scène**
(le repère du couple entre les deux bassins), critères d'entrée par figure (pieds d'appui,
orientation relative). Le *motion warping* devient : **courber la trajectoire du repère du couple**
vers la direction voulue par le joueur, sur une fenêtre de temps, les deux corps restant dans ce
repère. Déformer un seul danseur casserait l'abrazo.

Sources : Epic, *Motion Warping in Unreal Engine* —
https://dev.epicgames.com/documentation/en-us/unreal-engine/motion-warping-in-unreal-engine (lu) ;
vorixo, *Contextual Animation* — https://vorixo.github.io/devtricks/contextual-anim (lu).

## Corps à corps sportif : EA UFC, Fight Night

*UFC 3* introduit Real Player Motion (environ 5 000 animations de frappe et de déplacement) ; *UFC 4*
l'étend au **clinch**, où l'on entre et sort en se rapprochant ou en s'éloignant. Au sol, chaque
position offre quelques **transitions directionnelles** que l'adversaire peut refuser. EA n'a pas
publié le fonctionnement interne.

**Pour le comparateur : le modèle de conception s'adapte, pas la technique.** Un **graphe de
positions à sorties directionnelles** convient à l'abrazo : chaque position du couple (fermée, sortie,
quart de tour) offre quelques sorties au stick du leader. Le volume de capture est hors sujet : un
échantillonneur par transition suffit.

Sources : EA, *UFC 4 gameplay* — https://ea.com/games/ufc/ufc-4/gameplay (recherche) ; EA, *UFC 3
Gameplay Update #10* — https://ea.com/games/ufc/ufc-3/news/ufc-3-gameplay-update-10 (recherche).

## Recherche : maillage d'interaction (Ho, Komura, Tai 2010) et partenaire en temps réel (2013)

Le **maillage d'interaction** relie les parties du corps des deux personnages en un maillage
volumique à chaque image. On adapte le mouvement en **déformant le moins possible** ce maillage : les
relations spatiales sont préservées, les interpénétrations réduites. Exemples : danse, lutte, combat
à l'épée. La suite de 2013 synthétise **en temps réel** un partenaire virtuel qui répond à un
personnage piloté par l'utilisateur, en **danse de couple** notamment ; elle désigne la prédiction de
l'intention du joueur comme la difficulté centrale.

**Pour le comparateur : le travail antérieur le plus proche du mode guidage.** Les échantillonneurs
définissent déjà l'interaction de référence, sans capture. Une mesure de déformation du maillage
d'interaction ferait un bon **test** : de combien le graphe des distances entre corps (mains, bustes,
cuisses) change quand un paramètre varie (longueur de pas, style, direction du joueur). Cela
généraliserait la garde « aucun croisement ».

Sources : E. S. L. Ho, T. Komura, C.-L. Tai, *Spatial relationship preserving character motion
adaptation*, SIGGRAPH 2010 —
https://researchportal.northumbria.ac.uk/en/publications/spatial-relationship-preserving-character-motion-adaptation/
(lu) ; E. S. L. Ho, J. C. P. Chan, T. Komura, H. Leung, *Interactive partner control in close
interactions for real-time applications*, ACM TOMM 2013 —
https://researchportal.northumbria.ac.uk/en/publications/interactive-partner-control-in-close-interactions-for-real-time-a/ (lu).

## Recherche : synthèse à deux à partir de données

- **Kwon et al. 2008** : arts martiaux en paire, **graphe de transitions couplé** et réseau bayésien
  sur ce que fait l'un selon l'autre (recherche).
- **Shum et al. 2008, *Interaction patches*** : petites unités d'interaction précalculées, recollées
  dans l'espace et le temps (recherche).
- **Kim et al. 2009** : édition de mouvements **synchronisés** à plusieurs, les interactions étant
  des contraintes linéaires (position relative, orientation, synchronisation) (lu).

Les **structures** se transposent, pas la dépendance aux données : le graphe couplé de Kwon est la
version formelle de la machine à états des figures ; les *patches* de Shum sont des figures ; les
contraintes de Kim décrivent bien le contrat du moteur (position et orientation dans le repère du
couple, transferts synchronisés sur les temps).

Sources : T. Kwon et al., IEEE TVCG 2008 — https://pubmed.ncbi.nlm.nih.gov/18369275/ (recherche) ;
H. P. H. Shum et al., SIGGRAPH Asia 2008 — https://hubertshum.com/pbl_siggraphasia2008interaction.htm
(recherche) ; M. Kim et al., *Synchronized Multi-Character Motion Editing*, SIGGRAPH 2009 —
https://history.siggraph.org/?p=108837 (lu).

## Recherche : génération apprise du suiveur (Duolando, ReMoS, InterGen)

- **Duolando** (ICLR 2024) génère le **suiveur** à partir du mouvement du **leader** et de la musique.
  La racine du suiveur est exprimée **relativement au leader** ; le modèle **regarde en avance** le
  mouvement à venir du leader ; un apprentissage par renforcement réduit le glissement des pieds.
  Jeu de données DD100 : environ 117 min, dix genres (salon, latines, ballet), **aucune** des six
  danses du comparateur ; pas de mesure d'interpénétration.
- **ReMoS** (ECCV 2024) : réaction d'un partenaire, dont du Lindy Hop (recherche).
- **InterGen** (2023) : deux personnes à partir d'un texte, avec des pertes sur la **carte des
  distances** entre articulations quand les corps sont proches et sur l'**orientation relative**.

**Pour le comparateur : pas comme moteur** (pas de données, résultats non déterministes, aucune
garantie de contact ni de non-croisement). **Mais leur découpage confirme le moteur** : (a) le suiveur
s'exprime dans le repère du leader ; (b) le suiveur a besoin de **voir en avance** l'intention du
leader, l'équivalent calculé de la préparation du guidage ; (c) carte des distances, orientation
relative et taux de glissement des pieds feraient de bons **critères de test** à côté de la garde
« aucun croisement ».

Sources : L. Siyao et al., *Duolando*, ICLR 2024 — https://lisiyao21.github.io/projects/Duolando (lu),
https://arxiv.org/html/2403.18811v1 (lu) ; A. Ghosh et al., *ReMoS*, ECCV 2024 —
https://vcai.mpi-inf.mpg.de/projects/remos (recherche) ; H. Liang et al., *InterGen* —
https://tr3e.github.io/intergen-page (lu).

## Contrat entre les deux personnages

| Technique | Ancre d'alignement | Contrat de contact | Contrat de temps | Désynchronisation |
| --- | --- | --- | --- | --- |
| Marqueurs de synchronisation | aucune (par personnage) | aucun | clip meneur et marqueurs | marqueurs absents ignorés |
| Animation appariée | repère commun au départ | inscrit dans le clip commun | un seul clip | saut à l'entrée, verrou jusqu'à la fin |
| Animation contextuelle + *motion warping* | cible sur l'acteur principal | montages par rôle | sections de montage | déformation de la racine de l'initiateur |
| Maillage d'interaction | relations entre les deux corps | déformation minimale | à chaque image | le solveur répartit l'erreur |
| Duolando | racine du suiveur = racine du leader + décalage | souple (fréquence de contact) | musique et leader, avec anticipation | aucune garantie |
| **Le comparateur aujourd'hui** | repère du couple, un seul échantillonneur | plexus, cuisses intercalées, tests sans croisement | une horloge pour les deux | impossible par construction |
