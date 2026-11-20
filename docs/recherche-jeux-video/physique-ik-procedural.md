# Physique, IK et animation procédurale

[Hub de la recherche](README.md) · [Animation de sport](animation-sport.md) · [Interactions à deux](interactions-a-deux.md) · [Confrontation avec le moteur](confrontation-moteur.md)

Comment les jeux corrigent, enchaînent et équilibrent des poses, et ce que le comparateur peut en
garder sans perdre la pureté de `applyPose` ni ses tests. Recherche du 20 novembre 2026.

Légende : **lu** = page ouverte et lue ; **recherche** = vu seulement dans un résultat de recherche.
Les passages marqués *déduction* sont un raisonnement de cette recherche, pas une affirmation des sources.

> [!IMPORTANT]
> **En bref.** L'**inertialisation** est la pièce qui manque pour changer de figure : on bascule tout
> de suite sur la nouvelle figure et on efface l'écart en une courbe fermée, donc la pose reste une
> fonction du temps. On l'applique au bassin, au buste et aux **cibles** des pieds, jamais aux os des
> jambes, puis on relance l'IK : pas de glissement, pas de croisement. L'**équilibre** se teste au
> lieu de se simuler. La physique complète (ragdoll actif, DeepMimic) reste hors du moteur.

## Ragdolls actifs et personnages physiques

**Principe.** Le squelette devient un ensemble de corps rigides dont les articulations sont tirées
vers l'angle voulu par des servomoteurs (proportionnel-dérivé). L'animation donne la cible, la
physique décide du résultat. Euphoria (NaturalMotion) ajoute des comportements moteurs simulés
(se rattraper, tituber).

**Qui.** Euphoria : *GTA IV*, *Red Dead Redemption*, *Backbreaker*. EA : moteur d'impact de FIFA 12
(chaque contact évalué selon taille, force et angle, recherche), coups physiques de *Fight Night
Champion* (recherche), physique de contact et nouveau ragdoll dans *UFC 6* (2026, lu).

**Coût dans un navigateur.** Faisable pour deux danseurs avec un moteur physique en WebAssembly,
mais réglage difficile des gains, tremblements, résultats qui dépendent de la cadence d'images, et
des tests qui deviennent statistiques.

**Pour le comparateur : ne s'adapte pas comme moteur principal.** La pose ne serait plus une
fonction du temps, l'oracle exact et la garantie « aucun croisement » tomberaient. Utilisable en
second plan : un ressort sur les parties qui ne portent pas (bras libre, tête), ou pour donner au
suiveur un temps de réaction (voir les ressorts plus bas).

Sources :
- Wikipédia, *Euphoria (software)* — https://en.wikipedia.org/wiki/Euphoria_(software) (lu).
- UFC.com, *EA Sports UFC 6 reveals major changes…*, 19 mai 2026 —
  https://www.ufc.com/news/ea-sports-ufc-6-reveals-major-changes-fighter-likeness-gameplay-physics-and-presentation (lu).
- L. Mc Garry Hunt, *8 tips for animating active ragdolls*, Game Developer, 2021 —
  https://gamedeveloper.com/design/8-tips-for-animating-active-ragdolls (lu).
- EA, *FIFA 12 Player Impact Engine*, 2011 — https://www.ea.com/news/fifa12-player-impact-engine-01
  (recherche ; la page renvoie une erreur 404).

## Contrôle physique en recherche : SIMBICON, DeepMimic

**SIMBICON** (Yin, Loken, van de Panne, 2007) fait marcher un bipède simulé avec une petite machine
à états de poses cibles et une règle d'équilibre : la cible du pied libre se déplace selon l'écart
et la vitesse du centre de masse par rapport au pied d'appui. Le milieu des hanches sert
d'approximation du centre de masse. **DeepMimic** (Peng et al., 2018) apprend par renforcement à
imiter un clip, capturé **ou animé à la main** ; sa liste de gestes contient deux danses. Coût :
environ 60 millions d'échantillons et deux jours sur huit cœurs **par geste**.

**Pour le comparateur : emprunter la règle d'équilibre, pas la simulation.** La règle de SIMBICON
s'évalue sur la pose paramétrique : pendant un transfert d'appui, l'écart et la vitesse du centre de
masse disent de quel côté le prochain pied doit se poser. C'est un **test** possible. DeepMimic
pourrait un jour « rendre physiques » les échantillonneurs, mais c'est un projet de recherche.

Sources :
- K. Yin, K. Loken, M. van de Panne, *SIMBICON: Simple Biped Locomotion Control*, ACM TOG 2007 —
  https://www.cs.ubc.ca/~van/papers/2007-siggraph-simbicon.pdf (lu).
- X. B. Peng, P. Abbeel, S. Levine, M. van de Panne, *DeepMimic*, SIGGRAPH 2018 —
  https://arxiv.org/pdf/1804.02717 (lu) ; https://xbpeng.github.io/projects/DeepMimic (lu).

## Équilibre : centre de masse, polygone d'appui, point de moment nul

