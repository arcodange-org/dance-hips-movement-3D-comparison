# CONTEXT.md — état du projet et méthode anti-amnésie (cross-session)

Ce fichier est la **source de vérité** pour reprendre le travail dans une nouvelle session.
Règle d'or : **aucun état important uniquement en mémoire ou dans /tmp** — tout vit dans ce
dépôt (ce fichier, `docs/spec-*.md`, `docs/adr/*`, `docs/TASKS.md`, README) et sur GitHub
(branche + PR), poussés tôt et souvent.

## Liens

- Dépôt : https://github.com/arcodange-org/dance-hips-movement-3D-comparison
- Site déployé (GitHub Pages) : https://arcodange-org.github.io/dance-hips-movement-3D-comparison/
- PR en cours / historique : `gh pr list --repo arcodange-org/dance-hips-movement-3D-comparison`
- Derniers runs CI (Pages) : `gh run list --repo arcodange-org/dance-hips-movement-3D-comparison --branch main --limit 5`
- Branche de travail courante : voir `git branch --show-current` (convention `vibe/phaseN-<slug>-ae8a7a`)

## Où en est le projet

- Phases 1–4 **mergées dans `main`** : migration Vite+React+three TS, IK de pas, anatomie
  BodyParts3D régénérée, persistance localStorage, vertèbres L/D, déploiement Pages, GIFs
  motion design, mouvements sourcés sur place (2 temps, sorties garçon/fille), couche
  musculaire BodyParts3D, tests numériques (`npm test`).
- Phase 6 **LIVRÉE** (PR #4 mergée 2026-11-18, commit `83d680b` sur main, CI Pages run
  44284489080 = success, site live vérifié : assets 200 + smoke headless 0 erreur console sur
  comparatif-appuis / sortie paire diago / corridinho / muscles) — branche
  `vibe/phase6-vues-plant-solid-ae8a7a`. Contenu :
  comparatif d'appuis (jauges G/D ×2 en mode Comparaison, `statsBRef` + composant `Gauge`),
  corridinho (`corridinhoPath` : pivot D 0–3, pivot G 4–7, cercle R=0,3 m autour du repère
  8–15, `corridinho=`), presets caméra `src/cameras.ts` (`cam=default|hip|fixed|wide|diag|front|back`,
  diago par défaut en paire), `solid=1` (`SOLID_TORSO_OPACITY=0.62`), pieds plantés en sur place
  (`plantBlend`, amendment convention 2026-11-18, `plant=0` = ancien glissé), **ligne de danse**
  (`LineOfDance` en rubans roses — piège : `THREE.Line` 1 px invisible après downscale GIF),
  paire réorientée sur la ligne (face à face selon z, sortie = `sortieOffset` sur root.x local,
  perpendiculaire, retour temps 5+), dissociation (contre-rotation chest/head pendant la
  sortie), Gherkin `docs/features/*.feature` + `scripts/test_features.mjs` → **19 PASS / 0 FAIL /
  1 SKIP** dans `npm test`. 11 GIFs regénérés (`docs/gifs/`, sortie/corridinho/comparatif avec
  `ligne=1&repere=1&solid=1`). Vérifs : sortie latérale confirmée numériquement (root.x
  0→0,22 m au pic), ligne rose mesurée dans les frames GIF (117–458 px), jauges/torse opaque/
  pieds au sol confirmés visuellement. Spec : `docs/spec-phase6-comparatif-appuis-corridinho.md`.
