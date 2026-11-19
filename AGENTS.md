# AGENTS.md — Comparateur 3D des styles de danse

## Workflow de contribution (consignes du propriétaire, en vigueur)

Ces consignes remplacent les anciennes procédures « ff-push sur `main` » des phases Vibe.

- **Trunk réservé** : le checkout principal reste sur `main`, synchronisé avec `origin`. Tout travail
  d'agent se fait dans un worktree (`.claude/worktrees/<slug>` ou `.Codex/worktrees/<slug>`) sur une
  branche `arcodange/<slug>`.
- **Issue d'abord**, publiée avant le code pour réserver le périmètre ; **spec poussée en premier**
  (`docs/spec-*.md`), puis code, tests, captures.
- **Une PR par chantier**, qui ferme ses issues (`Closes #N`). La branche est **gelée** tant que la PR
  est ouverte ; un travail dépendant part de cette branche et s'annonce « Stacks on #N ».
- **Fusion** : uniquement avec l'accord du propriétaire, CI verte et commentaires résolus (merge
  commit, pour préserver les empilements). Vérifier ensuite le run `main` et le site Pages.
- Ne jamais construire ni afficher d'URL contenant un token ; utiliser `origin` et le gestionnaire
  d'identifiants Git.

Modules des figures en paire : [sortie garçon](docs/spec-sortie-garcon.md) (`src/sortieGarcon.ts`,
`scripts/test_sortie_garcon.mjs`), [sortie fille](docs/spec-sortie-fille.md) (`src/sortieFille.ts`,
`scripts/test_sortie_fille.mjs`), [quarts de tour en paire](docs/spec-quarts-paire.md) (`src/quartsPaire.ts`,
`scripts/test_quarts_paire.mjs`). Le combiné `sortieGF` reste historique. Oracle :
[contrat](docs/spec-phase18-oracle.md) ; `scripts/oracle_assertions.mjs` centralise les gardes finies
et les comparaisons de quaternions ; ne pas réintroduire une comparaison d'une fonction de mouvement
avec elle-même comme preuve de continuité ou de chorégraphie. [Éditeur futur](docs/spec-editeur-figures.md).

**Lire ce fichier en premier dans toute session.** Le harness complet pour travailler sur ce projet
en autonomie (méthode anti-amnésie, conventions, contribution agentique) est dans **[`.vibe/`](.vibe/)**
— commencer par [`.vibe/HARNESS.md`](.vibe/HARNESS.md), puis [`.vibe/CONTRIBUTING.md`](.vibe/CONTRIBUTING.md)
et [`.vibe/CONVENTIONS.md`](.vibe/CONVENTIONS.md). L'état courant du projet est dans
[`CONTEXT.md`](CONTEXT.md), la liste des tâches dans [`docs/TASKS.md`](docs/TASKS.md).

## Projet

App web 3D (Vite + React 19 + @react-three/fiber 9 + drei 10 + three 0.187 + TypeScript strict +
Tailwind 3) qui compare visuellement six styles de danse (kizomba, semba, kompa, tarraxinha, suave,
zouk brésilien), animés paramétriquement f(temps) — pas de mocap. Déployée sur GitHub Pages :
https://arcodange-org.github.io/dance-hips-movement-3D-comparison/

**Objectif premier** : discerner les **isolations du bas du corps** — au-dessus du bassin, le haut
du tronc compense le roulis du bassin (`iso=1` par défaut), avec pitch du style conservé. Voir
[`docs/ginga-angolana.md`](docs/ginga-angolana.md) (sources FR/EN/PT, citations verbatim).

## Règles d'or (résumé — le détail dans `.vibe/`)

1. **Anti-amnésie** : aucun état important qu'en mémoire — tout vit dans le dépôt (CONTEXT.md,
   docs/TASKS.md, docs/spec-*.md, docs/adr/*) et sur GitHub (branche + PR poussées tôt).
   Démarrage de session : `cat AGENTS.md CONTEXT.md docs/TASKS.md && git fetch origin && git status && npm test`.
2. **Spec d'abord** (`docs/spec-phaseN-*.md` + tâches dans `docs/TASKS.md` + branche + PR draft
   ouverts tôt), puis code, puis validations Gherkin (`docs/features/*.feature` dans `npm test`),
   puis captures GIF, puis livraison.
3. **Conventions verrouillées** : voir [`.vibe/CONVENTIONS.md`](.vibe/CONVENTIONS.md) — ne jamais
   les casser (hiérarchie GLB, métriques, sommets osseux au-dessus du sol, pieds plantés par défaut, attribution
   BodyParts3D **CC BY-SA 2.1 Japan © DBCLS** visible dans l'app et le README).
4. **Livraison** : voir « Workflow de contribution » ci-dessus (PR, fusion par le propriétaire).
   **Garantie de non-régression** : la CI (`.github/workflows/deploy.yml`) exécute le job `test`
   (`npm ci && npm test && npm run build`) à chaque push sur `main` **et chaque PR** ; le déploiement
   Pages (`build`/`deploy`) n'a lieu que si `test` passe (`needs: test`).
5. **Jamais de secret** en clair (ni token dans une URL de remote ou un log).

## Moteur et preuves des poses finales

`src/pose.ts` applique la pose complète du GLB ; `src/clock.ts` et `DanceTransport` fournissent
une horloge commune. `Rig.tsx` conserve le montage et l’apparence. `src/rigJoints.ts` partage les
positions du buste entre rendu et fixture. `npm test` exécute courbes, Gherkin, oracle **et** poses
finales (`scripts/test_poses.mjs`, GLB réel). Voir [la spec #17](docs/spec-audit-poses-finales.md).
Le bassin peut descendre : l’invariant sol porte sur les sommets et les semelles, jamais sur
`root.y >= 0`. Longueurs osseuses constantes ; HUD après IK ; appuis illustratifs, proximité
sans simulation de contact. Ces tests ne constituent pas une validation chorégraphique.

## Maintenance de ce fichier (AGENTS.md)

- **Toute session qui touche à la structure du projet, aux commandes, aux conventions ou au
  workflow de livraison met à jour ce fichier dans le même commit** (et `.vibe/*` si le harness
  change).
- Garder AGENTS.md **court** (règles d'or + pointeurs) : l'état courant vit dans `CONTEXT.md`,
  les tâches dans `docs/TASKS.md`, les specs dans `docs/spec-*.md` — ne pas les dupliquer ici.
- Si un nouveau type de tâche récurrent apparaît (ex. nouvelle phase, nouveau type de capture),
  documenter le process dans `.vibe/CONTRIBUTING.md` et le référencer ici en une ligne.
- Ne jamais supprimer les règles d'or sans les remplacer explicitement ; l'attribution
  **CC BY-SA 2.1 Japan © DBCLS** doit rester mentionnée ici, dans le README et dans l'app.
