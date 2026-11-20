# Confrontation avec le moteur du comparateur

[Hub de la recherche](README.md) · [Animation de sport](animation-sport.md) · [Physique, IK, procédural](physique-ik-procedural.md) · [Interactions à deux](interactions-a-deux.md) · [Rythme et commande](rythme-et-commande.md) · [Mode guidage](mode-guidage.md)

Cette page relit le code au 20 novembre 2026 (`main` à 941d754, plus la spec du ginga de la PR #59).
Elle dit, pour chaque emprunt, s'il s'adapte au moteur, ce qu'il remplacerait et ce qu'il coûterait.

## Le moteur tel qu'il est

| Pièce | Rôle | Ce qui compte pour un mode de jeu |
| --- | --- | --- |
| `src/clock.ts` | Horloge commune `clock.beat`. Avec le son, l'horloge audio la pilote (`stepTransport`). | Une seule source de temps, déjà alignée sur la musique synthétisée. C'est l'équivalent du « conductor » des jeux de rythme. |
| `src/pose.ts`, `applyPose` | Fonction pure (temps, options) → pose complète du GLB : figure, style, IK des jambes, isolation du buste, plexus. | Aucun état interne : on peut évaluer n'importe quel temps, rejouer, tester hors ligne. Un jeu ajoute un état au-dessus, sans toucher à cette fonction. |
| `src/components/Rig.tsx` | Appelle `applyPose(clock.beat + phaseOffset, …)` à chaque image, pour chaque danseur. | `phaseOffset` existe déjà : un retard du suiveur se branche ici. |
| Échantillonneurs de figures | `sampleSortieGarcon`, `sampleSortieFille`, `sampleQuartsPaire`, `sampleIdaPaire` : pieds, racine, lacets, charges, appui, transfert. | Ce sont des **clips paramétriques** : une durée en temps, un départ et une arrivée en quinconce neutre. |
| `src/gait.ts`, `gaitStep` | Cycle de marche d'un pied : talon qui se lève, passage, attaque, pivot sans glissement. | Équivalent procédural d'un clip de pas, déjà sans glissement. |
| `idaTransfers`, `support`, `transfer` | Liste explicite des transferts d'appui de la figure. | C'est le point d'accroche du ginga (#42) et la « note » naturelle d'un mode de jeu. |
| `src/styles.ts` | Déhanché du style, appui `support(b) = −S2(b)` : un transfert par temps. | Le pas de base sur place, entre deux figures. |
| Tests GLB | `test_ida_paire.mjs`, `test_quarts_paire.mjs`, `test_sortie_*.mjs`, `test_plexus.mjs`, `test_poses.mjs` : aucun croisement d'os de jambe, semelles au-dessus du sol, pied d'appui immobile, six styles. | La garantie vaut pour les **séquences testées**. Un enchaînement libre n'est garanti que s'il passe par des états testés. |

Le constat principal : **toutes les figures en paire partent de la quinconce neutre et y
reviennent** (fin des sorties, temps 4 et 8 de l'ida e volta, chaque quart de tour). Dans le
vocabulaire du jeu vidéo, la quinconce est un **état pivot** (*hub pose*) d'une machine à états. Un
enchaînement de figures qui ne change de figure qu'à cet état réutilise les poses déjà testées,
sans transition à inventer.

## Emprunt par emprunt

Légende du coût : **S** = un module pur et ses tests, quelques jours ; **M** = nouveau sous-système,
une à deux semaines ; **L** = changement de nature du moteur ou données à produire.

| Emprunt | S'adapte ? | Remplace ou complète | Coût | Commentaire |
| --- | --- | --- | --- | --- |
| Machine à états de figures, état pivot en quinconce | Oui, directement | Complète : ajoute un ordonnanceur au-dessus des échantillonneurs | S | Le temps local d'une figure = `clock.beat − début`. Les changements se font aux frontières de figure. |
| Fenêtres de transition et quantification sur le temps (jeux de rythme) | Oui | Complète | S | L'intention du joueur s'applique au prochain temps fort ; l'horloge existe déjà. |
| Transferts d'appui comme « notes » | Oui | Complète le ginga #42 | S | La spec #42 fait avancer la phase du style par transfert ; un mode de jeu fait déclencher ces transferts par le joueur. |
| Retard du suiveur, buste du leader en avance | Oui | Complète | S | `phaseOffset` et `IDA_LEAD` / `QUARTS_LEAD` (0,25 temps) existent déjà. |
| Inertialisation (transition sans mélange de deux clips) | Adaptable | Complète, pour les interruptions hors quinconce | M | Utile si le joueur coupe une figure en cours. Chaque transition non testée doit alors passer les tests GLB. |
| Amortisseurs à ressort (*spring dampers*) sur la racine et le buste | Adaptable | Complète | S | Lisse les réactions du suiveur à une intention tardive, sans changer les clips. |
| Verrouillage des pieds (*foot locking*) | Déjà fait | — | — | `gaitStep` et l'IK gardent le pied d'appui immobile ; c'est ce que les jeux ajoutent au motion matching. |
| Déformation de foulée (*stride warping*), *motion warping* | Adaptable | Complète `placement` | M | Allonger ou raccourcir un pas pour atteindre une cible (#56 l'a fait à la main). |
| Maillage d'interaction (*interaction mesh*) | Partiellement | Complète les contrôles de contact | M | Le moteur mesure déjà plexus et contacts ; un maillage d'interaction les préserverait pendant une déformation. |
| Animation physique, ragdoll actif | Non pour le rendu | Remplacerait l'IK cinématique | L | Équilibre et forces seraient simulés, la reproductibilité des tests serait perdue. Utile seulement comme jauge d'équilibre (centre de masse au-dessus de l'appui). |
| Motion matching | Non sans données | Remplacerait les échantillonneurs | L | Il faut des heures de capture de couples réels. Aucune donnée n'existe pour ces six danses. |
| Contrôleurs neuronaux à phase (PFNN, DeepPhase), génération du suiveur (Duolando) | Non à court terme | Remplacerait les échantillonneurs | L | Mêmes besoins de données, entraînement hors navigateur, perte de la garantie « aucun croisement ». |

## Ce qu'il ne faut pas casser

1. **La pureté de `applyPose`.** Le mode de jeu garde son état (file d'intentions, figure en cours,
   score) dans un module séparé ; `applyPose` reste une fonction du temps et des options.
2. **Les tests GLB.** Un enchaînement n'est jouable que s'il passe par des états testés. Toute
   transition nouvelle (interruption, figure enchaînée hors quinconce) entre dans les tests comme
   une figure.
3. **L'oracle.** Ne jamais comparer une séquence de jeu à elle-même pour prouver sa continuité
   ([contrat de l'oracle](../spec-phase18-oracle.md)).
4. **L'horloge unique.** Son coupé, le temps reste le même ; un jeu ne doit pas créer une seconde
   horloge.

## Ce qui manque au moteur pour un mode de jeu

- Les transferts explicites n'existent que dans l'ida e volta (`idaTransfers`). Les sorties et les
  quarts ont un `support`, pas encore de liste de transferts : à ajouter avant de les rendre jouables.
- Le pas de base « sur place » de chaque style transfère à chaque temps sur l'horloge. Pour qu'un
  joueur le déclenche, sa phase doit pouvoir avancer par transfert (modèle de la spec #42).
- Il n'y a pas de notion de **fin anticipée** d'une figure. Le mode le plus simple n'en a pas besoin.