Statiquement, un corps est en équilibre si la projection au sol de son centre de masse reste dans
le **polygone d'appui** (l'enveloppe des contacts). Dynamiquement, le **point de moment nul** (ZMP)
doit rester dans la zone d'appui ; la distance au bord sert de marge de stabilité (robots Honda
P2 / ASIMO).

**Coût.** Une somme pondérée d'une quinzaine de segments par danseur : quelques microsecondes. Le
ZMP demande l'accélération du centre de masse, exacte par différence finie sur f(t).

**Pour le comparateur : s'adapte très bien, comme invariant de test.** Un transfert d'appui, c'est
littéralement la projection du centre de masse qui passe d'un pied à l'autre. Tests possibles :
pendant un appui simple, la projection reste au-dessus du pied d'appui ; elle ne change de pied
que pendant le double appui. *Déduction :* en abrazo, les partenaires s'appuient l'un sur l'autre
au plexus ; le test robuste porte sur le **centre de masse du couple** dans l'enveloppe des quatre
pieds, avec une tolérance par danseur.

Sources : Wikipédia, *Zero moment point* — https://en.wikipedia.org/wiki/Zero_moment_point (lu) ;
M. Vukobratović, B. Borovac, *Zero-Moment Point — Thirty Five Years of its Life*, 2004 —
https://cs.utexas.edu/~shivaram/readings/b2hd-VukobratovicBorovac2005.html (recherche).

## IK des jambes et pose du pied

L'IK à deux os est analytique (loi des cosinus, plan de flexion donné par un vecteur pôle). Les
moteurs l'appliquent après l'animation : nœuds *Leg IK* et *Foot Placement* d'Unreal, *Two Bone IK*
d'Unity, `CCDIKSolver` de three.js.

**Pour le comparateur : déjà en place.** À reprendre des moteurs : correction de torsion du genou,
butée anti-hyperextension, et un **pôle stable par figure**. *Déduction :* avec les cuisses
intercalées, un genou qui bascule créerait justement le croisement que les tests interdisent.

Sources : D. Holden, *Simple Two Joint IK*, 2017 — https://theorangeduck.com/page/simple-two-joint
(lu) ; Unity, *Two Bone IK* —
https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.2/manual/constraints/TwoBoneIKConstraint.html
(lu) ; three.js, *CCDIKSolver* — https://threejs.org/docs/pages/CCDIKSolver.html (lu).

## Verrouillage des pieds (*foot locking*)

Quand un contact commence, on mémorise le point au sol et on y amène la cible du pied ; on la
relâche quand le contact finit ou quand le pied animé s'en éloigne au-delà d'un **rayon de
déverrouillage** ; l'IK épingle le pied. Holden prévient que c'est difficile à rendre joli, surtout
au relâchement.

