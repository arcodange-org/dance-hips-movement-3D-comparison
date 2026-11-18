# Oracle — poses évaluées, cibles et repères

[Accueil](../README.md) · [Correction #25](spec-oracle-corrections.md) · [Résultats](retrospective-oracle-corrections.md) · [Scénarios](oracle.feature)

Ce document remplace le contrat initial des phases 18/M5 après l'audit de novembre 2026.
Le rendu et ses trajectoires n'ont pas changé. L'oracle sert à tester le modèle, pas à
certifier une technique de danse ou des forces physiques.

## Poses continues de quarts et ida

`oraclePose(movement, beat, reverse?, rest?)` évalue les pieds dans le **repère extérieur
fixe du rig** (`outer`), parent de la racine animée. La rotation de `root` n'est pas à
réappliquer aux pieds ; pour obtenir le monde, appliquer uniquement la transformation externe.

- `footL` / `footR` : positions x/z et lacets évalués à cet instant.
- `targets.L` / `targets.R` : cibles du pas courant. Elles peuvent changer à une frontière
  sans que les pieds évalués sautent à ces cibles.
- `rootLocalYaw` : consigne de lacet local de la racine.
- `chestLocalYaw` : consigne locale du thorax après isolation ; ce n'est pas un lacet mondial.
- `nominalRootX/Z` : chemin nominal, avant translation de style et projection IK.

Les quarts utilisent huit atterrissages explicites autour d'un carré (pivots à 90°, fermeture
parallèle), une durée de deux temps par pas et une pose au sol à 1,2 temps. Ida utilise les
quatre actions G avant/G arrière/D avant/D arrière, relativement au repos fourni, puis
retour à son état cyclique. L'easing et les amplitudes sont des paramètres de ce modèle.
La référence n'importe plus les fonctions de mouvement de `styles.ts`.

`reverse=true` n'est supporté que pour les quarts, conformément au moteur : échange G/D,
x conservé après échange, z et lacets opposés. Pour ida, la combinaison est refusée. Le rôle
leader/partenaire ne doit pas être confondu avec reverse ni avec la rotation extérieure de π.
Les beats non finis et les indices de pas invalides sont rejetés.

`oracleHalfStep(movement,k,reverse?,rest?)` expose deux poses évaluées séparées de deux temps.
L'égalité entre `end(k)` et `start(k+1)` est une propriété de l'API, **pas une preuve de
continuité**. Les tests évaluent les limites t−ε/t/t+ε, puis les matrices finales du GLB aux
changements de pas, atterrissages et raccords, pour tous les demi-pas y compris le dernier.
Les orientations sont comparées modulo 2π ou par quaternions (q et −q équivalents).

## Sorties latérales historiques

`legacySortiePose(movement,beat,side?,rest?)` est une API distincte pour `sortieG`, `sortieF`
et `sortieGF` **historiques**, à amplitude 1. Le rôle sélectionne la fenêtre active ; il ne
produit pas un miroir implicite. Aucun paramètre reverse n'y est proposé.
La nouvelle sortie garçon à cinq actions relève de `sortieGarcon.ts` et de son propre runner.

Les pieds plantés conservent la cible de leur dernier atterrissage pendant la fenêtre active.
Le reset historique au repos à b=5 (b=13 côté partenaire du combiné) reste discontinu :
2,288 cm pour G, 17,248 cm pour D, mesurés dans le cas nominal. L'oracle caractérise ce
comportement ; il ne le présente pas comme une continuité validée. Sa correction attend la
validation des figures remplaçantes, dont la [sortie fille décrite](notes-sortie-fille.md).

## Contrôles et indépendance

- `test_oracle.mjs` : six scénarios Gherkin, repères géométriques explicites, limites,
  bornes inclusives et rejets des entrées/combinaisons invalides.
- `test_oracle_final.mjs` : référence confrontée au GLB avec deux repères extérieurs et les
  deux sens des quarts ; pieds, consignes locales, quaternions mondiaux, sol et matrices.
  La référence d'orientation mondiale du thorax est explicitement **Kizomba, amplitude 1,
  isolation active**, composée depuis des angles de référence, pas des ancêtres animés mesurés.
  Elle ne généralise pas cette validation aux autres styles.
- `test_oracle_mutations.mjs` : le code nominal passe ; cinq erreurs injectées en mémoire
  doivent échouer pour leur raison attendue. Une erreur de compilation ou un timeout ne compte
  pas comme détection. Les fichiers de production ne sont jamais modifiés par ces mutations.
  La cinquième modifie un ancêtre du thorax pour éprouver spécifiquement l'orientation mondiale.
- `oracle_assertions.mjs` : nombres finis requis pour valeurs, attentes, erreurs, tolérances,
  minimum de sol et quaternions. Le compteur ne peut plus masquer NaN.

La borne historique de 8 cm sur le bassin nominal reste une approximation distincte des
contrôles exacts de chevilles (10⁻⁶ m). Elle inclut l'oscillation de style et la projection
horizontale de portée. Les tables constituent une référence géométrique du modèle ; leur
indépendance logicielle ne remplace pas la validation chorégraphique humaine.

## Historique

La phase 18 comparait les cibles des fonctions du moteur à ces mêmes fonctions ; sa continuité
était une identité au même instant. M5 ajoutait 429 assertions mais sa grille de 0,25 temps
sautait les poses à k+0,6 / 2k+1,2. La PR #24 a rétabli ces poses (669 assertions) et leurs
repères. L'issue #25 corrige la finitude, la continuité évaluée, reverse et le contrat des angles.
Les résultats actualisés sont dans la [rétrospective](retrospective-oracle-corrections.md).
