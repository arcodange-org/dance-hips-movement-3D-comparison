# HARNESS.md — harnais de session (anti-amnésie)

Objectif : qu'une **nouvelle session Mistral** (multi-campaign / cross-session amnesia) reprenne
le projet sans perdre d'état et travaille **en continu et en autonomie**.

## 1. Démarrage de session (checklist, dans l'ordre)

```bash
cat AGENTS.md                      # ce harness, règles d'or
cat CONTEXT.md docs/TASKS.md       # état du projet + prochaines tâches (source de vérité)
git fetch origin && git status && git branch --show-current
npm test                           # sanity (tests numériques + Gherkin)
npm run build                      # sanity build (tsc + vite)
gh pr list --state open --repo arcodange-org/dance-hips-movement-3D-comparison
gh run list --branch main --limit 3 --repo arcodange-org/dance-hips-movement-3D-comparison
# reprendre la première tâche non cochée de docs/TASKS.md
```

- Branche de travail courante : convention `vibe/<phaseN>-<slug>-ae8a7a`.
- Le site déployé : https://arcodange-org.github.io/dance-hips-movement-3D-comparison/

## 2. Méthode anti-amnésie (règles impératives)

1. **Aucun état important uniquement en mémoire ou dans /tmp** : tout vit dans le dépôt
   (`CONTEXT.md`, `docs/TASKS.md`, `docs/spec-*.md`, `docs/adr/*`, `docs/features/*`, README,
   `.vibe/*`) et sur GitHub (branche + PR poussées tôt, souvent).
2. **Branche + PR draft ouverts dès le début** de chaque phase → l'état survit à la mort de la
   session (`gh pr create --draft`).
3. **Commits petits et fréquents**, push après chaque unité de travail ; le message = l'état.
4. **Checkpoint à chaque jalon** : mettre à jour `CONTEXT.md` + `docs/TASKS.md` et committer.
5. Tâches suivies à la fois dans l'outil de todo de la session **et** dans `docs/TASKS.md` (le
   fichier gagne — il survit).
6. Ne **jamais** lancer `write_file` et `git add` en parallèle (course : un fichier a déjà été
   oublié d'un commit). Écrire, puis add, séquentiellement.
7. Ne **jamais** exposer de secret. Push uniquement via
   `https://x-access-token:${GH_TOKEN}@github.com/arcodange-org/dance-hips-movement-3D-comparison.git`.
8. Ne jamais `pkill -f vite` (self-match). Assets lourds en `/tmp` mais re-téléchargeables via les
   procédures documentées (README + ADR 002).

## 3. Livraison d'une phase (flow standard)

1. Spec `docs/spec-phaseN-*.md` + tâches dans `docs/TASKS.md` + branche `vibe/...` + PR draft.
2. Code + fonctions pures testables + scénarios Gherkin `docs/features/*.feature`
   (`scripts/test_features.mjs`, zero-dep, dans `npm test`). Captures GIF via
   `npm run build && npm run capture` (`scripts/capture_gifs.mjs`, Playwright headless).
3. Vérifs : `npm test`, `npm run build`, smoke headless (0 erreur console), relecture visuelle des
   frames extraites (à des temps calculés depuis le bpm — une frame isolée peut conclure à tort ;
   si doute, mesurer dans la scène, p. ex. sonde jetable `window.__dbg` retirée avant commit).
4. Push, `gh pr ready N`, puis **ff-push** `git push <token-url> <branche>:main` (les mutations
   `gh api`/merge sont bloquées dans le sandbox ; la PR passe MERGED automatiquement).
5. Surveiller `gh run list --branch main` (workflow « Deploy to GitHub Pages ») jusqu'à `success`,
   puis vérifier le site live (200 sur `/`, GLB, draco, fonts, GIFs via raw.githubusercontent).
   **Garantie de non-régression en CI** : le job `test` du workflow (`npm ci && npm test &&
   npm run build`) tourne à chaque push sur `main` et chaque PR, et `build`/`deploy` ont
   `needs: test` — le site n'est déployé que si tous les tests passent. En cas d'échec, lire
   `gh run view <id> --log-failed`, corriger, re-pusher. Note : la `concurrency` (groupe `pages`,
   `cancel-in-progress`) peut annuler le run **push** quand un run **PR** tourne en parallèle sur
   le même SHA, et `gh run rerun` est bloqué par l'intégration → pousser n'importe quel nouveau
   commit sur `main` (ex. le checkpoint) redéclenche un run push propre qui déploie.
6. **Commit checkpoint** sur main : `CONTEXT.md` + `docs/TASKS.md` à jour.

## 4. Rétrospective (boucle M4)

À la fin de chaque phase : addendum dans `docs/retrospective-*.md` (pièges, raccourcis pris à
tort, process amélioré, tâches à (r)ajouter), puis **re-ajouter la méta-tâche M4** dans
`docs/TASKS.md` — répéter jusqu'à satisfaction objective.

## 5. Environnement sandbox (rappels)

- Node 22, npm OK. Pas de curl ; `python3` urllib OK. Chromium headless : `LD_LIBRARY_PATH=/tmp/debs/root/usr/lib/x86_64-linux-gnu`,
  args `--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader`, et
  `FONTCONFIG_FILE=/tmp/fontconfig/fonts.conf` (dir DejaVu) sinon aucun texte n'est rendu.
- `vite preview --port 4173` sert `dist/` pour les captures (`npm run capture`, `CAPTURE_BASE`).
- ffmpeg-static **sans drawtext** → l'habillage des GIFs est rendu par la page elle-même
  (`?demo=<clé>`, `src/components/DemoOverlay.tsx`) ; ne jamais recadrer les vidéos (coupe
  l'overlay) — utiliser les presets `?cam=` ; la sonde de durée réelle est faite avant `-ss`.
- Éléments fins destinés aux GIFs : tester APRÈS le downscale/palette (piège : `THREE.Line` 1 px
  invisible → utiliser des rubans/boxes, voir `LineOfDance.tsx`).
- gh : `pr create/ready/view/list`, `run list/view` OK ; mutations API et merge bloqués → ff-push.
- Rate limit gh (429) : attendre ~60 s, réessayer une fois, puis remonter l'erreur.