**Pour le comparateur : déjà acquis pour les figures stables** (`gaitStep` et l'IK gardent le pied
d'appui immobile). Il devient nécessaire dès qu'une **transition** ou une **déformation** ajoute un
écart. Le rayon de déverrouillage donne une tolérance testable : un pied d'appui ne dérive jamais
de plus de *r* mm.

Source : D. Holden, *Code vs Data Driven Displacement*, 2021, section « Sliding and Foot Locking » —
https://theorangeduck.com/page/code-vs-data-driven-displacement (lu).

## Déformations : foulée, orientation, distance, motion warping

- **Distance matching** (*Paragon*, Epic) : la tête de lecture du clip suit la distance à la cible
  au lieu du temps, pour s'arrêter pile sans glisser (recherche).
- **Stride warping** : on allonge ou raccourcit la foulée ; le bassin descend quand les jambes
  seraient trop tendues.
- **Orientation warping** : on tourne les jambes vers la direction de déplacement et on contre-tourne
  la colonne.
- **Motion warping** (UE5, *Gears of War 4*) : dans une fenêtre marquée du clip, la trajectoire de
  la racine est déformée pour atteindre une cible.

**Pour le comparateur : s'adapte bien au mode de jeu.** *Déduction :* les échantillonneurs utilisent
déjà le temps comme tête de lecture ; le *distance matching* ferait finir un pas du suiveur là où
le guidage le met. Le *stride warping* avec descente du bassin correspond au travail des pas plus
courts (#56), à longueurs d'os constantes. Le *motion warping* par compte permet de partir d'où la
figure précédente s'est arrêtée, à condition de déformer le **repère du couple** et non un danseur
seul (voir [interactions à deux](interactions-a-deux.md)).

Sources : Epic, *Pose Warping in Unreal Engine* —
https://dev.epicgames.com/documentation/unreal-engine/pose-warping-in-unreal-engine (lu) ; Epic,
*Motion Warping in Unreal Engine* —
https://dev.epicgames.com/documentation/unreal-engine/motion-warping-in-unreal-engine (lu) ; forum
Epic, *Animation Techniques used in Paragon*, janvier 2016 —
https://forums.unrealengine.com/t/animation-techniques-used-in-paragon-and-january-game-jam-theme-announcement-live-from-epic-hq/52339
(lu) ; D. Bollo, *High Performance Animation in Gears of War 4*, SIGGRAPH 2017 —
https://history.siggraph.org/wp-content/uploads/2022/09/2017-Talks-Bollo_High-Performance-Animation-in-Gears-of-War-4.pdf (lu).

## Animation procédurale (Overgrowth, Rain World)

David Rosen (Wolfire, GDC 2014) montre une animation fluide et interactive tirée de **très peu de
poses clés** et de couches procédurales simples. *Rain World* construit ses créatures sur quelques
points physiques et anime membres et queue par-dessus. C'est la même philosophie que le
comparateur : peu de poses expressives, du code pour la vie. Le détail technique de la conférence
de Rosen n'a pas pu être vérifié (vidéo réservée aux membres).

Sources : GDC Vault, D. Rosen, *An Indie Approach to Procedural Animation*, 2014 —
https://gdcvault.com/play/1020049/Animation-Bootcamp-An-Indie-Approach (lu, résumé) ; Game
Developer, *Animating Rain World…* —
https://gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures (lu).

## Ressorts amortis (Holden, « Spring-It-On »)

Des ressorts à amortissement critique, **exacts** et indépendants de la cadence d'images, réglés
par une **demi-vie** plutôt qu'une raideur. Leurs solutions sont fermées : un ressort lancé à t0
depuis un état connu se calcule directement à l'instant t.

**Pour le comparateur : s'adapte, avec une règle.** Un ressort avancé image par image casserait
« pose = f(t) ». *Déduction :* si chaque événement (transition, intention du joueur) est horodaté,
le ressort reste une fonction du temps et de la liste d'événements, donc testable. Usages : la
réaction du suiveur au guidage (demi-vie ≈ temps de réaction), les bras et la tête, la caméra.

Source : D. Holden, *Spring-It-On: The Game Developer's Spring-Roll-Call*, 2021 —
https://theorangeduck.com/page/spring-roll-call (lu).

## Inertialisation (Bollo, Gears of War)

**Principe.** À la transition, on **bascule tout de suite** sur la nouvelle animation et on mémorise
l'écart (position et vitesse, par articulation) entre l'ancienne et la nouvelle. Cet écart décroît
jusqu'à zéro selon une courbe de degré 5 qui ne dépasse pas, et s'ajoute à la nouvelle animation.
Holden propose une variante par ressort ; le *dead blending* (2023) prolonge l'ancienne pose au lieu
de l'écart. *Gears of War 4* choisissait aussi l'image d'entrée du nouveau cycle pour que les pas
tombent juste.

**Coût.** Une seule pose évaluée ; Bollo mesure 12 µs contre 30 µs pour un fondu, soit 60 % de moins.

**Pour le comparateur : le meilleur emprunt de cette page.** Passer de la figure A à la figure B au
temps t0 : la pose vaut B(t) plus un écart qui s'efface depuis t0. Elle reste une fonction du temps
et du calendrier des transitions. Règles (*déduction*) :

1. Inertialiser le **bassin, le buste** et les **cibles des pieds** en coordonnées du monde, pied
   d'appui verrouillé, puis relancer l'IK. Jamais les rotations des os de jambe.
2. Choisir t0 et l'entrée de B pour que les **appuis concordent** : même pied porteur, centre de
   masse du même côté (l'équivalent danse de l'appariement de phase de Gears).
3. Courbe de degré 5 pour une transition de durée fixe calée sur un compte ; ressort si la fin est libre.
4. Ajouter un test : aucun pied d'appui ne dérive pendant la transition, et la garde « aucun
   croisement d'os » tient sur toute la fenêtre.

Sources : D. Bollo, *Inertialization: High-Performance Animation Transitions in Gears of War*,
GDC 2018 — https://gdcvault.com/play/1025165/Inertialization-High-Performance-Animation-Transitions
(lu, résumé) ; D. Bollo, SIGGRAPH 2017, PDF ci-dessus (lu) ; D. Holden, *Inertialization Transition
Cost*, 2022 — https://theorangeduck.com/page/inertialization-transition-cost (lu) ; D. Holden,
*Dead Blending Node in Unreal Engine*, 2023 —
https://theorangeduck.com/page/dead-blending-node-unreal-engine (lu).

## IK du corps entier, regard, bassin piloté par le centre de masse

FABRIK (Aristidou et Lasenby, 2011) résout l'IK par passes successives le long des segments, avec
contraintes et plusieurs effecteurs. Les solveurs commerciaux (Final IK, Animation Rigging)
répartissent un regard sur colonne, cou et tête avec des poids décroissants.

**Pour le comparateur : utile au cas par cas.** Inutile pour les jambes (l'IK à deux os est
meilleure). Utile pour : (a) le **regard** vers le partenaire ou la direction d'un tour, (b) un
petit **contact plexus contre plexus** où le sternum de chaque buste est tiré vers un point partagé,
(c) un **bassin piloté par le centre de masse** du couple. À placer après la pose paramétrique et
avant l'IK des jambes, en revérifiant l'isolation (`iso=1`).

Source : A. Aristidou, J. Lasenby, *FABRIK*, Graphical Models 2011 —
https://www.andreasaristidou.com/FABRIK (lu).
