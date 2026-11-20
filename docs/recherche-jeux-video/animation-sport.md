# Animation des jeux de sport : motion matching et apprentissage

[Hub de la recherche](README.md) · [Physique, IK, procédural](physique-ik-procedural.md) · [Interactions à deux](interactions-a-deux.md) · [Confrontation avec le moteur](confrontation-moteur.md)

Comment les jeux de sport (EA Sports et d'autres) donnent l'impression de vrais joueurs, ce que
cela coûte, et ce qu'un moteur sans capture de mouvement peut en reprendre. Recherche du
20 novembre 2026.

Légende : **lu** = page ouverte et lue ; **recherche** = vu seulement dans un résultat de
recherche (à revérifier avant citation).

> [!IMPORTANT]
> **En bref.** Dans les jeux, le réalisme vient des **données** (des heures de capture), pas de
> l'algorithme. Sans capture, aucune de ces techniques ne produit de réalisme à elle seule. Trois
> idées s'empruntent sans données : le choix de la figure suivante par un **score de compatibilité**,
> l'**inertialisation** pour changer de figure, et le vocabulaire **phase / amplitude / fréquence**
> pour décrire les styles.

## Motion matching (Ubisoft, For Honor)

**Principe.** Au lieu d'une machine à états de petits clips, on importe de longues prises de capture
brutes. Plusieurs fois par seconde, le moteur compose une requête (pose actuelle, surtout position
et vitesse des pieds, plus la trajectoire voulue à la manette) et cherche dans toute la base l'image
la plus proche. Il y saute avec un court fondu. Départs, arrêts et virages ne sont pas écrits à la
main : ils sortent des données. Le pied est ensuite recalé par IK.

**Qui.** *For Honor* (Ubisoft Montréal, 2016), Ubisoft Toronto, *The Last of Us Part II* (Naughty
Dog, 2020), puis Unreal Engine 5 (greffon Pose Search) et O3DE.

**Coût.** Quelques minutes de capture pour les transitions de navigation selon Clavet, bien plus en
production. L'équipe de Zadziuk faisait marcher l'acteur sur des tracés au sol prévus d'avance
(*dance cards*) pour couvrir vitesses et virages. O3DE chiffre la seule matrice de descripteurs à
environ 24 Mo par heure d'animation.

**Pour le comparateur : ne s'adapte pas tel quel.** Sans capture, il n'y a rien à chercher.
Remplir la base avec nos propres poses ne ferait que rejouer les échantillonneurs. Deux morceaux
s'adaptent :

- **Le choix de figure par score.** Au lieu de chercher une image, on note les figures candidates
  à une frontière de temps : pose d'entrée contre pose de sortie actuelle, pied d'appui, orientation,
  décalage du partenaire. C'est le motion matching au niveau de la figure.
- **Les *dance cards*** sont le jumeau de nos trajectoires de pieds par temps : eux enregistrent un
  humain qui marche un tracé, nous calculons le tracé.

Sources :
- S. Clavet (Ubisoft Montréal), *Motion Matching and The Road to Next-Gen Animation*, GDC 2016 —
  https://www.gdcvault.com/play/1022985/Motion-Matching-and-The-Road (lu).
- Game Developer, *Most Inspiring Game Animation Tech Talks of 2016* (résumé de la conférence
  *For Honor* : appariement sur les pieds, arbre k-d, déformation de trajectoire, IK des pieds) —
  https://www.gamedeveloper.com/programming/most-inspiring-game-animation-tech-talks-of-2016 (lu).
- K. Zadziuk (Ubisoft), *Motion Matching: The Future of Gameplay Animation Today*, GDC 2016
  Animation Bootcamp — https://www.gameanim.com/tag/kristjan-zadziuk/ (lu, page d'index).
- O3DE, *Motion Matching in O3DE* — https://docs.o3de.org/blog/posts/blog-motionmatching/ (lu).
- M. Mach, M. Zhuravlov (Naughty Dog), *Motion Matching in The Last of Us Part II*, GDC 2021 —
  https://gdcvault.com/play/1027118/Motion-Matching-in-The-Last (lu).
- Epic Games, *Motion Matching in Unreal Engine* —
  https://dev.epicgames.com/documentation/en-us/unreal-engine/motion-matching-in-unreal-engine (lu).

Unreal propose aussi une recherche à plusieurs personnages avec **rôles** (`MotionMatchMulti`,
recherche) : le choix du second personnage dépend de celui du premier. C'est le modèle d'un mode
leader / suiveur : la figure du suiveur est choisie **à partir de** l'intention du leader.

## Learned Motion Matching (Ubisoft La Forge, 2020)

Holden, Kanoun, Perepichka et Popa remplacent la base de données par trois petits réseaux
(décompresseur, pas à pas, projecteur). Sur leur grand jeu de données, la mémoire passe d'environ
590 Mo à environ 17 Mo. **Ne s'adapte pas** : cela résout un problème de mémoire que le comparateur
n'a pas. Les échantillonneurs tiennent déjà en quelques centaines de lignes.

Sources : D. Holden, *Learned Motion Matching* —
https://www.theorangeduck.com/page/learned-motion-matching (lu) ; Ubisoft La Forge,
*Introducing Learned Motion Matching* —
https://www.ubisoft.com/en-us/studio/laforge/news/6xXL85Q3bF2vEj76xmnmIu/introducing-learned-motion-matching (lu).

## EA Sports : d'Ignite à HyperMotion

| Génération | Ce qu'EA en dit | Données |
| --- | --- | --- |
| **ANT** (moteur d'animation maison, depuis Madden 2006) | Système à greffons ; aucune source ne le relie au motion matching | — |
| **Ignite** (FIFA 14, 2013) | « Human Intelligence » (décisions) et « True Player Motion » (corps piloté par la physique) | Plus de 1 000 nouvelles animations (recherche) |
| **Real Player Motion** (FIFA 18, 2017 ; UFC 3, 2018) | « Pose trajectory matching » à chaque image : famille du motion matching | Environ 5 000 animations reconstruites pour UFC 3 (recherche) |
| **HyperMotion** (FIFA 22, 2021) | 22 joueurs en combinaisons Xsens sur de vrais matchs à 11 contre 11 ; un algorithme appris (« ML-Flow ») ajuste foulée et cadence en temps réel | 8,7 millions d'images, plus de 4 000 animations |
| **HyperMotionV** (FC 24, 2023) | Données volumétriques de plus de 180 matchs filmés en stade, sans combinaison | Vidéo de matchs professionnels |

La tendance est claire : **toujours plus de données réelles**. EA publie aussi de la recherche
(Starke, Zaman et d'autres) restée à l'état de démonstration : Sebastian Starke disait en 2021 que
la superposition neuronale, entraînée sur environ 20 h de capture, n'était pas encore dans un jeu.

**Deux leçons transposables.**
1. **Séparer la décision du mouvement**, comme Ignite séparait « Human Intelligence » et « True
   Player Motion » : un mode de jeu ajoute une couche d'intention qui choisit les figures ; la couche
   paramétrique bouge les corps.
2. **Ajuster la foulée pour arriver au bon endroit au bon moment**, comme ML-Flow le fait pour
   atteindre le ballon. Les échantillonneurs le font déjà à la main (#56) ; cela peut rester
   analytique.

Sources :
- 80.lv, *EA uses machine learning for animations in FIFA 22*, 2021 —
  https://80.lv/articles/ea-uses-machine-learning-for-animations-in-fifa-22 (lu).
- Wikipédia, *EA Sports FC 24* (section HyperMotionV, d'après les Pitch Notes d'EA du 18 juillet
  2023) — https://en.wikipedia.org/wiki/EA_Sports_FC_24 (lu).
- EA, *FIFA 18 Real Player Motion Technology* —
  https://ea.com/games/fifa/news/fifa-18-real-player-motion-technology (recherche ; la page affiche
  aujourd'hui un autre contenu).
- EA, *EA Sports Ignite revealed*, 2013 — https://www.ea.com/en-gb/news/ignite-revealed (recherche).
- Inverse, entretien avec S. Starke (EA), 2021 —
  https://www.inverse.com/innovation/ea-games-motion-capture (lu).
- EA SEED, publications — https://careers.ea.com/seed/publications (lu).

## Contrôleurs neuronaux à phase (Édimbourg, EA)

| Travail | Idée | Données |
| --- | --- | --- |
| **PFNN** (Holden, Komura, Saito, SIGGRAPH 2017) | Les poids du réseau dépendent d'une **phase** du cycle de marche ; connaître la phase lève l'ambiguïté de la pose | Environ 2 h de capture ; 1,8 ms et 10 Mo à l'exécution |
| **Neural State Machine** (Starke et al., 2019) | Une structure de machine à états apprise : marche, s'asseoir, porter, franchir une porte | Capture avec décor (recherche) |
| **Local Motion Phases** (Starke, Zhao, Komura, Zaman, 2020) | Une phase **par membre**, déduite des contacts (pied au sol, main sur le ballon) ; démonstration : basket à un contre un, deux personnages | Données propriétaires (recherche) |
| **DeepPhase** (Starke, Mason, Komura, 2022) | Chaque canal de mouvement décomposé en sinusoïdes : amplitude, fréquence, décalage de phase ; applications dont la **danse sur musique** | Capture ; code de recherche |

**Le rapprochement le plus fort de cette recherche, sans les réseaux.**
- Le comparateur est **déjà « à phase »** : chaque pose est une fonction du temps musical. L'idée
  de PFNN (connaître la phase rend la pose moins ambiguë) justifie l'horloge unique.
- **Les phases locales = nos transferts d'appui explicites.** Les échantillonneurs écrivent à la
  main, temps par temps, ce que Local Motion Phases apprend.
- **DeepPhase donne un vocabulaire pour les styles** : roulis du bassin, tilt, flexion des genoux,
  chacun avec une amplitude, une fréquence et un décalage par rapport au temps. Si un jour quelques
  minutes de vidéo de référence par style existent, cette méthode pourrait **mesurer** ces valeurs
  pour calibrer les courbes, sans les remplacer.

Sources :
- D. Holden, T. Komura, J. Saito, *Phase-Functioned Neural Networks for Character Control*, 2017 —
  https://theorangeduck.com/page/phase-functioned-neural-networks-character-control (lu) ; diapositives
  https://www.theorangeduck.com/media/uploads/other_stuff/pfnn_slides.pdf (lu).
- S. Starke et al., *Neural State Machine for Character-Scene Interactions*, 2019 —
  https://www.ipab.inf.ed.ac.uk/cgvu/nsm.pdf (recherche).
- S. Starke et al., *Local Motion Phases for Learning Multi-Contact Character Movements*, 2020 —
  https://history.siggraph.org/?p=78734 (recherche).
- S. Starke, I. Mason, T. Komura, *DeepPhase*, 2022 — entretien SIGGRAPH
  https://blog.siggraph.org/2022/09/this-new-data-research-method-has-us-animated.html (lu) ; dépôt
  https://github.com/sebastianstarke/AI4Animation (lu).

## Ce que « zéro capture » veut dire

| Approche | Données minimales | Faisable sans capture ? |
| --- | --- | --- |
| Motion matching (For Honor, TLOU2, UE5) | Minutes à heures de capture structurée | Non |
| Learned Motion Matching | Idem, plus entraînement | Non |
| HyperMotion, HyperMotionV | Millions d'images, matchs entiers | Non |
| PFNN, NSM, Local Motion Phases | 2 à 20 h de capture ; en couple, capture de couples | Non |
| DeepPhase en analyse | Un peu de capture ou de pose extraite de vidéo | En partie, pour calibrer |
| Inertialisation, choix par score, pensée en phases | Aucune | **Oui** |

Si des données arrivent un jour, elles serviront à **calibrer** les courbes paramétriques, pas à
les remplacer : les tests (aucun croisement d'os, semelles au sol, calage sur le temps) restent.
