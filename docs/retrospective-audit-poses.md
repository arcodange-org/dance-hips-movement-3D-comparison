# Rétrospective — audit #17, 18 novembre 2026

## Ce qui change dans la preuve

Les anciens tests validaient surtout les courbes avant IK ou un rig artificiel. Ils pouvaient
passer avec des genoux presque tendus, des appuis flottants et des discontinuités visibles.
`pose_fixture.mjs` charge maintenant le même GLB que l’app, et `test_poses.mjs` appelle le moteur
final utilisé par React. Les assertions portent sur les matrices monde et les sommets réels.
Les tests antérieurs de courbes et Gherkin sont conservés pour leur contrat propre.

## Revue indépendante M4

La revue en session indépendante a trouvé des pénétrations du sol dans les combinaisons
travel=1 + sortie + quarts/corridinho à amplitude 2. La projection du bassin a corrigé les
cibles inatteignables ; une marge verticale supplémentaire a corrigé une rotule sous le sol
(kompa/corridinho, temps 10,2). Les reproductions 2,25 / 8,8 / 10,2 / 3,9 sont conservées.
Un balayage indépendant plus dense a confirmé la correction sur les six styles à amplitude 2.

Autre défaut : un pied levé en mode libre conservait un appui. La règle d’éligibilité utilise
maintenant les semelles finales dans tous les modes. Enfin l’export réinitialise la traînée et
l’échantillonne même en pause ; son contenu ne dépend plus du mouvement joué précédemment.
La revue finale n’a identifié aucun autre défaut P1/P2. Elle a rappelé que les tests du moteur
pur ne prouvent pas le montage React ni MediaRecorder : les vérifications navigateur ci-dessous
complètent, sans remplacer, ces tests.

## Vérifications réalisées

- `npm test` : courbes, Gherkin 64 PASS / 0 FAIL / 1 SKIP ; 6 534 poses paramétrées et
  régressions ciblées, 93 105 assertions. Erreur maximale de cheville ≈5,1e−16 m ; minimum
  des sommets ≈−4,9e−16 m (arrondis flottants, largement sous la tolérance 0,1 mm).
- Navigateur local : Solo, Comparaison, Paire ; changements de style et remontage du second
  personnage pendant la pause, mêmes métriques pour les styles identiques ; aucun HUD doublé.
- Exports WebM depuis la pause : comparaison 4 temps, paire/quarts 16 temps à 90 bpm.
  Durées mesurées par ffprobe : 2,641 et 10,642 s. Contrôles désactivés pendant l’export,
  réactivés ensuite ; pause et pose initiale restaurées. Aucune erreur console.
- GIFs produits à partir de ces exports, puis inspectés : `audit-comparaison.gif` et
  `audit-quarts-paire.gif`. Ancienne galerie gardée comme historique et signalée comme telle.

## Limites et suite

La géométrie cohérente ne valide ni la biomécanique, ni le style enseigné, ni les contacts entre
partenaires. Les appuis sont illustratifs ; la flexion cible et la marge de projection demandent
une calibration chorégraphique humaine. MediaRecorder reste dépendant de la cadence réelle du
navigateur. Les tests couvrent le domaine décrit par la spec, sans garantie universelle.
Les phases 17/18 ne sont pas implémentées ici. M4 reste récurrent dans TASKS ; ses prochains
contrôles devront inclure les nouveaux mouvements et leurs combinaisons dans la fixture réelle.
