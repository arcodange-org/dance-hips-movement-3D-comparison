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

## Phase 6 — EN COURS (livraison en cours) — spec : `docs/spec-phase6-comparatif-appuis-corridinho.md` — branche `vibe/phase6-vues-plant-solid-ae8a7a`, PR #4 draft

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
- [ ] 12. Vérifs + livraison phase 6 : `npm test`, build, smoke headless, push, PR #4 ready,
  ff-merge main, CI Pages, vérif site live, checkpoint CONTEXT/TASKS sur main

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