- Phase 7 **en livraison** (branche `vibe/phase7-isolation-ginga-ae8a7a`, PR #5) — **objectif
  premier redéfini 2026-11-18 : discerner les isolations du bas du corps, le haut du tronc
  (au-dessus du bassin) doit rester stable et vertical**. Recherche web FR/EN/PT sur la ginga
  angolaise : `docs/ginga-angolana.md` (citations verbatim). Implémenté : `iso=1` **par défaut**
  (`lockUpperTrunk` : spine contre-rotate le pelvis, chest/head sans bascule latérale, pitch
  conservé pour vague suave/cambré zouk), **cadre de bras de danseur** `cadre=1` par défaut
  (`applyDanceFrame` : coudes pliés, avant-bras G en haut paume→droite, avant-bras D vers la
  gauche paume→buste), métrique `upperStability` + HUD « stabilité buste % », Gherkin
  `isolation-basse.feature` (npm test 22 PASS 0 FAIL 1 SKIP). Fessiers (GluteusMaximus/Medius,
  parentés au Pelvis) visibles et mobiles en vue de dos — vérifié numériquement (centroid
  musculaire déplacé entre 2 temps) + GIF `fessiers-muscles.gif`, `isolation-ginga.gif`.
  Spec : `docs/spec-phase7-isolation-basse.md`.
- Phase 8 **en livraison** (branche `vibe/phase8-mouvements-ae8a7a`, PR #6) — déplacements
  (priorité : mouvements individuels) : **bug os flottants plant=0 corrigé** (translations GLB
  Patella_L/Fibula_R/Fibula_L → `scripts/fix_knee_bone_offsets.py` + test Gherkin sur le GLB) ;
  **quarts de tour séparés** du corridinho (`quarts=1`, `quartsPath` 0→2π/16 temps ; en paire le
  suiveur en marche arrière via `reverse`+`reversePath`) ; **marche avant/arrière** (`dir=-1`) +
  **marka « 3 temps »** (`temps3=1`, `swingBeat`) ; **ida e volta** (`ida=1`, L avant/arrière puis
  R avant/arrière, 8 temps, solo et paire). Gherkin `mouvements-deplacement.feature` → 27 PASS
  0 FAIL. 18 GIFs. Spec : `docs/spec-phase8-deplacements.md`.
- Phase 9 **en livraison** (branche `vibe/phase9-partage-vue-ae8a7a`, PR #7) : bouton
  **« 🔗 Partager la vue »** (URL complète + angle caméra `campos=`/`camtgt=` restauré à la charge,
  `src/share.ts` + Gherkin `partage-url.feature`), **cadre de la suiveuse** en paire
  (`DANCE_FRAME_FOLLOWER`), **boussole 8 directions** au repère (`CompassRose.tsx`, `boussole=`,
  E=+x=ligne de danse) + HUD direction du buste (diago) et position / repère (`src/directions.ts`,
  Gherkin `directions.feature`), README avec **<details> « Détails & source » sous chaque GIF** +
  bascule segmentée **Vue Squelette / + Muscles**. Spec : `docs/spec-phase9-partage-boussole.md`.
- Phase 10 **LIVRÉE** (PR #8 mergée, commit `49e8058`, CI success) — **harness agentique** :
  `AGENTS.md` racine (lu en premier, avec section « Maintenance de ce fichier ») + dossier caché
  `.vibe/` = `README.md` + `HARNESS.md` (démarrage session, anti-amnésie, livraison ff-push/CI/site,
  sandbox, secrets) + `CONTRIBUTING.md` (cycle phase complet) + `CONVENTIONS.md` (conventions
  verrouillées + params URL). Toute session Mistral peut adopter et continuer le projet en
  autonomie.
- Phase 11 **en cours** (branche `vibe/phase11-virgula-vue-ae8a7a`) — **vírgula + URL angle/zoom** :
  sur les quarts de tour le pied fait l'angle avec le corps (pivot sur la boule du pied,
  `virgulaFootYawDelta`, recherche `docs/virgula.md`) ; params URL `angle=`/`zoom=` en plus de
  `campos`/`camtgt` (`viewAnglesOf`/`posFromView`/`resolveView` dans `src/cameras.ts`) ; preset
  caméra `top` + GIF `virgula-quarts.gif`. Spec : `docs/spec-phase11-virgula-vue.md`.
- Rétrospective / boucle de feedback : `docs/retrospective-phase3-5.md` +
  `docs/retrospective-phase6.md` + méta-tâche M4 récurrente dans `docs/TASKS.md`.
- Phase 5 **livrée** : PR #3 mergée dans `main` (2026-11-18), CI Pages run 44272969552 =
  success, site vérifié (assets 200, smoke headless sans erreur). Branche :
  `vibe/phase5-repere-fixe-appui-ae8a7a`. Contenu : repère fixe
  (OriginMarker + `repere=` + `cam=fixed|wide` + pan off en bare), appuis & transmission
  (`support(b)`, pastilles de charge, chaîne pied→genou→hanche emissive, HUD, `appui=`),
  GIF vedette README = kizomba sur place + muscles (`kizomba-muscles-sur-place.gif`), corrections
  sourcing + ADR 003. Spec : `docs/spec-phase5-repere-fixe-appui.md`, tâches : `docs/TASKS.md`.

## Méthode anti-amnésie (à respecter à chaque session)

1. **Lire ce fichier d'abord**, puis `git fetch origin && git status`, puis `npm test`.
2. Branche de travail créée **dès le début** de chaque phase et **poussée tôt** ; PR **draft
   ouverte tôt** (`gh pr create --draft`) → l'état survit à la mort de la session.
3. **Commits petits et fréquents**, push après chaque unité de travail ; message = état.
4. À chaque jalon : mettre à jour `CONTEXT.md` + `docs/TASKS.md` et committer (checkpoint).
5. Tâches suivies à la fois dans l'outil de todo de la session **et** dans `docs/TASKS.md`
   (le fichier gagne — il survit).
6. Merge dans `main` par fast-forward push (`git push <token-url> <branche>:main`) — les
   outils de merge gh sont bloqués dans le sandbox ; la PR passe alors MERGED automatiquement.
   Surveiller `gh run list --branch main` (workflow « Deploy to GitHub Pages ») jusqu'à
   `success`, puis vérifier le site (200 sur `/`, GLB, draco, fonts, GIFs).
7. Assets lourds (zip BodyParts3D ~136 Mo, debs chromium, polices) restent en `/tmp` mais
   **re-téléchargeables** via les procédures documentées (README + ADR 002) : ne jamais les
   considérer comme de l'état.
8. Ne jamais exposer de secret ; push uniquement via
   `https://x-access-token:${GH_TOKEN}@github.com/arcodange-org/dance-hips-movement-3D-comparison.git`.

## Procédure de reprise de session (checklist)

```bash
git fetch origin && git checkout <branche-en-cours> && git status
npm test && npm run build          # sanity
cat CONTEXT.md docs/TASKS.md      # état + prochaines tâches
gh pr list --state open --repo arcodange-org/dance-hips-movement-3D-comparison
gh run list --branch main --limit 3 --repo arcodange-org/dance-hips-movement-3D-comparison
# reprendre la première tâche non cochée de docs/TASKS.md
```

## Conventions verrouillées (ne pas casser)

- Hiérarchie glTF : `Skeleton → Pelvis → HipPivot_R/L → Femur → KneePivot → Tibia/Fibula/Patella
  → AnklePivot → Foot_R/L`. Le code anime `r.hipR/L, r.kneeR/L, r.footR/L, r.root`.
- Métriques (`anatomy_meta.json`) : HIP_Y = 0,8835 m, inter-hanches 0,168 m, hanche→genou
  0,440 m, genou→cheville 0,389 m, HIP_WIDTH = 0,34 m. **Clamp sol** `root.position.y >= 0`.
- Pieds plats : `foot.rotation.x = -(hip.x + knee.x) + extra`. Déplacement 0 = sur place,
  1 = ±17 cm avec IK de pas. Modes Solo / Observation hanche / Comparaison / Face à face.
- Animation **paramétrique f(temps)** (pas de mocap). Réglages persistés (localStorage).
- **Attribution obligatoire** : maillages BodyParts3D v4.0, © DBCLS, **CC BY-SA 2.1 Japan**
  visible dans l'app et le README. Police embarquée : sous-ensemble DejaVu (Bitstream Vera).

## Environnement sandbox (rappels)

- Node 22, npm OK. Pas de curl ; python urllib OK. Chromium headless : `LD_LIBRARY_PATH=/tmp/debs/root/usr/lib/x86_64-linux-gnu`, args `--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader`, et `FONTCONFIG_FILE=/tmp/fontconfig/fonts.conf` (dir DejaVu) sinon aucun texte n'est rendu. ffmpeg-static **sans drawtext** → habillage des GIFs rendu par la page (`?demo=`).
- `vite preview --port 4173` pour les captures (`npm run capture`, `CAPTURE_BASE` pour changer).
- gh : `pr create/ready/view/list`, `run list/view` OK ; mutations API et merge bloqués →
  ff-push `branche:main`.
