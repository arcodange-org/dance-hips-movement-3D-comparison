# Spec Phase 9 — partage de la vue (URL + angle caméra), cadre suiveuse, README dépliable, boussole 8 directions

Date : 2026-11-18. Demandes utilisateur 2026-11-18.

## §1 Bouton « 🔗 Partager la vue » (URL param, inclut l'angle de la caméra)

- Bouton dans les contrôles : construit l'URL avec **tous les paramètres d'état** (mode, styles,
  bpm, travel, amp, playing, torso, muscles, sortie, repere, appui, plant, corridinho, ligne, iso,
  cadre, quarts, temps3, ida, dir, delay, ghost, boussole, cam, demo, bare, solid) **+ l'angle
  caméra** `campos=x,y,z` (position OrbitControls) et `camtgt=x,y,z` (cible).
- Copie dans le presse-papiers + `history.replaceState` (barre d'adresse à jour) + feedback
  « ✓ Lien copié ! » 2 s.
- À la charge, `campos=`/`camtgt=` priment sur le preset `cam=` (position caméra initiale +
  target OrbitControls). Fns pures testables dans `src/share.ts` : `parseVec3`, `formatVec3`,
  `buildShareUrl`. Gherkin : `docs/features/partage-url.feature`.

## §2 Cadre de la suiveuse en paire (non prioritaire, cohérence des danses à 2)

- `DANCE_FRAME_FOLLOWER` + `applyFollowerFrame` (styles.ts), appliqué quand `side === "follower"`
  en mode paire : **coude gauche levé à hauteur d'épaule** (avant-bras en contact avec le dos du
  guideur), **coude droit baissé**, main droite en contact avec la main gauche du guideur.
- Gherkin : `directions.feature` (coude G levé, coude D baissé, avant-bras D ramené).
- Vérifié visuellement en mode pair `cam=front` : cadres complémentaires, mains au centre.

## §3 Boussole 8 directions + déplacement / ligne de danse

- 4 directions cardinales + 4 « diago » (demande 2026-11-18) : le **buste/épaules font face à la
  direction**. Axes monde : **E = +x = ligne de danse**, W = -x, N = -z, S = +z (face caméra défaut).
- `src/directions.ts` : `DIR_LABELS`, `facingSector(ry)` (8 secteurs de 45°), `facingLabel`,
  `isDiagonal`, `relToLineOfDance(x, z)` (along = le long de la ligne, across = perpendiculaire).
- `CompassRose.tsx` : 8 rayons étiquetés au repère fixe (étiquettes DejaVu embarquée, pas de CDN),
  affiché si `boussole=1` (défaut) + repère visible.
- HUD : `direction {label} (diago)` + `pos/ repère : ligne ±x m, travers ±z m` (évalue le
  déplacement dans l'espace par rapport à la ligne de danse, référentiel du couple).
- Gherkin : `directions.feature` (ry=0→S, π/2→E, π/4→SE diago, -π/4→SW diago, π→N).

## §4 README dépliable + bascule de vue

- Sous chaque GIF de la galerie : `<details><summary>Détails & source</summary>` — brief court +
  source + crosslink vers `docs/styles-de-danse.md` / `docs/ginga-angolana.md` / specs de phase.
- Bascule segmentée **Vue : Squelette / + Muscles (tissus)** dans les contrôles (remplace la case
  « Couche musculaire » ; `muscles=` inchangé). Le détail « Appuis & transmission (sol → genoux →
  hanches) » reste visible dans les deux vues (la chaîne émissive inclut les maillages musculaires).

## §5 Livraison

Tests (`npm test`), build, captures, vérifs headless (boussole, pair, campos=), PR + ff-merge
main + CI + site live + checkpoint CONTEXT/TASKS.
