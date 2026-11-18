# AGENTS.md — Comparateur 3D des styles de danse

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
du tronc doit rester stable et vertical (`iso=1` par défaut). Voir
[`docs/ginga-angolana.md`](docs/ginga-angolana.md) (sources FR/EN/PT, citations verbatim).

## Règles d'or (résumé — le détail dans `.vibe/`)

1. **Anti-amnésie** : aucun état important qu'en mémoire — tout vit dans le dépôt (CONTEXT.md,
   docs/TASKS.md, docs/spec-*.md, docs/adr/*) et sur GitHub (branche + PR poussées tôt).
   Démarrage de session : `cat AGENTS.md CONTEXT.md docs/TASKS.md && git fetch origin && git status && npm test`.
2. **Spec d'abord** (`docs/spec-phaseN-*.md` + tâches dans `docs/TASKS.md` + branche + PR draft
   ouverts tôt), puis code, puis validations Gherkin (`docs/features/*.feature` dans `npm test`),
   puis captures GIF, puis livraison.
3. **Conventions verrouillées** : voir [`.vibe/CONVENTIONS.md`](.vibe/CONVENTIONS.md) — ne jamais
   les casser (hiérarchie GLB, métriques, clamp sol, pieds plantés par défaut, attribution
   BodyParts3D **CC BY-SA 2.1 Japan © DBCLS** visible dans l'app et le README).
4. **Livraison** : commits petits et fréquents sur `vibe/<slug>-ae8a7a`, push, `gh pr ready`,
   puis **ff-push `<branche>:main`** (les merges gh API sont bloqués dans le sandbox ; la PR passe
   MERGED automatiquement), surveiller `gh run list --branch main` jusqu'à `success`, vérifier le
   site live, puis commit checkpoint (CONTEXT.md/TASKS.md) sur main.
   **Garantie de non-régression** : la CI (`.github/workflows/deploy.yml`) exécute le job `test`
   (`npm ci && npm test && npm run build`) à chaque push sur `main` **et chaque PR** ; le déploiement
   Pages (`build`/`deploy`) n'a lieu que si `test` passe (`needs: test`). Aucun merge ne peut
   casser les tests sans faire échouer le run.
5. **Jamais de secret** en clair ; push uniquement via
   `https://x-access-token:${GH_TOKEN}@github.com/arcodange-org/dance-hips-movement-3D-comparison.git`.

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
