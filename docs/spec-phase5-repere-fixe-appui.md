# Spec Phase 5 — repère fixe, appuis/transmission, GIF muscles sur place en vedette

Date : 2026-11-17. Branche : `vibe/phase5-repere-fixe-appui-ae8a7a`. Tâches : `docs/TASKS.md`.

## Demandes (source : discussion utilisateur)

1. **README** : mettre en avant en GIF la version **sur place + couche musculaire** — la version
   issue des itérations de vérification croisées (sous-sessions indépendantes, ~20 itérations).
2. **Sorties garçon/fille et toute animation avec déplacement** : cesser de garder un repère
   centré en permanence → le déplacement doit se lire **relatif à un repère fixe** au sol.
3. Priorité pédagogique : **sur place**, **transmission de l'appui des pieds depuis le sol**,
   **transfert de poids gauche/droite**, **effet sur genoux et hanches**.
4. Hygiène sourcing (cf. revue précédente) : corriger 2 points faibles de `docs/styles-de-danse.md`
   (tempo semba « ≈130 bpm » non sourcé — 130–145 BPM c'est le kuduro ; « réception
   avant-pied » = spec du handoff, pas une source externe) et citer verbatim la source du
   « quick-quick-slow » semba.

## Conventions verrouillées (inchangées)

Hiérarchie de pivots GLB, métriques réelles, clamp `root.position.y >= 0`, pieds plats,
modes, persistance localStorage, animation paramétrique f(temps) sans mocap, attribution
**CC BY-SA 2.1 Japan © DBCLS** visible. Voir `CONTEXT.md`.

## A. Repère fixe (déplacements lisibles)

- **Marqueur d'origine permanent** au sol : anneau + croix à (0,0,0), visible dans tous les
  modes, case « Repère fixe » (défaut ON, persistée, param `repere=`). Composant
  `src/components/OriginMarker.tsx`.
- **Captures (mode bare)** : `enablePan=false`, cible caméra verrouillée ; nouveau preset
  `?cam=fixed` (position [0, 1.25, 4.0], cible [0, 0.88, 0]) ; cadrage paire élargi
  ([0, 1.35, 4.6]) pour voir les ±0,22 m de la sortie. `?cam=hip` inchangé (gros plans sur place).
- GIF **sortie garçon/fille** refait avec `cam=fixed` + repère visible : le guideur et le
  suiveur sortent chacun latéralement depuis le repère fixe, le retard du suiveur décale la
  « sortie fille ». Toute capture avec `travel>0` utilise aussi `cam=fixed`.

## B. Appuis & transmission (sur place, G/D, genoux/hanches)

- `support(b)` par style ∈ [-1,1] (charge sur le pied **droit**, +1 = plein appui droit),
  fallback depuis `root.position.x`. Borné, testé dans `npm test`.
- **Pastilles de charge** sous chaque pied (taille/opacité ∝ charge), repositionnées à chaque
  frame sur la position monde des chevilles.
- **Chaîne d'appui** du côté chargé (pied → cheville → genou → hanche) : emissive renforcée
  sur `Foot_/Tibia_/Fibula_/Patella_/Femur_/HipBone_ <R|L>` + muscles du même côté si
  `muscles=1`.
- **HUD** (mode Observation hanche + case « Appuis & transmission ») : charge G/D en %,
  flexion du genou d'appui en degrés, roll du bassin en degrés — lus dans le rig à chaque frame.
- Case « Appuis & transmission » (persistée, param `appui=`, activée par défaut en mode
  Observation).
- Sources (avec périmètre) : [Angola Travel Guide, § « Semba dance steps: the basics »](https://angolatravelguide.com/angola-music-dance/)
  (« step in place », « side-to-side hip motion on beats 1 and 2 », « let the bounce come from
  the knees », « quick-quick-slow triple step … “1-2-3, pause” ») ; [Wikipédia FR, Kizomba](https://fr.wikipedia.org/wiki/Kizomba)
  (« le déplacement est du bas vers le haut ») ; [Viens-danser](https://www.viens-danser.fr/apprendre-samba/)
  et [Udansa](https://udansa.com/fr/guide-de-danse/apprendre-samba/samba-competition/apprendre-samba-bounce)
  (samba, fille du semba : pieds → genoux → hanches, poids par la plante des pieds).

## C. README — GIF vedette sur place + muscles

- Nouvelle capture **`kizomba-muscles-sur-place.gif`** (bare, `demo=kizomba-muscles`, `cam=hip`,
  `travel=0`, `muscles=1`, `appui=1`) placée **en tête du README, pleine largeur**, avant le
  tableau des 6 styles, avec légende et attribution CC BY-SA 2.1 Japan © DBCLS dans l'overlay.
- Note « Vérification » sous la galerie : itérations de vérification croisées (tests numériques
  `npm test`, parsing GLB, captures headless, re-vérification des sources) par sous-sessions
  indépendantes.
- Galerie : 6 styles sur place + GIF vedette muscles + sortie (repère fixe) + appui/transmission
  (10 → 9 GIFs : `couche-musculaire.gif` remplacé par le GIF vedette).

## D. Docs & ADR

- `docs/styles-de-danse.md` : tempo semba corrigé (« mid-tempo/bouncy, plus rapide que la
  kizomba 60–80 BPM ; kuduro 130–145 BPM » — angolatravelguide) ; « avant-pied » requalifié
  « spec » ; citation verbatim du quick-quick-slow + section « Appui & transmission » avec sources.
- **ADR 003** (`docs/adr/003-repere-fixe-appui-transmission.md`).
- README : GIF vedette, note vérification, galerie, params d'URL (`repere=`, `appui=`, `cam=fixed`),
  structure (OriginMarker.tsx).

## Tâches (ordre) — miroir dans docs/TASKS.md

1. Spec + méthode anti-amnésie (`CONTEXT.md`, `docs/TASKS.md`) + branche + PR draft poussée tôt.
2. Repère fixe : `OriginMarker.tsx` + case + `repere=` + `cam=fixed` + pan off en bare.
3. `support(b)` dans `styles.ts` + bornes dans `npm test`.
4. Appui : pastilles de charge + chaîne emissive + HUD (charge/genou/roll) + case `appui=`.
5. Corrections `styles-de-danse.md` + ADR 003.
6. `capture_gifs.mjs` : GIF vedette muscles sur place, sortie repère fixe, appui ; régénérer.
7. README : vedette + vérification + galerie + params.
8. Vérifs : `npm test`, build, smoke headless (muscles+appui, sortie cam=fixed), preview.
9. Livraison : commits, push, PR ready, ff-merge `main`, CI Pages success, vérif site live,
   mise à jour `CONTEXT.md`/`TASKS.md`.

## Hors scope

Pas de mocap, pas de nouveau style, pas de changement de hiérarchie GLB, pas de déplacement
du clamp sol, pas de re-téléchargement des assets BodyParts3D (déjà en `public/`).
