# Rétrospective phase 6 (itération 2026-11-18) — boucle de feedback M4

Auto-critique + critique de session indépendante de la phase 6 (comparatif d'appuis,
corridinho, vues caméra/solid, pieds plantés, ligne de danse, dissociation, Gherkin).

## Ce qui a bien marché

- **Specs affinées AVANT code** (tâche « affûte les specs en premier ») + **Gherkin en amont**
  (`docs/features/*.feature` + `scripts/test_features.mjs` dans `npm test`) : les fonctions
  pures (`plantBlend`, `sortieOffset`, `corridinhoPath`, `resolveCam`) ont été écrites pour
  être testables, et les scénarios décrivent le comportement attendu avant l'implémentation.
  Résultat : 19 PASS / 0 FAIL / 1 SKIP, et aucun retour arrière sur les conventions.
- **Vérification numérique de la sortie** : la relecture visuelle des frames GIF ne suffisait
  pas (frame extraite à un temps où l'enveloppe de sortie = 0) ; une sonde jetable
  (`window.__dbg` dans `useFrame`, retirée avant commit) a prouvé root.x 0→0,22 m au pic.
  Leçon : quand une frame contredit le code, mesurer dans la scène plutôt que re-regarder.

## Pièges rencontrés

1. **`THREE.Line` / `lineDashedMaterial` = 1 px** : après downscale 960→520 + palette 96
   couleurs + tramage bayer, la ligne de danse disparaissait totalement des GIFs
   (0 pixel rose mesuré dans les frames, alors qu'elle était visible en live à 54–285 px).
   **Correction** : rubans (`BoxGeometry` aplatis) → 117–458 px rose dans les GIFs.
   Leçon : tout élément fin destiné aux GIFs doit être testé APRÈS la chaîne de
   rééchantillonnage, pas seulement en live.
2. **Double pointillé** (LineSegments découpés à la main + `lineDashedMaterial` par-dessus) :
   rendu incohérent ; remplacé par un seul `THREE.Line` + `computeLineDistances`, puis par
   les rubans (piège 1).
3. **Frame GIF extraite au mauvais temps** : l'enveloppe de sortie vaut 0 aux temps 5–8 du
   cycle de 8 ; une frame isolée peut conclure à tort « la sortie ne marche pas ». Leçon :
   extraire ≥2 frames à des temps calculés à partir du bpm (pic d'enveloppe), ou mesurer.
4. **write_file et `git add` en parallèle** : course, un fichier a été oublié d'un commit
   (déjà noté en phase 3–5) — refaire : écriture puis add séquentiels.
5. **Hypothèse « le profil orthonormé suffit »** (héritée du handoff) : la sortie latérale est
   en profondeur en profil → invisible. Corrigé par `cam=diag` par défaut en paire + paire
   réorientée sur la ligne (face à face selon z).

## Raccourcis pris à tort / à ne pas reprendre

- Ne pas « vérifier visuellement » une seule frame GIF pour un mouvement périodique.
- Ne pas supposer qu'un rendu live 1 px survivra au pipeline GIF (palette + downscale).
- Ne pas laisser le debug (`window.__dbg`) dans le code commité — sonde jetable, retirée
  avant le commit (fait).

## Process amélioré (à garder)

- Spec §Gherkin → fonctions pures testées → implémentation → captures → **relecture des frames
  extraites à des temps calculés + mesure de pixels/sonde si doute** → docs (README/TASKS/
  CONTEXT) → petits commits → push → PR ready → ff-merge → CI → vérif site live →
  checkpoint CONTEXT/TASKS sur main.
- M4 reste ré-ajoutée : cette rétrospective est l'itération 2026-11-18 de la boucle.

## Tâches à (r)ajouter (évaluation M4)

- M1 link-checker des sources, M2 self-check des captures, M3 lazy-load du GLB muscles
  (déjà en backlog, toujours prioritaires).
- Backlog : affiner la dissociation bras/cadre pendant la sortie après relecture visuelle
  des GIFs ; scénario Gherkin « sortie perpendiculaire à la ligne » encore @wip (validation
  visuelle via GIF faite, à formaliser).
