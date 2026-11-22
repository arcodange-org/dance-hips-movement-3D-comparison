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

## Phase 12 — LIVRÉE (PR #10, commit `639f337`, CI success) — bug os mal placés au genou

Spec : `docs/spec-phase12-os-genou.md` (bug URL observe/tarraxinha/ida=1, caméra rapprochée).

- [x] 39. `scripts/fix_shin_bone_meshes.py` : réassignation mesh+scale des os sous KneePivot
  (Tibia_R/Patella_R échangés, fibule D sur Patella_L, rotule G sur Fibula_R) + translations
  Tibia_R/Patella_R ; Gherkin `os-symetrie.feature` (symétrie L/R + classe de taille +
  placement tibia/fibula/patella) ; vérifié visuellement à l'angle du bug — 43 PASS 0 FAIL

## Phase 13 — LIVRÉE (PR #11, commit `349efb5`, CI success : job `test` puis build/deploy) — garantie de non-régression en CI

- [x] 40. `.github/workflows/deploy.yml` : job `test` (`npm ci && npm test && npm run build`, env
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`) déclenché sur push `main` **et** `pull_request` ;
  `build`/`deploy` Pages ont `needs: test` + `if: github.ref == 'refs/heads/main'` → le site
  n'est déployé que si tous les tests passent (vérifié : run 349efb5, job test success avant
  build/deploy). Doc harness à jour dans le même commit (règle « Maintenance de ce fichier » :
  AGENTS.md + `.vibe/*`).

## Phase 14 — LIVRÉE (PR #12, commit `92a34e2`, CI success : test 50 PASS + build + deploy ; PR #13 = fix `if` CI) — options exclusives + pivots de quart de tour

Spec : `docs/spec-phase14-options-pivots.md` (demandes 2026-11-18).

- [x] 41. Options exclusives : `MovementKey`/`movementOf`/`movementFlags` (pur, `src/styles.ts`) ;
  `movement`+`setMovement` dans `App.tsx` + parsing URL exclusif ; groupe **radio** dans
  `Controls.tsx` ; Gherkin `options-deplacement.feature`
- [x] 42. Pivots de quart de tour : `quartTurnStep(b, reverse)` pur (talon G au bout du pied D à
  90°, puis pied D parallèle ; haut du corps suit pied G, bas du corps pied D) + câblage `Rig.tsx`
  (root=lowerYaw, chest/head=dissociation, IK demi-pas 2 temps + lacet pied par cible) ; sonde
  runtime : |rootYaw−lowerYaw|=0, |chestYaw−(upper−lower)|=0, lacet pied=cible en fin de demi-pas ;
  Gherkin `quarts-pivots.feature`
- [x] 43. GIFs `quarts-de-tour`/`virgula-quarts`/`corridinho`/`corridinho-paire` regénérés (pivots
  visibles en cam=top) ; README/CONTEXT/CONVENTIONS — 50 PASS 0 FAIL 1 SKIP

## Phase 15 — LIVRÉE (PR #14, commit `71c2016`, CI test success) — paire biomécanique

Spec : `docs/spec-phase15-paire.md` ; sources : `docs/posture-contraposition.md` (verbatim EN/FR).

- [x] 44. Plus de paramètre « retard du suiveur » : `followDelay`/`delay` supprimés (App, Controls,
  URL, README) ; en pair le suiveur = miroir exact (phaseOffset 0) et danse **styleA** ; `styleB`
  réservé au mode compare (côte à côte) ; picker styleB désactivé en pair
- [x] 45. Contacts hanches/genoux visibles en paire : `PAIR_DZ=0.125` + marqueurs `contactKneeL/R`
  dans Rig + ContactViz à 4 points (genoux croisés en face à face) + param `contacts=` + Gherkin
  (écarts < 0.09 m) ; vérifié par comptage de pixels verts sur capture
- [x] 46. Posture par style `posture:{lean,knee}` dans STYLES (kizomba/tarraxinha fléchis+lean,
  zouk cambré) ; flexion genoux intégrée DANS la résolution IK (tibia effectif raccourci — sinon
  le pied reculait, la jambe étant à extension max au repos) ; Gherkin `paire-posture-contra.feature`
- [x] 47. Contraposition ida (`idaContra(b)` pur, haut vs bas opposés) + vírgula affinée
  (QTOE = bout du pied D, root suit le pied qui avance — sonde : pied G atteint z=0.199 ≈ cible
  0.200 ; reverse : le suiveur pivote d'abord le pied D à 90° puis rassemble le pied G) ; cadre
  vérifié correct à l'URL pair du bug ; GIFs `paire-contacts`, `quarts-paire` + 21 GIFs au total —
  56 PASS 0 FAIL

## Session 16–18 — spec consolidée : `docs/spec-session-16-18.md` (objectifs + audit W1–W10 + oracle)

- [x] 48. **Phase 16 — contact fit en paire** : sonde sommets (W4 : l'analyseur d'images ne suffit
  pas) à l'URL du bug, contact fit **sans les bras** (demande 2026-11-19) : PAIR_DZ=0.175
  (pire pénétration corps mesurée 0.174 m + marge), marqueurs sur la surface ventrale
  (poitrine z=0.16, bassin z=0.14, genoux z=0.135), lean plafonné à 0.10 en paire, flexion
  genoux via IK (L2eff) ; résultat sonde : pire pénétration CORPS = −0.0015 m (plus de
  traversée), marqueurs 0.011–0.105 m ; Gherkin écarts < 0.09 m ; GIFs paire regénérés
- [x] 51. **Clamp sol renforcé — aucun os sous le sol** (demande 2026-11-19) : `clampSolY`
  (pur) + `groundDip` (sphères englobantes monde, fin de frame) dans Rig ; `swingLift`
  (cloche ≥ 0) extrait en pur ; Gherkin `sol-contact.feature` ; sonde runtime : minY sommets
  monde = +0.004 m en solo (travel=1, quarts=1) et en paire
- [x] 49. **Phase 17 — sortie en option exclusive** : `MovementKey += "sortieG" | "sortieF" |
  "sortieGF"` ; `movementOf`/`movementFlags` à 7 drapeaux ; `sortieActive(side, m, b)` pur
  (G : leader cycle 8 ; F : follower ; combiné : cycle 16, leader 0–7 puis follower 8–15) ;
  `pose.ts` applique `sortieEnv` (mouvement prioritaire, legacy `sortie` préservé pour les
  tests de #19) ; App : 3 états + parse URL exclusif (`sortie=1` legacy = garçon, `sortieF=1`,
  `sortieGF=1`) + `cycleBeats` avec movement + partage URL ; Controls : checkbox sortie
  supprimée, 3 radios en mode paire ; validation moteur (fixture GLB) : fenêtres G/F/combiné
  OK, retour à x=0 en fin de cycle ; Gherkin 4 scénarios sortieActive (68 PASS + 6 oracle) ;
  GIF `sortie-garcon-fille` régénéré en combiné ; spec `docs/spec-phase17-sortie-exclusive.md`
- [x] 50. **Phase 18 — oracle de positions** : `src/oracle.ts` (`Pose`, `oraclePose`,
  `oracleHalfStep(movement, k, reverse)` → {start, end}) ; `docs/oracle.feature` + runner dédié
  `scripts/test_oracle.mjs` (branché dans `npm test`) : 6 PASS — continuité end(k)=start(k+1)
  + raccord de cycle, accord avec quartTurnStep aux frontières, dualité reverse (miroir z +
  lacets opposés + swap G/D), angle droit π/2 du pied pivotant, contraposition ida (signes
  opposés en milieu de pas, nuls aux frontières) ; rétrospective M4 addendum
  `docs/retrospective-M4-oracle.md`. NB : phase 17 (49) en attente de l'issue #17 (fichiers
  communs avec l'audit moteur) — coordination en commentaire de #17

## Audit #17 — corrections et preuves des poses finales

Spec : `docs/spec-audit-poses-finales.md`. Remplace les mécanismes de sol/IK décrits aux
points 46, 48 et 51 ; conserve les réglages d’écartement et de lean de phase 16.

- [x] 52. Moteur de pose commun au rendu et aux tests, horloge partagée, IK à longueurs
  constantes, pieds/sol et transitions continues, angles HUD après IK, appuis illustratifs,
  marqueurs suivant les genoux, comparaison sans HUD doublé, export de période complète.
- [x] 53. Tests du GLB réel (6 534 poses paramétrées + régressions ciblées), vérifications
  navigateur, captures actuelles, documentation et revue indépendante M4. Voir rétrospective.

Livraison : une PR liée à #17, sans fusion automatique ; statut de revue et CI suivi sur GitHub.

## Sortie garçon #21 et spécification éditeur #22

- [x] 54. Issues avant le code, clarification et séquence approuvées, specs poussées en premier.
- [x] 55. Plan couplé sortieG seul, variante, appuis explicites et lecture finie avec poses/rejeu.
- [x] 56. Tests GLB/triangles, 576 poses historiques F/GF, contrôle navigateur et export, capture.
- [x] 57. Spécification de l'éditeur de figures (aucune implémentation d'éditeur dans cette phase).
- [x] 58. Revue M4, résultats et limites documentés ; livraison en PR unique, sans fusion.

## Correction oracle #25

- [x] 59. Issue de coordination puis spec poussée avant le code ; note de sortie fille préservée.
- [x] 60. Gardes NaN/Infinity sur valeurs, attentes, tolérances, sol et quaternions ; tests négatifs.
- [x] 61. Oracle indépendant, poses/cibles et local/monde séparés, bornes inclusives et reverse explicite.
- [x] 62. Limites réelles du GLB, références mondiales Kizomba et cinq mutations détectées.
- [x] 63. Suite complète, build et revue M4 ; livraison en PR unique, aucun changement du rendu.

## Méta — suivi récurrent

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
- [x] M5. Recoupement oracle ↔ poses finales GLB (#19) : `scripts/test_oracle_final.mjs` (429 assertions PASS, dans `npm test`) + oracle étendu (sorties, `rootX`) ; leçons dans `docs/spec-phase18-oracle.md` §7 ; coordination issues #21/#22
- [ ] M4. **Méta-tâche récurrente** : à la fin de chaque phase, relire
  `docs/retrospective-*.md`, ajouter une nouvelle rétrospective (auto-critique + session
  indépendante), évaluer les tâches à (r)ajouter ici, puis **re-ajouter cette ligne M4** —
  répéter jusqu'à satisfaction objective (rigueur maximale)

## Sortie fille en paire (#27)

- [x] Spécification et séquence en cinq actions ([spec](spec-sortie-fille.md)).
- [x] Trajectoires, cadre guidé, variantes, transport, partage et export.
- [x] Validation sur le GLB et protection des traces sortie garçon/combiné.
- [x] Revue M4, contrôle navigateur des deux variantes et captures ([rétrospective](retrospective-sortie-fille.md)).

## Fin en quinconce, marche naturelle, contact des pieds D, plexus (#48 #49 #50 #51)

- [x] Spécification ([spec](spec-marche-naturelle.md)).
- [x] Fin de figure en position neutre (sorties garçon et fille), bassins recouplés (#48).
- [x] Cycle de marche des pas de figure (`src/gait.ts`), sorties et quarts de tour en paire (#49).
- [x] Sortie garçon : pieds D bord à bord au temps 2, G1 moins latéral (#50).
- [x] Option plexus contre plexus, avec ou sans contraposition, et mesure de l'indicateur (#51).
- [x] Sortie fille : D1 du crochet raccourci (45 cm) et ouverture plus courte (45 cm), écart plexus 17,5 → 15,4 cm (#51).
- [x] Ida e volta : marche et contact plexus (#51, #54, voir ci-dessous).
- [x] Sortie garçon : progression du couple réduite (70 %), pas de 17 à 33 cm hors croisé (#56, [spec](spec-pas-courts.md)).
- [ ] Passage du suiveur pendant le croisé (D3 54 cm) et sortie fille avec des pas d'une longueur de pied (#56, décision du propriétaire).
- [ ] Captures GIF mises à jour et validation à l'œil par le propriétaire.

## Ida e volta en paire (#54)

- [x] Spécification ([spec](spec-ida-paire.md)), issue #54, PR draft #55 (empilée sur #52, fusionnée depuis).
- [x] Échantillonneur opt-in `src/idaPaire.ts` (`idaPaire`), câblé dans `pose.ts`, `Rig.tsx`, `App.tsx`.
- [x] Tests GLB `scripts/test_ida_paire.mjs` + ida dans `scripts/test_plexus.mjs`, dans `npm test`.
- [x] GIF `docs/gifs/ida-paire-couple.gif` et README.
- [ ] Validation à l'œil par le propriétaire (points de décision de la spec).
- [ ] Ginga (#42) à partir de cette base.

## Son synthétisé synchronisé (#44)

- [x] Spécification poussée en premier ([spec](spec-son-synthese.md)).
- [x] Grilles des six styles en données sourcées et planificateur pur (`src/music/`).
- [x] Synthèse Web Audio, horloge audio maîtresse, bouton « Son », choix A/B, URL.
- [x] `scripts/test_music.mjs` et `son-synthese.feature` dans `npm test` ; contrôle navigateur.
- [ ] Écoute de validation par le propriétaire (grilles, équilibre, tempos) et décisions ouvertes.

## Mode jeu : file de commandes, écoute par défaut, danse automatique (#140)

- [x] Spécification poussée en premier ([spec](spec-jeu-file-auto.md)), issue #140, PR #141.
- [x] Planificateur `src/guidage.ts` : file de commandes, bascules écoute / danse automatique, tirage par graine.
- [x] Vue `src/components/GuidageApp.tsx` : le couple danse dès l'ouverture, file affichée, Espace bascule, bouton Pause.
- [x] `scripts/test_guidage.mjs` réécrit : file, jonctions, danse automatique, phrase, rejeu, GLB.
- [x] `docs/features/mode-jeu.feature` : sept scénarios dans `npm test`.
- [x] GIFs du mode jeu recapturés avec les muscles.
- [ ] Essai par le propriétaire : poids du tirage (`GUIDE_AUTO`), part des fins de phrase en position neutre.

## Ida e volta à tout pas qui avance ou recule (#144, R27)

- [x] Issue #144 avec les mots du propriétaire ; règle R27 dans `docs/regles-proprietaire.md`.
- [x] Spec poussée en premier ([spec](spec-ida-partout.md)) : relevé des pas, modèle proposé, questions.
- [x] Réponses du propriétaire (durée, poids, pas concernés, virgula, commande) ; question 4 (suiveur de côté) reposée.
- [x] Échantillonneur généralisé (`sampleTouched`, `TOUCH_POSITIONS`), segments du mode jeu avec allers-retours.
- [x] `scripts/test_touches.mjs` (GLB par position), `scripts/test_guidage.mjs`, `docs/features/mode-jeu.feature`.
- [x] Danse automatique : choix à chaque pas possible ; virgula ; démonstration `demo=allerretour` et GIF.
- [ ] Réponses du propriétaire sur les pieds de la suiveuse (issue #86 : même pied ou pied opposé ; suiveuse qui allait de côté).
- [ ] Essai par le propriétaire des poids du tirage et de la commande (figure en attente).
- [ ] D4 de la sortie garçon (jambes croisées) : aller-retour dans la direction du pas, à étudier.

## Musique enregistrée générée par ElevenLabs (#142)

- [x] Issue #142 et spécification poussée en premier ([spec](spec-musique-elevenlabs.md)), PR brouillon #143.
- [x] Lecteur de boucle synchronisé (`src/music/loop.ts`, `loopOutput.ts`), repli sur la synthèse, interface.
- [x] Script de génération et analyse de tempo (`scripts/generer_musique.mjs`, `scripts/tempo.mjs`).
- [x] `scripts/test_musique_enregistree.mjs` et `musique-enregistree.feature` dans `npm test` ; contrôle navigateur.
- [x] Kizomba, prise 1 (prompt du propriétaire) : générée, mesurée, **refusée à l'écoute** (« techno »), retirée.
- [x] Signature rythmique dans l'analyse ; variantes A, B, C en plans de composition ; mode `--essais`.
- [x] Extraits d'essai de la kizomba (variantes A, B, C, 15 s chacun) générés avec l'accord du propriétaire.
- [x] Variante C retenue à l'oreille par le propriétaire.
- [x] Prise complète de la variante C, première demande : fichier silencieux (échec de génération) ; garde-fou et plan en sections de 32 temps.
- [x] Prise complète de la variante C redemandée en sections de 32 temps : générée, mesurée (101,996 bpm, boucle de 96 temps), contrôlée dans le navigateur.
- [x] Écoute de validation par le propriétaire : « Oui, elle convient » (21 novembre 2026).
- [ ] Autres styles (semba, kompa, tarraxinha, suave, zouk brésilien) : même méthode, PR à part, accord du propriétaire pour les crédits.

## Vitrine : danse automatique en musique, lien direct (#150)

- [x] Issue #150 et spécification poussée en premier ([spec](spec-vitrine-danse-auto.md)).
- [x] `src/vitrine.ts`, lien `vitrine=1`, tempo de la piste en danse automatique, muscles et buste.
- [x] Bouton de partage, interface réduite, fragment `iframe`.
- [x] `scripts/test_vitrine.mjs` et `vitrine.feature` dans `npm test` ; contrôle navigateur.
- [ ] Essai par le propriétaire ; intégration sur le site d'Arcodange ; mascottes Rémi et Corinne (hors périmètre de #150).

## Danse automatique : un hasard mieux tenu (#152)

- [x] Issue #152 avec les mots du propriétaire ; complément de spec poussé en premier ([spec](spec-jeu-file-auto.md)).
- [x] Tirage avec mémoire des figures et des paires (`GUIDE_VARIETY`, `GUIDE_MEMORY`), trois réglages.
- [x] Mesures avant et après dans `scripts/test_guidage.mjs` ; scénario Gherkin.
- [ ] Choix du réglage par le propriétaire (`hasard=libre|tenu|strict` sur la même graine).

## Transfert de poids continu : ni saccade, ni relais soudain (#167)

- [x] Issue #167 avec la règle (22 novembre) et les mesures ; [spec](spec-transfert-continu.md)
      poussée en premier ; règle R34.
- [x] Étape 1 : `scripts/test_saccades.mjs` dans `npm test`, état d'aujourd'hui enregistré (`scripts/fixtures/saccades.json`).
- [ ] Étape 2 : hauteur du bassin étalée dans le temps (sorties : 12,9 et 10,5 cm en un huitième de temps).
- [x] Étape 3, marche (avancer, reculer, double) : le bassin voyage pendant tout le pas (7,5 → 2,7 cm en un huitième de temps).
- [x] Étape 3, ida e volta et allers-retours insérés : le bassin sort sur tout le pas et revient en une demi-temps (8 → 3,5 à 4,2 cm).
- [ ] Étape 3, suite : quart de tour, sorties.
- [x] Étape 4 : passage latéral du ginga calibré aussi progressif qu'un balancier (2,05 → 0,98), poursuivi d'une figure à la
      suivante (`gingaFrom`), sauf après le pas de base et l'ida e volta.

## Ginga du couple plus visible (#163)

- [x] Issue #163 avec la parole du propriétaire (« Trop discret. ») ; spec poussée en premier (section de `spec-ginga-couple.md`), PR #164.
- [x] Réglage par défaut `ample` (contrôlé au pas du réglage par défaut).
- [x] Sorties : plafond levé là où la figure laisse de la place (`gingaCapRoom`), mesuré sans plafond sur le GLB.
- [x] Trois croisements d'os de #157 corrigés (sortie garçon 0,19 et 3,31 ; sortie fille 0,94), trouvés au seizième de temps ;
      le test échantillonne le réglage par défaut au seizième dans les sorties et le quart de tour.
- [ ] Une taille au-delà d'`ample` : avec le « 8 » (#159).

## Ginga visible en danse de couple (#157)

- [x] Issue #157 avec les mots du propriétaire ; spec poussée en premier ([spec](spec-ginga-couple.md)), PR #158.
- [x] Phase du ginga sur les transferts d'appui dans toutes les figures, balancement, petit rebond (`src/pose.ts`).
- [x] Marges déclarées par les figures (`gingaRoom`, `gingaCap`) ; réglages `GUIDE_GINGA`.
- [x] `scripts/test_ginga_couple.mjs` et `ginga-couple.feature` dans `npm test` ; allers-retours et séances contrôlés avec le ginga.
- [x] GIFs des réglages, [page d'élection](elections/ginga-couple.md) ; démonstration `demo=ginga`.
- [ ] Le chemin en « 8 » du bassin, lié au relais des genoux, lisible vu de dessus et vu de face (précisions du
      propriétaire) : #159. La taille (`ginga=sans|discret|marque|ample`) s'y choisira avec la forme.

## Le ginga « fait un 8 » (#159)

- [x] Issue #159 avec les mots du propriétaire ; [spec](spec-ginga-huit.md) poussée en premier.
- [x] Mesure du chemin des hanches dans les trois vues (`scripts/tracer_hanches.mjs`) : aujourd'hui une ligne vue de dessus.
- [x] Prototypes `huit`, `huitRond`, `huitInverse`, `huitAmple` (`GUIDE_EIGHT`), phase poursuivie d'une figure à la suivante.
- [x] [Élection](elections/ginga-huit.md) : danse et tracé de chaque variante ; `scripts/test_ginga_huit.mjs`.
- [x] Paroles du 22 novembre consignées (R30 à R32) : « Trop discret. » → variante F à l'élection et #163 ; kompa → #161 ;
      semba → #162.
- [x] Kompa (#161, « c'est le 8 le plus prononcé ») : prototypes `KOMPA_EIGHTS` du danseur seul (`?style=kompa&kompa=huit`),
      question 4 de l'élection ; la recherche de sources est sur la branche de la vidéo.
- [x] Branche à jour de `main` après #163 (défaut `ample`, sorties moins plafonnées) : GIF de danse repris, croisements
      d'os recomptés au seizième de temps (13, 11, 8, 27, 37 de B à F ; aucun dans la marche ni la sortie garçon).
- [x] Paroles du 22 novembre (suite) consignées (R33 à R35) : posture → #166 ; ni saccade ni relais soudain → mesure
      `soudain` de chaque variante (2,0 aujourd'hui en couple, 1,0 pour les « 8 » arrondis) et #167 ; semba → #162.
- [x] Vote du second tour (22 novembre) : sens D, taille F ; forme et kompa à reprendre par les genoux.
- [x] Troisième tour : les genoux mènent le « 8 » (`GingaEight.knees`, kompa `genoux*`), mesures de fluidité au tracé.
- [ ] Vote du troisième tour (Q8 couple, Q9 kompa).
- [ ] Variante élue : contrôles sur le GLB dans toutes les figures (marges), ida e volta, pas de base.

## Élections de variantes en GIF (#148)

- [x] Issue #148 et spécification poussée en premier ([spec](spec-elections-variantes.md)).
- [x] Prototypes derrière `?essai=` (`src/essais.ts`) : ida même pied (#86), ligne dans l'axe des bustes (#72), marche déroulée (#73) ; `temoin` pour filmer l'actuel hors du mode paire.
- [x] Mesures des candidats sur le vrai GLB (`scripts/mesure_essai_ida.mjs`, `scripts/mesure_essai_marche.mjs`).
- [x] GIFs des candidats, avec les muscles ([premier tour](elections/2026-11-21/README.md)).
- [x] Page d'élection publiée (source : `docs/elections/2026-11-21/election.html`), lien donné au propriétaire.
- [x] Votes du propriétaire (21 novembre) : Q1 A, pied opposé (#86/#144) ; Q2 B, ligne dans l'axe des bustes (#72) ; Q3 B, marche déroulée (#73).
- [x] Votes consignés dans les issues (choix, commentaire reformulé sans citation) et dans la spec.
- [ ] Variantes élues implémentées dans une PR empilée sur #149, interrupteurs retirés.
- [ ] Second tour : #56 (croisé de la sortie garçon, géométrie du couple à régler pour chaque piste) et #67 (distance bassin-bassin, même figure à filmer à plusieurs distances).
