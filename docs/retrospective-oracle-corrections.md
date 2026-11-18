# Oracle #25 — corrections et preuves

[Accueil](../README.md) · [Spécification](spec-oracle-corrections.md) · [Contrat de l'oracle](spec-phase18-oracle.md) · [Tâches](TASKS.md)

## Changements

Issue #25 publiée avant le code ; spécification et description de la prochaine sortie fille
poussées dans un premier commit. Cette phase ne change aucun moteur, style, composant de rendu,
GLB ou dépendance. Une seule PR regroupe les quatre corrections, sans fusion automatique.

1. Les assertions rejettent NaN/Infinity dans les valeurs, attentes, erreurs, tolérances et
   minimum de sol ; les quaternions doivent être finis, unitaires et avoir quatre composantes.
2. Les pieds évalués et les cibles sont distincts. La référence des quarts/ida est continue
   et indépendante des fonctions de mouvement du moteur. Les tests ne se contentent plus de
   l'identité end(k)=start(k+1).
3. Les bornes sont inclusives ; les huit demi-pas des quarts sont évalués pour les deux rôles
   et les deux sens, avec rotation extérieure. Les combinaisons reverse non supportées sont refusées.
4. Les consignes locales portent des noms locaux. Les orientations mondiales sont comparées
   par quaternion à une composition de référence Kizomba, amplitude 1, isolation active.

## Vérifications ciblées

- Six scénarios d'oracle et gardes d'entrée réussis.
- 792 poses finales GLB, 1 584 contrôles de pieds, 3 168 contrôles d'orientation mondiale,
  86 instants de continuité des matrices (gauche/instant/droite).
- Erreur maximale de pied 3,34×10⁻¹⁶ m ; minimum de sol ≈−5×10⁻¹⁶ m (arrondi flottant).
  Écart maximal de bassin nominal : 7 cm, dans la borne approximative historique de 8 cm.
- Tous les anciens parcours M5 sont conservés, avec ajout de la sortieF et des rôles inactifs.
  La sortie garçon actuelle conserve son runner spécifique.
- Le nominal doit passer avant chaque série de mutations. Chaque mutant doit ensuite échouer
  avec le diagnostic attendu, et non par compilation, absence de dépendance ou timeout.

| Mutation de l'audit | Détection attendue, obtenue |
| --- | --- |
| Prédiction NaN | Rejet explicite de la valeur non finie |
| Pied passant brutalement du départ à sa cible | Limite gauche/droite discontinue |
| Dernier pas reverse décalé de 10 cm | Pied GLB différent de la référence indépendante |
| Perturbation de buste 0,20·sin(2π·phase) dans le moteur | Consigne locale différente de la référence |
| Rotation du bassin augmentée de 0,15 rad, angle local du thorax intact | Quaternion mondial du thorax différent de la référence |

Le cas ida b=0,5 distingue explicitement la somme nominale des lacets (−0,0707107 rad)
du lacet mondial réel (−0,0413428 rad). Le contrôle ne change plus silencieusement de repère.

## Limites conservées et revue

Les sorties latérales historiques restent discontinues lors du retour instantané au repos :
2,288 cm pour G et 17,248 cm pour D à b=5 (partenaire du combiné à b=13). Ce défaut du rendu
préexistait ; il est déclaré et caractérisé, pas corrigé dans un chantier de tests. Les
empreintes historiques fille/combiné restent le garde-fou de ce périmètre.

La composition mondiale de référence du thorax couvre Kizomba nominal ; les autres styles
restent couverts par les tests de poses existants, sans nouvelle prétention d'oracle mondial.
Les positions attendues sont une référence du modèle, pas des mesures de danseurs ni des forces.
La dernière description de la sortie fille est conservée dans [une note séparée](notes-sortie-fille.md).

La revue M4 indépendante a confirmé le repère outer, la séparation rôle/reverse et les sauts
historiques ; la contre-revue n'a relevé aucun défaut P1/P2. Ses renforcements ont été ajoutés :
sauts mesurés directement sur le GLB autour du reset et mutation spécifique d'un ancêtre
du thorax, détectée par le contrôle mondial alors que la consigne locale reste correcte.

`npm test` et `npm run build` réussissent. Les runners ciblés passent également après ces
renforcements. Les 7 272 poses garçon, 2 052 couples et 576 empreintes fille/combiné passent,
ainsi que les 6 534 poses historiques et 69 scénarios Gherkin (1 ancien @wip ignoré).
Les assets JavaScript/CSS générés sont identiques octet pour octet à ceux de la version
déployée de #24 ; aucune capture n'est régénérée pour cette phase de validation.
Les avertissements de build sur les polices et la taille du bundle sont préexistants.

## Enseignements

Un compteur d'assertions ne prouve ni leur exécution utile ni l'indépendance de la référence.
Les tests négatifs doivent démontrer l'échec sur des erreurs connues. Une orientation mondiale
se compose dans la hiérarchie : une somme de lacets locaux n'en est pas une mesure.
La tâche M4 récurrente reste dans TASKS pour la prochaine phase.
