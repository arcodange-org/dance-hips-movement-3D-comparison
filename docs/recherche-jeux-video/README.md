# Recherche : ce que le comparateur peut emprunter aux jeux vidéo de sport

[Accueil du dépôt](../../README.md) · [Issue #63](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/63) · [Recherche biomécanique](../recherche-biomecanique/README.md) · [Ginga #42](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/42)

Recherche documentaire du 20 novembre 2026, en anglais et en français, menée par cinq recherches
parallèles puis relue et confrontée au code. Elle répond à deux demandes du propriétaire :
« voir ce que l'on peut emprunter des jeux vidéo de sports comme ceux d'EA Sports (avec POOC,
etc.) » et « un mode jeu vidéo où l'on peut guider sa partenaire ». **Elle ne modifie pas le code.**

> [!IMPORTANT]
> **Constats principaux**
>
> - **Dans les jeux de sport, le réalisme vient des données.** Motion matching (*For Honor*,
>   *The Last of Us Part II*), Real Player Motion et HyperMotion d'EA (8,7 millions d'images de
>   matchs en combinaison de capture pour FIFA 22) reposent sur des heures de capture. Aucune donnée
>   n'existe pour les six danses : ces techniques ne s'appliquent pas telles quelles.
> - **Le comparateur fait déjà, à la main, ce que la recherche apprend.** Des poses fonctions de la
>   phase (PFNN), des phases par contact de pied (Local Motion Phases, EA), une animation appariée
>   des deux danseurs sur une seule horloge : la désynchronisation est impossible par construction.
> - **Ce qui manque est entre les figures**, et les jeux y répondent sans données : machine à états
>   dont les sorties tombent sur le temps, état pivot (la quinconce), inertialisation des transitions.
> - **Aucun jeu trouvé ne note le guidage en couple.** Le mode guidage serait nouveau. La science du
>   guidage donne des repères chiffrés : forces de 5 à 15 N en moyenne (des signaux, pas une poussée),
>   un bon suiveur à environ 224 ms de retard, un guidage qui commence au pas précédent.
> - **Les interactions physiques s'écrivent comme des contraintes** (contact, distance des bassins,
>   hauteur, non-pénétration, équilibre) que les jeux résolvent par projection de positions
>   (PBD, XPBD) : d'abord pour calibrer les figures hors ligne, ensuite en direct si besoin.
> - **L'avance de 0,25 temps du buste du leader**, déjà dans le code, tombe dans la plage de retard
>   mesurée pour un bon suiveur (167 ms à 90 bpm).

## Recommandation : les trois emprunts les plus utiles

1. **Une machine à états de figures calée sur le temps, avec la quinconce comme état pivot.**
   Une figure ne se quitte qu'à une frontière de temps ; la suivante ne démarre que si les pieds
   d'appui concordent (marqueurs de synchronisation d'Unreal, fenêtres d'annulation des jeux de
   combat). Toute pose jouable reste une pose déjà testée sur le GLB. Coût faible : un module pur au
   dessus des échantillonneurs. C'est le socle du mode guidage.
2. **Des transferts d'appui déclenchés et jugés comme dans un jeu de rythme, l'action toujours
   rendue sur le temps** (*Hi-Fi Rush*, *Crypt of the NecroDancer*). C'est la suite naturelle du
   ginga #42, dont la phase avance déjà par transfert : le joueur déclenche les transferts, le ginga
   de la partenaire suit. Fenêtres en fraction de temps, calibration de la latence du navigateur.
3. **L'inertialisation pour les transitions hors quinconce** (Bollo, *Gears of War* ; Holden). On
   bascule sur la nouvelle figure et on efface l'écart en une courbe fermée, sur le bassin, le buste
   et les **cibles** des pieds, puis l'IK : la pose reste une fonction du temps, sans glissement ni
   croisement. Coût moyen ; utile seulement si l'on veut interrompre une figure.

**À écarter pour le moteur** : motion matching, réseaux appris (PFNN, Duolando), physique complète
(ragdoll actif, DeepMimic). Ils demandent des captures de couples réels, cassent la reproductibilité
ou la garantie « aucun croisement d'os ». Si des données arrivent un jour, elles serviront à
**calibrer** les courbes, pas à les remplacer. Trois idées de recherche valent un **test** :
l'équilibre (centre de masse du couple au-dessus des appuis), la carte des distances entre les corps
(InterGen) et la déformation du maillage d'interaction (Ho et Komura).

## Le mode guidage en bref

Le joueur est le leader. Il tient l'abrazo, donne ses intentions **avant** le temps (transfert,
figure, direction) ; la suiveuse les exécute **sur** le temps avec les échantillonneurs existants ;
sur un guidage ambigu, elle reste au pas de base et hésite visiblement. Trois niveaux : (1)
transferts guidés sur place qui déclenchent le ginga, (2) figures au choix depuis la quinconce, (3)
guidage continu du repère du couple. Détails, commandes, retours et tests : [mode guidage](mode-guidage.md).

