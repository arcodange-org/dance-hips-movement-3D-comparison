# CONTRIBUTING.md — contribuer agentiquement au projet

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
  métriques réelles, clamp `root.position.y >= 0`, pieds plats, `plant=1` par défaut en sur place,
  animation paramétrique f(temps) uniquement (pas de mocap), attribution **BodyParts3D CC BY-SA
  2.1 Japan © DBCLS** visible dans l'app et le README.
- Oublier de documenter un changement de convention (amendement daté, ex. plant 2026-11-18).
- Laisser du debug (`window.__dbg`, console.log) dans les commits.
- Modifier des fichiers générés à la main sans le workflow prévu (GLB : scripts documentés dans
  README/ADR, avec vérification des échelles de compensation de quantification).
