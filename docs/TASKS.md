# TASKS.md — liste des tâches (miroir persistant de la todo-list de session)

Phase 5 — LIVRÉE (PR #3 mergée, CI Pages run 44272969552 = success, site vérifié) — branche `vibe/phase5-repere-fixe-appui-ae8a7a` — spec : `docs/spec-phase5-repere-fixe-appui.md`.
Mise à jour à chaque commit (checkpoint anti-amnésie, voir `CONTEXT.md`).

- [x] 1. Spec + méthode anti-amnésie (CONTEXT.md, TASKS.md) + branche + PR draft poussée tôt
- [x] 2. Repère fixe : OriginMarker.tsx + case « Repère fixe » + `repere=` + `cam=fixed` + pan off en bare
- [x] 3. `support(b)` par style dans styles.ts + bornes [-1,1] dans `npm test`
- [x] 4. Appui : pastilles de charge sous les pieds + chaîne emissive pied→genou→hanche + HUD (charge G/D %, genou °, roll bassin °) + case `appui=`
- [x] 5. Corrections docs/styles-de-danse.md (tempo semba, avant-pied, citations verbatim) + ADR 003
- [x] 6. capture_gifs.mjs : GIF vedette `kizomba-muscles-sur-place.gif`, sortie en `cam=fixed`, GIF appui ; régénérer docs/gifs/
- [x] 7. README : GIF vedette en tête + note vérification + galerie + params d'URL
- [x] 8. Vérifs : `npm test`, `npm run build`, smoke headless (muscles+appui, sortie cam=fixed), preview
- [x] 9. Livraison : push, PR ready, ff-merge main, CI Pages success, vérif site live, maj CONTEXT.md/TASKS.md

---

## Phase 6 — LIVRÉE (PR #4 mergée 2026-11-18, commit 83d680b, CI Pages run 44284489080 = success, site vérifié 200 + smoke headless 0 erreur) — spec : `docs/spec-phase6-comparatif-appuis-corridinho.md` — branche `vibe/phase6-vues-plant-solid-ae8a7a`

- [x] 10. Mode « comparatif d'appuis » : `statsBRef` + panneau **jauge G/D par corps** (2 jauges
  en mode Comparaison, bare + normal) ; GIF `comparatif-appuis.gif` (kizomba vs kompa, `cam=wide`,
  `ligne=1&repere=1`) — 4 jauges G/D lisibles vérifiées visuellement
- [x] 11. Corridinho au repère fixe, **uniquement après pivot droit (1/4 tour) puis pivot
  gauche** : `corridinhoPath(b)` (16 temps : pivot D 0–3, pivot G 4–7, cercle R=0,3 m autour de
  l'origine 8–15) + case + `corridinho=` + tests Gherkin + GIF `corridinho.gif` (`cam=fixed`,
  `ligne=1&repere=1`) — cercle autour du repère confirmé visuellement sur 2 frames