## « POOC » = preuve de concept

Le propriétaire l'a confirmé le 20 novembre 2026 : « POOC » était une **faute de frappe pour « PoC »**
(preuve de concept). Ce n'est pas un terme technique : il n'existe ni dans la littérature d'animation
ni chez EA. L'idée colle pourtant à ce que montre
la recherche : EA a présenté beaucoup de démonstrations de recherche jamais livrées dans un jeu
(Local Motion Phases au basket, superposition neuronale, DeepPhase). La suite de ce chantier est donc
une **preuve de concept du mode guidage**, dans une PR séparée.

## Pages

- [Animation des jeux de sport](animation-sport.md) : motion matching, Learned Motion Matching, EA
  d'Ignite à HyperMotionV, contrôleurs neuronaux à phase, ce que « zéro capture » veut dire.
- [Physique, IK et animation procédurale](physique-ik-procedural.md) : ragdolls actifs, SIMBICON,
  équilibre, verrouillage des pieds, déformations de foulée, ressorts amortis, inertialisation.
- [Machines à états et interactions à deux](interactions-a-deux.md) : transitions, marqueurs de
  synchronisation, animations appariées, fenêtres d'annulation, maillage d'interaction, Duolando.
- [Jeux de rythme et de danse](rythme-et-timing.md) : fenêtres de jugement, latence du navigateur,
  calibration, indulgence, *Dance Central*.
- [Guidage et commande](guidage-et-commande.md) : gestes de manette (EA FC, Skate, Fight Night),
  partenaires pilotés (*Ico*, compagnons), science du guidage en couple, kizomba.
- [Interactions physiques des corps](interactions-physiques.md) : contacts du cadre,
  non-pénétration, équilibre, bassins couplés, distance des bassins et hauteur (#67) écrits comme des
  contraintes ; projection de positions (PBD, XPBD), IK à deux personnages, calibration hors ligne.
- [Confrontation avec le moteur](confrontation-moteur.md) : ce que chaque emprunt remplacerait ou
  compléterait, son coût, ce qu'il ne faut pas casser.
- [Concept du mode guidage](mode-guidage.md) : boucle de jeu, niveaux, commandes, suiveuse, retours,
  tests.

## Questions ouvertes au propriétaire

1. ~~« POOC »~~ : réglé, preuve de concept.
2. **Quel niveau d'abord ?** Le niveau 1 (transferts guidés + ginga) prolonge directement #42 et
   donne un jeu court ; le niveau 2 (figures au choix) en fait un jeu de guidage.
3. **Guider avant le temps** : une intention donnée dans le demi-temps (ou le temps) qui précède
   doit-elle compter comme un bon guidage ? Quelle avance est juste en kizomba ?
4. **Retard de la suiveuse** : garder l'avance de 0,25 temps du buste du leader comme seul retard, ou
   ajouter un retard propre à la suiveuse (150 à 300 ms mesurés) ?
5. **Commandes** : clavier, manette, tactile, ou les trois ? Quel geste pour chaque figure (côté de
   chaque sortie) ?
6. **Que doit noter le jeu** : seulement le placement sur le temps, ou aussi la clarté (cadre tenu,
   intention donnée tôt) et le contact plexus ?
7. **Interrompre une figure** (niveau 3, inertialisation) : utile en danse sociale, ou suffit-il de
   changer de figure à la quinconce ?
8. **Initiative de la suiveuse** : pendant une pause, peut-elle orner d'elle-même ?
9. **Équilibre comme test** : ajouter « centre de masse du couple au-dessus des appuis » aux tests,
   indépendamment du mode de jeu ?
10. **Interactions physiques** : tolérances de #67, ordre de priorité des contraintes, distance des
    bassins par style, solveur hors ligne d'abord ou en direct (voir
    [interactions physiques](interactions-physiques.md#questions-ouvertes-au-propriétaire)).

## Méthode et limites

Cinq recherches en parallèle (motion matching et EA ; physique, IK et procédural ; machines à états
et interactions à deux ; jeux de rythme et de danse ; commande et guidage), chacune avec ses sources
marquées **lu** (page ouverte) ou **recherche** (vu dans un résultat de recherche seulement). Plusieurs
pages officielles d'EA renvoient aujourd'hui ailleurs : les détails de FIFA 18 et FIFA 22 reposent
sur des sources tierces (80.lv, Wikipédia). Les vidéos GDC réservées aux membres n'ont pas été vues.
Aucune mesure de retard leader / suiveur propre à la kizomba n'a été trouvée.
