# Spec Phase 11 — vírgula (pied en angle sur les quarts de tour) + URL angle/zoom de vue

Demandes 2026-11-18 :
1. « L'avant-bras gauche du cadre est vers le haut. » → vérifier/garder `DANCE_FRAME.forearmLeft`
   (avant-bras G vers le haut, paume vers la droite) + test Gherkin de non-régression.
2. « Le pied doit faire un angle sur quart de tours. Renseigne-toi sur la « virgula ». » →
   recherche `docs/virgula.md` (verbatim FR/ES/PT/EN/DE) ; sur `quarts=1` (et les pivots du
   `corridinho=1`) le **lacet monde du pied suit le lacet du corps** (pivot sur la boule du
   pied, contact sol constant).
3. « Dans l'URL je veux passer l'information de l'angle et du zoom de vue » → nouveaux params
   **`angle=`** (azimut en degrés autour de la cible : 0 = depuis +Z, 90 = depuis +X = E/ligne
   de danse) et **`zoom=`** (distance caméra→cible en mètres), en plus de `campos=`/`camtgt=`
   (qui restent prioritaires et exacts). Le bouton « 🔗 Partager la vue » écrit `angle` + `zoom`
   (calculés depuis l'OrbitControls) dans l'URL.

## §1 Vírgula — pied en angle sur les quarts de tour

- Fonction pure `src/styles.ts` :
  `virgulaFootYawDelta(footWorldYaw, bodyWorldYaw): number` — correction de lacet local à
  ajouter à `foot.rotation.y` pour que le lacet monde du pied rejoigne celui du corps
  (modulo 2π, wrap dans ]-π, π]).
- `src/components/Rig.tsx` : quand `quarts || corridinho`, après la pose (branche IK et
  branche non-IK), `root.updateWorldMatrix(true, true)` puis pour chaque pied
  `foot.rotation.y += virgulaFootYawDelta(yawMonde(foot), yawMonde(root))`.
  Hors de ces mouvements : aucun changement (lacet du pied inchangé).
- Gherkin `docs/features/virgula-cadre.feature` :
  - `virgulaFootYawDelta(foot=0.3, corps=1.2) ≈ 0.9` ;
  - wrap : `foot=3.1, corps=-3.1` → delta ≈ 2π − 6.2 ;
  - après correction, `foot + delta ≡ corps (mod 2π)` pour un balayage de valeurs ;
  - cadre : `DANCE_FRAME.forearmLeft.y ≈ π/2` (avant-bras G **vers le haut**), `z ≈ π` (paume
    vers la droite) ; `forearmRight.x ≈ π`, `z ≈ -π/2` (avant-bras D vers la gauche, paume vers
    le buste).
- Capture : `virgula-quarts.gif` (`quarts=1&cam=top&boussole=1&repere=1&ligne=1&solid=1`,
  preset caméra `top` ajouté dans `src/cameras.ts`) + entrée `virgula` dans `DemoOverlay.tsx`.

## §2 Cadre — avant-bras gauche vers le haut (non-régression)

`DANCE_FRAME.forearmLeft = { x: 0, y: π/2, z: π }` existe depuis la phase 7 (vérifié visuellement
cam=front). La phase 11 ajoute juste le test Gherkin ci-dessus pour verrouiller.

## §3 URL — angle et zoom de vue

- `src/cameras.ts` (purs, testables) :
  - `viewAnglesOf(pos, tgt) → { az, el, dist }` (degrés, mètres ; az = atan2(dx, dz), 0 = +Z,
    90 = +X) ;
  - `posFromView(tgt, azDeg, elDeg, dist) → [x,y,z]` (inverse) ;
  - `resolveView(preset, angleDeg?, zoom?)` : sans override → preset inchangé ; `angle=` →
    remplace l'azimut (normalisé 0–360) ; `zoom=` → remplace la distance (clamp 0.5–20 m) ;
    l'élévation du preset est conservée.
- `src/share.ts` : `buildShareUrl(base, state, camPos, camTgt, view?)` ajoute `angle=` (1
  décimale) et `zoom=` (2 décimales) si `view` fourni.
- `src/App.tsx` : parse `angle`/`zoom` → `cam = resolveView(resolveCam(cam, isPair), angle, zoom)` ;
  priorité au chargement : `campos`/`camtgt` > `angle`/`zoom` > preset `cam`. `onShare` calcule
  `view = viewAnglesOf(camPos, camTgt)` depuis l'OrbitControls et le passe à `buildShareUrl`.
- Gherkin `docs/features/vue-angle-zoom.feature` : preset inchangé sans override ; `angle=90`
  garde dist ; `zoom=2` garde az ; roundtrip `posFromView(viewAnglesOf(pos)) ≈ pos` ;
  URL de partage contient `angle`/`zoom` cohérents avec `campos`/`camtgt`.
- Docs : README (params `angle`/`zoom` + GIF vírgula + `<details>` source), `.vibe/CONVENTIONS.md`
  (liste des params), CONTEXT.md, TASKS.md (tâches 36–38).

## Hors scope

Pas de nouveau style, pas de mocap, pas de changement de hiérarchie GLB. Le suiveur en paire
continue de faire les quarts de tour en marche arrière (`reverse`).

## Validation

- `npm test` (Gherkin + unit) vert ; `npm run build` vert.
- Capture `virgula-quarts.gif` rejouée, vérifiée visuellement (le pied tourne avec le corps,
  la boussole reste fixe) ; `quarts-de-tour.gif` inchangé ou rejoué si impact visuel.
- Partage : clic « 🔗 Partager la vue » → URL contient `campos/camtgt/angle/zoom` ; rechargement
  avec `?cam=fixed&angle=90&zoom=2` → caméra à az=90°, dist=2 m autour de la cible du preset.
