# CONTEXT.md — état du projet et méthode anti-amnésie (cross-session)

Ce fichier est la **source de vérité** pour reprendre le travail dans une nouvelle session.
Règle d'or : **aucun état important uniquement en mémoire ou dans /tmp** — tout vit dans ce
dépôt (ce fichier, `docs/spec-*.md`, `docs/adr/*`, `docs/TASKS.md`, README) et sur GitHub
(branche + PR), poussés tôt et souvent.

## Travail en cours — sortie garçon #21 et spec éditeur #22

Base `2621e59`, branche `arcodange/sortie-garcon`, worktree `.Codex/worktrees/sortie-garcon`.
Séquence et clarification pieds du leader/partenaire validées par le propriétaire. Issues :
[#21](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/21),
[#22](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/22).
Specs poussées avant le code : `docs/spec-sortie-garcon.md`, `docs/spec-editeur-figures.md`.
Une PR demandée, sans fusion. Sortie fille/combiné hors périmètre ; éditeur = documentation.

- Plan coordonné en cinq actions, quatre transferts, croisé et marka sans transfert.
- Deux fins, contraposition réglable, arrêt final, poses sélectionnables, rejeu, partage et export.
- Corrections de revue M4 : bassin progressif aux actions 1/3, modulation de marche interrompue
  pendant le marka, dégagement des os mesuré sur triangles ; chargement sous Suspense,
  portée des paramètres/exports et remise à zéro des traces au seek/rejeu.
- Vérifications locales : 7 272 poses G, 2 052 poses de couple pour les os des jambes,
  576 références F/GF inchangées ; tests historiques et build réussis. Navigateur, chargement
  différé, partage et export vérifiés ; GIF ajouté. Voir `docs/retrospective-sortie-garcon.md`.
  Les paragraphes de phases ci-dessous sont historiques.

## État courant — corrections de l’audit #17

Base initiale : `3ccdc75` (phase 16) ; `main` `ce84acd` (PR #18, oracle) intégré avant
réouverture de la PR #19, en conservant les deux runners de tests. Issue créée avant le code :
https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/17.
Branche `arcodange/audit-poses-finales`, worktree `.Codex/worktrees/audit-poses-finales`.
Livraison demandée : une PR regroupée, sans fusion ni déploiement automatique de cette session.
La phase 17 reste hors périmètre ; la phase 18 provient de #18, sans modification de son oracle.
Les paragraphes de phases ci-dessous sont historiques.

- `pose.ts` partagé entre React et tests GLB ; horloge commune ; longueurs constantes,
  hauteur du bassin adaptée, trajectoires continues ; métriques après IK.
- Convention remplacée : `root.y >= 0`, tibia virtuellement raccourci et correction par sphères
  ne font plus autorité. Sol testé sur les sommets réels ; détails dans la spec #17.
- Écartement du couple et plafond de lean de phase 16 conservés. Repères de genou animés ;
  proximité explicitement distincte d’un contact mécanique, appuis explicitement illustratifs.
- Vérifications : 6 534 poses paramétrées, régressions composées et mode libre, 93 105 assertions
  de poses ; Gherkin 64 PASS / 0 FAIL / 1 SKIP. Revue indépendante sans défaut bloquant restant.
- Navigateur : Solo/Comparaison/Paire, même phase après changement de style et remontage,
  HUD sans doublon, exports depuis la pause de 4 et 16 temps, restauration de la pose/lecture,
  aucune erreur console. GIFs `audit-comparaison` et `audit-quarts-paire` actualisés ; ancienne
  galerie explicitement historique. Ces vérifications ne valident pas la technique de danse.
- Références : `docs/spec-audit-poses-finales.md`, `docs/retrospective-audit-poses.md`.

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
- Phase 11 **LIVRÉE** (PR #9 mergée, commit `da6968a`, CI success) — **vírgula + URL angle/zoom** :
  sur les quarts de tour/corridinho le pied fait l'angle avec le corps (pivot sur la boule du
  pied, `virgulaFootYawDelta` ; sonde : max |Δlacet| = 4.4e-4 rad ; recherche `docs/virgula.md`)
  ; params URL `angle=`/`zoom=` en plus de `campos`/`camtgt` (`viewAnglesOf`/`posFromView`/
  `resolveView` dans `src/cameras.ts`, preset `top`, écrits par « Partager la vue ») ; cadre
  avant-bras G vers le haut verrouillé par Gherkin ; GIF `virgula-quarts.gif` (19 GIFs).
  Spec : `docs/spec-phase11-virgula-vue.md`. Tests : 39 PASS 0 FAIL 1 SKIP.
- Phase 12 **LIVRÉE** (PR #10 mergée, commit `639f337`, CI success) — **bug os mal placés au genou** :
  dans `public/anatomy.glb` les maillages tibia/patella/fibula étaient mal assignés aux noms sous
  les KneePivot (fibule « en pointe » au genou G, rotule flottante mi-tibia D) ; corrigé par
  `scripts/fix_shin_bone_meshes.py` (mesh+scale+translations) + Gherkin `os-symetrie.feature`
  (43 PASS 0 FAIL). Spec : `docs/spec-phase12-os-genou.md`.
- Phase 13 **LIVRÉE** (PR #11 mergée, commit `349efb5`, CI success) — **garantie de non-régression** :
  job CI `test` (`npm ci && npm test && npm run build`) sur push main + chaque PR, déploiement
  Pages conditionné à `needs: test` (`.github/workflows/deploy.yml`) — vérifié sur le run 349efb5
  (job test success avant build/deploy). Doc harness mise à jour dans le même commit (AGENTS.md,
  `.vibe/HARNESS.md`, `CONTRIBUTING.md`, `CONVENTIONS.md`).
- Phase 14 **LIVRÉE** (PR #12 mergée, commit `92a34e2`, CI success ; PR #13 = garde-fou CI
  `if: github.event_name != 'pull_request'` sur build/deploy) — **options de déplacement
  exclusives (radio `movementOf`/`movementFlags` + groupe radio Controls, parsing URL exclusif) +
  vrais pivots de quart de tour** `quartTurnStep(b, reverse)` (talon pied G au bout du pied D à
  90°, pied D ramené parallèle ; haut du corps = lacet pied G, bas = lacet pied D ; sonde runtime
  exacte). 50 PASS 0 FAIL 1 SKIP. Spec : `docs/spec-phase14-options-pivots.md`.
- Phase 15 **LIVRÉE** (PR #14 mergée, commit `71c2016`, CI test success) — **paire biomécanique** :
  plus de paramètre « retard du suiveur » (delay supprimé ; en pair le suiveur = miroir exact de
  styleA, styleB réservé au mode compare) ; contacts **poitrine + bassin + genoux** visibles
  (`PAIR_DZ=0.125`, marqueurs `contactKneeL/R`, ContactViz 4 points, param `contacts=`) ;
  **posture par style** `posture:{lean,knee}` (flexion genoux intégrée à la résolution IK) ;
  **contraposition** ida (`idaContra`) + vírgula affinée (pied G au bout du pied D — sonde
  z=0.199≈0.200 — root suit le pied ; en paire le suiveur pivote d'abord le pied D à 90°).
  56 PASS 0 FAIL 1 SKIP, 21 GIFs. Spec : `docs/spec-phase15-paire.md` ; sources
  `docs/posture-contraposition.md`.
- Session 16–18 **spécifiée** (PR #15 mergée) : spec consolidée
  `docs/spec-session-16-18.md` (objectifs + audit des points faibles W1–W10 mesurés + modèle
  d'oracle) + harness renforcé (`.vibe/HARNESS.md` §6 pièges)
- Phase 16 **LIVRÉE** (PR #16 mergée, commit `b5d6d89`, CI push main run 44356011283 = success,
- Phase 17 **LIVRÉE** (PR #20 mergée, commit `43293bd`, CI push main run 44369926848 = success,
  site vérifié 200 + GIF/spec en ligne) : sortie garçon/fille/combinée G→F en **option
  exclusive** (`MovementKey` += sortieG/sortieF/sortieGF, `sortieActive(side, m, b)`, `pose.ts`
  via `sortieEnv`, radios paire, URL `sortie=1`(legacy G)/`sortieF=1`/`sortieGF=1`) — validé
  moteur (fixture GLB) + sonde navigateur (fenêtres G/F/combiné, retour x=0 en 16 temps) ;
  68 PASS Gherkin + 6 oracle ; GIF sortie combiné regénéré
- Phase 18 **LIVRÉE** (PR #18 mergée, commit `ce84acd`, CI push main run 44363605287 = success,
  site vérifié 200 + fichiers oracle en ligne) : oracle de poses discrètes par demi-pas en
  fichiers neufs (`src/oracle.ts`, `docs/oracle.feature`, `scripts/test_oracle.mjs` dans
  `npm test`) — 6 scénarios PASS (continuité + raccord de cycle, dualité reverse, angle droit
  π/2, contraposition ida) ; coordination issue #17 (commentaire déposé) ; phase 17 (sorties
  exclusives) **en attente de l'issue #17** (fichiers communs avec l'audit moteur)
- Phase 16 **LIVRÉE** (PR #16 mergée, commit `b5d6d89`, CI push main run 44356011283 = success,
- Phase 18 **EN COURS** (branche `vibe/phase18-oracle-ae8a7a`) : oracle de poses discrètes par
  demi-pas en fichiers neufs (`src/oracle.ts`, `docs/oracle.feature`, `scripts/test_oracle.mjs`
  branché dans `npm test`) — 6 scénarios PASS (continuité, raccord de cycle, dualité reverse,
  angle droit π/2, contraposition ida) ; coordination issue #17 (moteur réservé à un autre
  agent, commentaire déposé) ; phase 17 (sorties exclusives) en attente de #17
  site vérifié 200 + GIFs/feature en ligne) : contact fit en paire **sans les bras**
  (PAIR_DZ=0.175, marqueurs 0.16/0.14/0.135, sonde : pénétration corps −0.0015 m, marqueurs
  0.011–0.105 m) + **clamp sol renforcé** (aucun os sous y=0 : `clampSolY` + `groundDip`,
  sonde minY=+0.004 m) + Gherkin `sol-contact.feature` (64 PASS 0 FAIL 1 SKIP)
  (PAIR_DZ/marqueurs sur surface mesurée, lean plafonné en paire) → phase 17 sortie en option
  exclusive + combiné → phase 18 oracle de positions par demi-temps (`src/oracle.ts`).
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
