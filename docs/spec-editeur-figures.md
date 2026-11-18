# Proposition — éditeur de figures par actions

[Accueil](../README.md) · [Tâches](TASKS.md) · [Issue #22](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/22) · [Exemple validé : sortie garçon](spec-sortie-garcon.md)

**Statut : spécification à concevoir en produit ; aucun éditeur livré par cette PR.**
L'issue #22 porte sur ce document, pas sur l'implémentation future de l'outil.

## Intention

Permettre à un enseignant de décrire, regarder et corriger une figure action par action,
en distinguant ce qui est visible (pied posé) de ce qui fait la danse (appui, intention,
relation du couple). La sortie garçon sert de premier exemple, sans généraliser ses règles
aux sorties fille/combinée ni aux autres danses.

## Parcours minimal

1. Créer une figure ou importer un fichier ; choisir solo/couple et une pose de départ.
2. Ajouter une action : danseur, pied, destination, orientation, durée, type de pose
   (transfert ou touché), appui final. Les deux partenaires partagent une même ligne du temps.
3. Déplacer les empreintes en vue de dessus ; conserver un formulaire accessible au clavier.
   Afficher l'avant du danseur, la ligne initiale et les trajectoires avant/après sélection.
4. Régler un passage courbe avec point de passage, la levée du pied, le moment de la pose
   puis celui du transfert. Modifier le partenaire dans son propre repère anatomique.
5. Prévisualiser en 3D, avancer/reculer par action ou scruter une transition. Afficher pied
   porteur et pied disponible avec texte et forme, sans dépendre uniquement de la couleur.
6. Créer une variante par modification ciblée des actions ; comparer avec l'original.
7. Vérifier les diagnostics, annoter la source et la validation humaine ; exporter la figure.

Un seul panneau de propriétés suit l'action sélectionnée. Annuler/rétablir couvre chaque
édition et suppression ; enregistrer localement n'implique aucune publication sur GitHub.

## Contrat de données proposé (version 1)

| Objet | Données |
| --- | --- |
| Figure | `schemaVersion`, identifiant stable, titre, langue, rôles, unité mètre/radian/temps, sources et statut de validation |
| Repère | origine, axe avant, transformations monde/couple/danseur ; convention anatomique G/D explicite |
| État initial | positions/orientations des pieds, bassin et thorax, pied porteur de chaque rôle |
| Action | identifiant stable, durée positive, liste d'événements par rôle, texte pédagogique |
| Événement pied | pied G/D, début/fin, destination, lacet, levée, points de passage, instant de pose |
| Appui | pied porteur avant/après et intervalle de transfert ; `touch` laisse l'appui inchangé |
| Relation | partenaire concerné, surfaces/segments, contact recherché ou dégagement, tolérance documentée |
| Variante | référence à la figure et surcharges par identifiant d'action, jamais par index instable |
| Style | modulations séparées (bassin/thorax/niveau), plages illustratives et provenance |
| Sortie | transformation finale du couple et pieds disponibles, utilisables par l'action suivante |

Les angles relatifs et absolus doivent être distingués, ainsi que la position neutre relative
aux pieds et l'origine de la salle. Les appuis sont illustratifs, pas des forces mesurées.
Le moteur reçoit des données validées ; aucune expression JavaScript importée n'est exécutée.

## Exemple : sortie garçon

Cinq actions G–D–G croisé–D–marka G pour le leader ; D–G–D–G–marka D pour la partenaire.
Le cinquième événement est `touch`, avec appui D/G conservé. La variante modifie les actions
4 et 5 et l'état final du couple. Le buste est un réglage indépendant. La lecture finale
conserve l'avancée et montre que G est libre pour un nouvel enchaînement.

## Validation et erreurs

- Bloquer un import de version inconnue, nombre non fini, référence inexistante, durée
  non positive, unités ambiguës ou fichier trop volumineux (limite MVP proposée : 1 Mo).
- Refuser un transfert sur un pied encore en vol ou un touché qui change implicitement l'appui.
- Signaler une cible hors de portée, un pied porteur déplacé sans pivot déclaré, une rupture
  de position/orientation entre actions ou une incompatibilité de l'état final et du suivant.
- Distinguer impossibilité numérique, proximité géométrique approximative et validation
  chorégraphique humaine. Un test vert ne certifie pas une technique ou la sécurité physique.
- Toute correction automatique doit être visible, annulable et confirmée avant de remplacer
  les données de la figure. Préserver l'original lors d'une migration de version.

## Sauvegarde et échange

Sauvegarde locale versionnée, brouillon restaurable et avertissement avant abandon de
changements. Import/export JSON documenté, déterministe et sans code exécutable ; export
image/vidéo facultatif après le MVP. Pas de compte, collaboration simultanée ou publication
automatique dans la première version. Une URL peut sélectionner une figure intégrée et sa
pose ; elle ne doit pas contenir silencieusement tout un document privé.

## Critères d'acceptation d'une future implémentation

- Recréer la sortie garçon et sa variante sans modifier le code du moteur.
- Le parcours complet fonctionne au clavier et à largeur mobile, avec des champs nommés.
- Choisir directement l'action 5 produit la même pose qu'une lecture de 0 à 5 ; le marka
  reste déchargé, y compris après modification du style.
- Changer les paramètres d'une variante ne modifie jamais la figure de base.
- Annuler/rétablir restaure les données et l'aperçu ; sauvegarder/recharger et exporter/importer
  préservent les identifiants, unités, variantes et sources.
- Une figure invalide explique l'action fautive et reste éditable sans faire planter la scène.
- Une séquence de deux figures conserve les transformations et appuis de la jonction.

## Découpage ultérieur

1. Schéma validé et évaluateur pur, testés sur des figures approuvées.
2. Timeline, édition par formulaire et vue de dessus ; prévisualisation utilisant cet évaluateur.
3. Variantes, historique, fichiers et migrations ; puis tests utilisateurs avec un enseignant.

À décider avant développement : niveau de liberté des trajectoires, choix de morphologie,
édition des contacts de cuisse et politique de validation des figures partagées. Les degrés
de liberté du modèle actuel ne doivent pas devenir par défaut des règles universelles de danse.
