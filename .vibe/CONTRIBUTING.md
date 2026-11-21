# CONTRIBUTING.md — contribuer agentiquement au projet

## Amendement de contribution — audit #17 (18 novembre 2026)

Pour ce chantier, les consignes globales du propriétaire priment sur les procédures historiques
ci-dessous : trunk réservé à l’utilisateur, travail dans `.Codex/worktrees/audit-poses-finales`
sur `arcodange/audit-poses-finales`, issue publiée avant le code, spec poussée en premier.
Ouvrir une seule PR après les validations ; sa branche reste gelée tant qu’elle est ouverte.
Aucune fusion, aucun push ni checkpoint sur `main`. Utiliser le remote `origin` et les
identifiants du gestionnaire Git ; ne jamais construire ni afficher une URL contenant un token.


N'importe quelle session Mistral peut continuer d'améliorer le projet en autonomie. Le cycle
standard d'une contribution (phase) :

## 1. Spec-first (obligatoire)

- Écrire/affiner la spec `docs/spec-phaseN-<slug>.md` **avant** le code (l'utilisateur demande
  « affûte les specs en premier »).
- Ajouter les tâches à `docs/TASKS.md` (numérotation continue), créer la branche
  `vibe/phaseN-<slug>-ae8a7a`, pousser, ouvrir la PR **draft** tôt.
- Définir la méthode anti-amnésie appliquée (voir `HARNESS.md`) et travailler en continu.

## 2. Implémentation

- Fonctions **pures et testables** d'abord (`src/styles.ts`, `src/cameras.ts`, `src/share.ts`,
  `src/directions.ts`), câblage ensuite (`src/App.tsx`, `src/components/*`).
- Validations **Gherkin** : `docs/features/*.feature` + steps dans `scripts/test_features.mjs`
  (runner zero-dep, exécuté par `npm test`). Un scénario `@wip` est sauté tant que la feature
  n'est pas livrée.
- Poses finales : `scripts/test_poses.mjs` charge le GLB réel et appelle le même moteur que
  React. Toute correction IK doit vérifier les cibles, longueurs et sommets **après** résolution.
- Style : TypeScript strict, composants séparés, pas de commentaire superflu, pas de dépendance
  ajoutée sauf si le projet l'utilise déjà.

## 3. Captures & docs

- GIFs motion design : `npm run build && npm run capture` → `docs/gifs/` ; chaque capture a une
  entrée `DEMOS` dans `src/components/DemoOverlay.tsx`. Relecture visuelle des frames extraites
  (2+ frames à des temps calculés depuis le bpm).
- README : galerie avec `<details>` « Détails & source » sous chaque GIF (brief + source +
  crosslink docs) ; documenter tout nouveau paramètre d'URL et toute option d'interface.
- Sources externes : citations **verbatim** avec URL dans `docs/styles-de-danse.md` ou
  `docs/ginga-angolana.md` (FR/EN/PT privilégiés pour les danses africaines).

## 4. Livraison

1. `npm test` (0 FAIL), `npm run build`, smoke headless (0 erreur console).
2. Commits petits, push branche, `gh pr ready N`.
3. ff-push `<branche>:main` (voir HARNESS §3.4) → la PR passe MERGED.
4. `gh run list --branch main` jusqu'à `success` — le job `test` (CI, `npm test` + build) a dû
   passer avant le déploiement Pages (`needs: test`, garantie de non-régression) ; vérifier le
   site live (200 sur index, GLB, draco, fonts, GIFs).
5. Commit checkpoint sur main : `CONTEXT.md` + `docs/TASKS.md`.
6. Rétrospective M4 : addendum `docs/retrospective-*.md` + ré-ajouter M4 dans `docs/TASKS.md`.

## 5. PRs

- Titre : `Phase N : <résumé>`. Corps : résumé en puces + « ## Vérification » (commandes
  exécutées) + `Closes #<numéro>` si issue tracée.
- Si le dépôt a un template de PR, le remplir intégralement.
- Ne jamais forcer un push sur une branche protégée ; en cas d'erreur « protected branch », la
  remonter telle quelle (ne pas réessayer).

## 6. Ce qu'il ne faut PAS faire

- Casser les conventions verrouillées (voir `CONVENTIONS.md`) : hiérarchie de pivots GLB,
  métriques réelles, sommets osseux au-dessus du sol, pieds plats, `plant=1` par défaut en sur place,
  animation paramétrique f(temps) uniquement (pas de mocap), attribution **BodyParts3D CC BY-SA
  2.1 Japan © DBCLS** visible dans l'app et le README.
- Oublier de documenter un changement de convention (amendement daté, ex. plant 2026-11-18).
- Laisser du debug (`window.__dbg`, console.log) dans les commits.
- Modifier des fichiers générés à la main sans le workflow prévu (GLB : scripts documentés dans
  README/ADR, avec vérification des échelles de compensation de quantification).

## 7. Trancher une question de mouvement : élection de variantes (#148)

Quand une décision de mouvement attend le propriétaire (quel pied, quelle direction, quel seuil), on
ne la pose pas en mots : on filme les candidats et il en élit un
([spec](../docs/spec-elections-variantes.md), exemple : [premier tour](../docs/elections/2026-11-21/README.md)).

1. Un candidat = un interrupteur d'essai dans `src/essais.ts`, actif seulement avec `?essai=cle`
   (ou `ESSAI=cle` en node pour mesurer). Les tests restent verts sans y toucher : c'est la preuve
   que l'interrupteur est inerte.
2. Mesurer chaque candidat sur le vrai GLB (`scripts/mesure_essai_*.mjs`) et vérifier sur une image
   fixe (`scripts/capture_still.mjs`) que la différence se voit avant de filmer.
3. Un GIF par candidat (`scripts/capture_figure_gif.mjs`), avec les muscles, même cadrage et même
   durée, une capture à la fois, dans `docs/elections/<date>/`.
4. Page d'élection : candidats côte à côte, une scène concrète, les mesures, un choix (dont « aucune
   ne convient ») et un commentaire optionnel. La page ne dit pas quelle variante est la bonne.
5. Recopier le vote et le commentaire mot pour mot dans l'issue, implémenter la variante élue dans
   une PR propre, retirer l'interrupteur. Une question dont les candidats ne se prototypent pas
   proprement est reportée, avec sa raison.
