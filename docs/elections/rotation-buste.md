# Élection — rotation du bassin : thorax de face ou buste solidaire (#132)

[Accueil](../../README.md) · [Atlas anatomique](../atlas/README.md) · [Spécification, D16](../spec-atlas-anatomique.md) ·
[Planche](../atlas/mouvements/bassin-rotation/README.md) ·
[Élection précédente : obliquité](obliquite-genoux.md) ·
[Issue #132](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/132)

Même format que l'élection de l'obliquité : les deux règles côte à côte dans un seul GIF, même
caméra, même angle de bassin. Préparée avec l'accord du propriétaire (« Oui », 22 novembre 2026).

**Vote attendu.** Tant qu'il n'est pas rendu, la planche reste posée en A.

## La question

Debout, pieds à plat, le bassin tourne autour de la verticale, de −15° à +15° : une hanche avance,
l'autre recule. Que fait le buste ?

![A, thorax de face, et B, buste solidaire, côte à côte](../gifs/election-rotation-buste.gif)

| A — thorax de face (la planche aujourd'hui) | B — buste solidaire |
| --- | --- |
| Le dos se tord : le thorax, la tête et les bras restent face au partenaire. | Le dos ne se tord pas : tout le haut du corps tourne avec le bassin. |
| Seul le bassin tourne, sous un buste immobile. | Le cadre des bras tourne de 15° avec les hanches. |
| Les hanches et le dos se partagent la rotation. | Les hanches absorbent seules la rotation, pieds plantés. |

Sous chaque colonne : de combien le bassin a tourné, de combien le thorax a tourné par rapport à la
pose de départ, et la torsion du dos (la différence des deux).

## Mesures sur le squelette

| Bassin | A : thorax tourné | A : torsion du dos | B : thorax tourné | B : torsion du dos | Hanche gauche (A et B) |
| --- | --- | --- | --- | --- | --- |
| −15° | 0° | 15° | 15° | 0° | 43,9 mm devant la droite |
| −7,5° | 0° | 7,5° | 7,5° | 0° | 22,3 mm devant |
| 0° | 0° | 0° | 0° | 0° | 0,4 mm devant |
| +7,5° | 0° | 7,5° | 7,5° | 0° | 21,6 mm derrière |
| +15° | 0° | 15° | 15° | 0° | 43,2 mm derrière |

- Le bassin, les hanches, les genoux (6,9° à 7,2°) et les pieds sont les mêmes dans les deux règles.
  Seul le haut du corps change.
- En B, le thorax ne tourne qu'autour de la verticale : il ne penche ni ne bascule.

## Ma proposition

**A.** L'objectif premier du projet est de voir les isolations du bas du corps : le bassin bouge,
le haut du tronc reste posé. En couple, le cadre des bras garde le contact face au partenaire
pendant que les hanches tournent dessous. Le prix : le dos se tord de 15° aux bornes.

C'est mon avis sur le modèle, pas un fait d'anatomie : aucune des deux règles n'est mesurée sur
une personne, et le modèle ne dit pas comment une colonne réelle répartit la torsion entre ses
vertèbres.

## Ce que le choix entraîne

Écrit avant le vote :

- **A élu** : rien ne change. La variante B et ce GIF restent montrés sur la planche.
- **B élu** : B devient la règle de la planche `bassin-rotation`. La planche est régénérée (53
  fichiers) et ses limites disent que le buste tourne avec le bassin. A reste montrée en variante.

Le comparateur des styles n'est pas modifié par ce vote ; il est seulement noté dans les règles du
propriétaire.

## Ce que valent ces images

- Les deux règles passent les mêmes contrôles sur le squelette réel
  (`scripts/test_atlas_planches.mjs`) : même angle de bassin, mêmes hanches, pieds plantés, os
  au-dessus du sol ; en A le thorax reste immobile, en B il tourne exactement avec le bassin.
- Voir dans l'app : A, la règle de la planche, `?atlas=bassin-rotation` ; B, la variante,
  `?atlas=bassin-rotation&variante=solidaire` (ajouter `&vue=troisQuarts` ou `&frame=0` à `8`).
- Refaire le GIF : `npm run build && node scripts/capture_atlas.mjs --mouvement bassin-rotation --variante solidaire`.
- Squelette et muscles : BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan. Images générées
  paramétriquement : ni capture de mouvement, ni photo de modèle, ni relecture par un professeur
  d'anatomie.

## Résultat

À venir : le vote et le commentaire du propriétaire, recopiés mot pour mot.
