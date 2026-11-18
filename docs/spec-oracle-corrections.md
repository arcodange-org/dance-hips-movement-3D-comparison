# Oracle — corrections des garanties, issue #25

[Accueil](../README.md) · [Tâches](TASKS.md) · [Issue #25](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/25)

## Périmètre

Demande du 19 novembre 2026. Corriger les quatre défauts de l'audit sur 8e44b85, sans
changer le moteur, les styles ni les figures rendues. Une PR après validations et revue M4,
sans fusion. Cette spécification précède le code. La [sortie fille](notes-sortie-fille.md)
reste une préparation pour une prochaine phase.

## Contrat retenu

- L'oracle de quarts/ida évalue des pieds à l'instant demandé, distincts des cibles de fin
  de pas. Une table géométrique de référence et des règles temporelles explicites remplacent
  les appels à `quartTurnStep`, `idaEVoltaStep` et `idaContra` du moteur.
- Positions et lacets des pieds sont exprimés dans le repère extérieur du danseur. Les noms
  G/D sont anatomiques. Le rôle du partenaire et la rotation de son repère ne sont pas un
  échange implicite des pieds.
- Les rotations de racine et de thorax prédites sont des consignes locales/nominales ; elles
  ne portent plus le nom trompeur de lacet mondial. Les orientations mondiales mesurées sont
  des quaternions composés, comparés comme tels dans les tests du GLB.
- `reverse` est une variante des quarts effectivement supportée par le moteur. L'oracle
  refuse une combinaison non supportée (ida ou sortie historique avec reverse) au lieu de
  produire une prédiction que le rendu n'applique pas.
- Les sorties latérales historiques sont explicitement identifiées comme telles, séparées
  de la nouvelle sortie garçon à cinq actions. Leur recoupement est conservé ; il ne certifie
  ni leur chorégraphie ni une continuité que le rendu historique ne garantit pas.

## Preuves attendues

1. Toute comparaison refuse NaN/Infinity, y compris les valeurs attendues, tolérances et
   minimum de sol. Les tests négatifs doivent exercer les vraies fonctions d'assertion.
2. Continuité quarts/ida : évaluer t−ε, t et t+ε aux changements de pas et aux raccords ;
   vérifier pieds et orientations réellement appliqués au GLB, indépendamment de l'égalité
   automatique entre les champs start/end de deux fenêtres adjacentes.
3. Parcourir les bornes annoncées inclusivement. Vérifier un nombre attendu de poses par
   sens/rôle, le dernier demi-pas et la rotation extérieure de la partenaire.
4. Préserver les comparaisons de pieds posés à k+0,6 / 2k+1,2 et les instants intermédiaires
   pertinents. Ne pas confondre l'orientation locale du thorax et son quaternion monde.
5. Tests de mutation sur des copies isolées : prédiction NaN, saut de pose, dernier pas
   inverse décalé de 10 cm et perturbation du buste partagée de 0,20 rad doivent être détectés.
   La revue ajoute un cinquième cas : rotation d'un ancêtre avec angle local du thorax intact.
6. Tests historiques, poses sortie garçon et empreintes fille/combiné toujours verts ; build
   TypeScript et CI. Aucun besoin de régénérer les captures : le code de rendu est inchangé.

La référence géométrique est un contrat du modèle actuel ; elle n'est pas une capture de
mouvement ni une validation humaine de toutes les danses. Les paramètres de styles et les
forces restent hors de sa portée. Les limites et résultats seront consignés avant la PR.
