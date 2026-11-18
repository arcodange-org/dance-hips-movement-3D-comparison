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

## Phase 6 — PLANIFIÉE — spec : `docs/spec-phase6-comparatif-appuis-corridinho.md` — branche prévue `vibe/phase6-comparatif-appuis-corridinho-ae8a7a`

- [ ] 10. Mode « comparatif d'appuis » : mode Comparaison + `appui=1` → refs de stats par rig
  (`statsARef`/`statsBRef`) + **jauge G/D par corps** (couleur du style) + HUD par style ;
  GIF `comparatif-appuis.gif` (kizomba vs kompa, `cam=wide`) relu visuellement
- [ ] 11. Corridinho au repère fixe, **uniquement après pivot droit (1/4 tour) puis pivot
  gauche** : case + `corridinho=`, séquence 16 temps (pivot D 0–3, pivot G 4–7, cercle 8–15,
  rayon ~0,25–0,35 m autour de l'origine, épaules vers l'intérieur) ; test trajectoire
  (cercle après pivots, rayon borné, pas de NaN) + GIF `corridinho.gif` (`cam=fixed|wide`) relu
- [ ] 12. Vérifs phase 6 : `npm test`, build, smoke headless, livraison PR + ff-merge + CI + site

## Méta — boucle de feedback (rétrospective auto-critique + critique de session indépendante)

Réf : `docs/retrospective-phase3-5.md` (pièges, raccourcis à tort, process amélioré).

- [ ] M0. Rétrospective phases 3–5 rédigée (pièges 1–15, raccourcis, process) — fait le 2026-11-18
- [ ] M1. `scripts/check_sources.mjs` : link-check (HTTP 200) de toutes les URLs de
  `docs/styles-de-danse.md` + README, exécuté en CI ou via `npm test`
- [ ] M2. Self-check des captures dans `capture_gifs.mjs` : GIF non vide, 0 erreur console,
  ≥1 frame extraite et relue visuellement par capture
- [ ] M3. Chargement paresseux du GLB muscles uniquement si `muscles=1` (perf réseau)
- [ ] M4. **Méta-tâche récurrente** : à la fin de chaque phase, relire
  `docs/retrospective-*.md`, ajouter une nouvelle rétrospective (auto-critique + session
  indépendante), évaluer les tâches à (r)ajouter ici, puis **re-ajouter cette ligne M4** —
  répéter jusqu'à satisfaction objective (rigueur maximale)