- [x] 13. Vues lisibles pour les sorties : `src/cameras.ts` presets `cam=default|hip|fixed|wide|diag|front|back`,
  **diago par défaut en paire** (`resolveCam`), paire réorientée sur la ligne (z=∓0,14, rotY 0/π) ;
  GIF sortie en `cam=diag` — déplacement latéral confirmé numériquement (root.x 0→0,22 m au pic
  de l'enveloppe, sonde `window.__dbg` jetable) et ligne visible
- [x] 14. `solid=1` → `SOLID_TORSO_OPACITY=0.62` via prop `torsoOpacity` sur Rig ; 11 GIFs regénérés
  avec `solid=1` — torse opaque confirmé visuellement
- [x] 15. Pieds plantés en sur place : `plantBlend(travel, plant)`, swing IK coupé à travel=0,
  case « Pieds plantés » + `plant=` ; vérif visuelle pleine vue plant=1 (pieds au sol) vs plant=0 ;
  amendment de convention documenté dans README (2026-11-18)
- [x] 16. Ligne de danse : `LineOfDance` (rubans/boxes roses — les `THREE.Line` 1 px disparaissent
  au rééchantillonnage GIF, piège trouvé en relisant les frames : 0 px rose → boxes,
  117–458 px rose après) + paire sur la ligne + `sortieOffset(b,amp)=0.22·enveloppe·amp` sur
  root.x local, retour ligne temps 5+ ; GIF sortie `cam=diag&ligne=1&repere=1`
- [x] 17. Dissociation : contre-rotation chest (−0,22 rad) + head (−0,12 rad) pendant la sortie,
  buste orienté sur la ligne de danse (version simple ; cadre de bras à affiner après relecture
  visuelle — backlog)
- [x] 18. Validations Gherkin : `docs/features/*.feature` (7 fichiers) + `scripts/test_features.mjs`
  dans `npm test` → **19 PASS, 0 FAIL, 1 SKIP @wip** + fonctions pures `plantBlend`/`sortieOffset`/`corridinhoPath`
- [x] 12. Vérifs + livraison phase 6 : `npm test` (19 PASS 0 FAIL 1 SKIP), build OK, smoke headless
  live (compare/appui, pair sortie diag, corridinho, muscles : 0 erreur console), push, PR #4 ready,
  ff-merge main, CI Pages success, site live vérifié, checkpoint CONTEXT/TASKS sur main

## Phase 7 — LIVRÉE (objectif premier : isolations du bas du corps, buste stable) — spec : `docs/spec-phase7-isolation-basse.md` — recherche : `docs/ginga-angolana.md` — branche `vibe/phase7-isolation-ginga-ae8a7a`, PR #5

- [x] 19. Recherche web approfondie ginga angolaise FR/EN/PT → `docs/ginga-angolana.md` (citations
  verbatim : Eddy Vents « movements hips down are the dominant ones », SOS Dance « Keep the shoulder
  line level and do not pitch or sway the entire body », udansa « upper body remains stable », etc.)
- [x] 20. `iso=1` par défaut : `lockUpperTrunk` (spine contre-rotate le pelvis → thorax vertical ;
  chest/head y/z → 0 ; pitch conservé pour vague suave/cambré zouk) + case + `iso=`
- [x] 21. Cadre de bras de danseur `cadre=1` par défaut : `applyDanceFrame`/`DANCE_FRAME` — coudes
  pliés, bras avant, avant-bras G en haut paume→droite, avant-bras D vers la gauche paume→buste ;
  vérifié visuellement en cam=front + case + `cadre=`
- [x] 22. Métrique `upperStability`/`residualRoll` (pures) + HUD « stabilité buste % » (Gauge + solo,
  bare + normal) + Gherkin `isolation-basse.feature` → npm test 22 PASS 0 FAIL 1 SKIP
- [x] 23. Fessiers visibles et mobiles : glutes (GluteusMaximus/Medius) parentés au Pelvis — vérifié
  vue de dos (cam=back, muscles=1) : centroid rouge déplacé ~9 px entre 2 temps + GIF
  `fessiers-muscles.gif` ; GIF `isolation-ginga.gif` (cam=diag) ; 13 GIFs au total
- [x] 24. README (objectif en tête, params iso=/cadre=, galerie 13 GIFs, options) + livraison PR #5 +
  ff-merge main + CI + site live + checkpoint

## Phase 8 — LIVRÉE — spec : `docs/spec-phase8-deplacements.md` — branche `vibe/phase8-mouvements-ae8a7a`, PR #6

- [x] 25. Bug os flottants (plant=0) : cause GLB (Patella_L/Fibula_R/Fibula_L mal placés) →
  `scripts/fix_knee_bone_offsets.py` + test Gherkin (GLB parse) + vérif visuelle plant=0 travel 0/0.6
- [x] 26. Quarts de tour séparés du corridinho (`quarts=1`, `quartsPath` 0→2π sur 16 temps) + en paire
  le suiveur en marche arrière (`reverse` + `reversePath`) ; GIFs `quarts-de-tour.gif` (tour complet
  vérifié face→dos), `corridinho-paire.gif`
- [x] 27. Marche avant/arrière (`dir=-1` = arrière, `travelOffset`) + marka « 3 temps » (`temps3=1`,
  `swingBeat` période 3) ; GIFs `marche-3temps.gif`, `marche-arriere.gif`
- [x] 28. Ida e volta (`ida=1`, `idaEVoltaStep` : L avant/arrière puis R avant/arrière, 8 temps),
  seul et à 2 face à face ; GIF `ida-e-volta.gif` (mode pair)
- [x] 29. Gherkin `mouvements-deplacement.feature` → npm test 27 PASS 0 FAIL 1 SKIP ; 18 GIFs ;
  README/TASKS/CONTEXT ; livraison PR #6 + ff-merge + CI + site live + checkpoint

## Phase 9 — LIVRÉE — spec : `docs/spec-phase9-partage-boussole.md` — branche `vibe/phase9-partage-vue-ae8a7a`, PR #7

- [x] 30. Bouton « 🔗 Partager la vue » : URL avec tous les paramètres d'état + **angle caméra**
  (`campos=`/`camtgt=` depuis OrbitControls ; restore à la charge, primant sur `cam=`) ; copie
  presse-papiers + replaceState + feedback ; fns pures `src/share.ts` + Gherkin `partage-url.feature`
  — vérifié end-to-end (clic → URL avec campos/camtgt ; rechargement → caméra restaurée)
- [x] 31. Cadre de bras de la **suiveuse** en paire (`DANCE_FRAME_FOLLOWER` : coude G levé hauteur
  d'épaule, avant-bras vers le dos du guideur ; coude D baissé, main D vers la main G du guideur)
  — vérifié visuellement en pair cam=front (cadres complémentaires, mains au centre) + Gherkin
- [x] 32. README : `<details>` « Détails & source » sous **chaque** GIF (brief + source + crosslink
  docs) ; bascule segmentée **Vue Squelette / + Muscles** (la chaîne d'appui sol→genoux→hanches
  reste visible dans les deux vues)
- [x] 33. Livraison phase 9 : tests 32 PASS 0 FAIL, build, vérifs headless (boussole 8 directions
  étiquetées au repère, pair, campos=), PR #7 + ff-merge main + CI + site live + checkpoint
- [x] 34. Boussole 8 directions (4 cardinales + 4 diago, E=+x=ligne de danse) au repère fixe
  (`CompassRose.tsx`, `boussole=`) + HUD direction du buste (diago) + position / repère
  (`src/directions.ts`, Gherkin `directions.feature`)

## Phase 10 — LIVRÉE — harness agentique — branche `vibe/phase10-harness-ae8a7a`, PR #8

- [x] 35. `AGENTS.md` racine (lu en premier ; règles d'or + **section « Maintenance de ce fichier »**
  : mis à jour dans le même commit que tout changement de structure/workflow) + dossier caché
  `.vibe/` : `README.md` (index), `HARNESS.md` (harnais de session anti-amnésie : démarrage,
  règles, livraison ff-push+CI+site, sandbox, secrets), `CONTRIBUTING.md` (cycle phase spec-first →
  Gherkin → captures → PR → merge → checkpoint + rétrospective M4), `CONVENTIONS.md` (conventions
  verrouillées + params URL + tests)

## Phase 11 — LIVRÉE (PR #9, commit `da6968a`, CI success) — vírgula + URL angle/zoom de vue

Spec : `docs/spec-phase11-virgula-vue.md` ; recherche : `docs/virgula.md` (citations verbatim
FR/ES/PT/EN/DE).

- [x] 36. Vírgula : `virgulaFootYawDelta(footWorldYaw, bodyWorldYaw)` pur dans `src/styles.ts` ;
  appliqué dans `Rig.tsx` quand `quarts||corridinho` (lacet monde du pied = lacet du corps,
  pivot sur la boule du pied, contact sol constant) — vérifié par sonde : max |footYaw−bodyYaw|
  = 4.4e-4 rad sur 354 frames ; Gherkin `virgula-cadre.feature` + verrou cadre
  (`DANCE_FRAME.forearmLeft` avant-bras G vers le haut, paume → droite)
- [x] 37. URL angle/zoom : `viewAnglesOf`/`posFromView`/`resolveView` dans `src/cameras.ts`
  (params `angle=` degrés, `zoom=` m, priorité sous `campos`/`camtgt`), preset `top` ;
  `buildShareUrl(..., view?)` ajoute `angle`/`zoom` ; `App.tsx` parse + `onShare` ; Gherkin
  `vue-angle-zoom.feature`
- [x] 38. Captures + docs : GIF `virgula-quarts.gif` (`cam=top`, demo `virgula`, 19 GIFs au
  total), README (GIF + `<details>` source + params `angle`/`zoom`), `.vibe/CONVENTIONS.md`,
  CONTEXT.md

## Méta — boucle de feedback (rétrospective auto-critique + critique de session indépendante)

Réf : `docs/retrospective-phase3-5.md` (pièges, raccourcis à tort, process amélioré).

- [x] M0. Rétrospective phases 3–5 rédigée (pièges 1–15, raccourcis, process) — fait le 2026-11-18 ;
  addendum phase 6 dans `docs/retrospective-phase6.md` (itération 2026-11-18 : specs-first +
  Gherkin en amont ; piège : `THREE.Line` 1 px invisible après downscale GIF → rubans ; piège :
  ne jamais lancer write_file et git add en parallèle — course, un fichier oublié d'un commit)
- [ ] M1. `scripts/check_sources.mjs` : link-check (HTTP 200) de toutes les URLs de
  `docs/styles-de-danse.md` + README, exécuté en CI ou via `npm test`
- [ ] M2. Self-check des captures dans `capture_gifs.mjs` : GIF non vide, 0 erreur console,
  ≥1 frame extraite et relue visuellement par capture
- [ ] M3. Chargement paresseux du GLB muscles uniquement si `muscles=1` (perf réseau)
- [ ] M4. **Méta-tâche récurrente** : à la fin de chaque phase, relire
  `docs/retrospective-*.md`, ajouter une nouvelle rétrospective (auto-critique + session
  indépendante), évaluer les tâches à (r)ajouter ici, puis **re-ajouter cette ligne M4** —
  répéter jusqu'à satisfaction objective (rigueur maximale)
