# ADR 001 — Rig paramétrique biodynamique (courbes f(temps), pas de mocap)

- **Statut** : accepté (Phase 3, 2026-11)
- **Contexte** : application web 3D comparant six styles de danse (kizomba, semba, kompa,
  tarraxinha, suave, zouk brésilien) pour l'apprentissage. Le mouvement doit être lisible,
  reproductible et paramétrable (tempo 24–140 bpm, amplitude, déplacement), sans capturer de
  mocap.

## Décision

1. **Animation paramétrique par courbes f(temps)** issues de la spec biomécanique chiffrée
   (voir `docs/styles-de-danse.md`), appliquées à chaque temps (beat `b = t * bpm/60`) sur
   les pivots du rig. Chaque style est une fonction `apply(rig, b, amplitude)` dans
   `src/styles.ts`. Pas de mocap : les courbes sont dérivées des descriptions biomécaniques
   (amplitudes en radians, niveaux en mètres).
2. **Squelette réel BodyParts3D** (© DBCLS, CC BY-SA 2.1 Japan) limité au bassin→pied, avec
   hiérarchie de pivots `Skeleton → Pelvis → HipPivot_R/L → Femur → KneePivot → Tibia/Fibula/
   Patella → AnklePivot → Foot`, et **métriques réelles** (`anatomy_meta.json`) : hauteur de
   hanche 0,8835 m, inter-hanches 0,168 m, hanche→genou 0,440 m, genou→cheville 0,389 m.
3. **Clamp sol** : `root.position.y >= 0` — le « niveau bas » vient uniquement de la flexion
   de genou, jamais d'un plateau sous le sol.
4. **Pieds plats** : compensation de cheville `foot.rotation.x = -(hip.rotation.x +
   knee.rotation.x) + extra` (plus `foot.rotation.z = -hip.rotation.z` en IK).
5. **IK de pas** (`src/ik.ts`) quand le curseur Déplacement > 0 : IK deux segments
   (hanche 3 DDL, genou charnière) avec raffinement CCD, les pieds alternent les appuis au
   lieu de glisser. À Déplacement = 0, la pose d'origine (pieds glissés) est conservée.
6. **Buste stylisé semi-transparent** au-dessus du sacrum, avec segments lombaires/thoraciques
   pour la vague du suave (L5→dorsales→tête) et le cambré du zouk.
7. **Stack** : Vite + React 19 + @react-three/fiber 9 + drei 10 + three 0.187 + TypeScript,
   déployé en statique sur GitHub Pages.

## Conséquences

- **Positif** : le mouvement de chaque style est entièrement piloté par des paramètres
  explicables (rad / m / bpm), reproductible à l'identique, et les métriques réelles rendent
  les amplitudes comparables entre styles (ex. ±17 cm = une largeur de hanche à Déplacement
  100 %). Le rendu est déterministe — capturable en GIF/vidéo de façon fiable (Playwright).
- **Négatif** : ce n'est pas de la capture de mouvement ; les transitions et le poids du
  corps sont stylisés. L'IK de pas est un modèle latéral simplifié (pas de foulée avant).
- **Licence** : les maillages BodyParts3D imposent **CC BY-SA 2.1 Japan © DBCLS** —
  attribution visible dans l'app et le README, partage à l'identique ; incompatible produit
  fermé.

## Notes de pipeline (pièges connus)

- En-tête GLB : ordre **spec** `magic, version, length` (le GLB du handoff était stocké
  `magic, length, version` et refusé par GLTFLoader ≥ r150 ; corrigé à la migration).
- Le GLB embarque la compensation de quantification (`KHR_mesh_quantization` : positions
  int16 normalisées + node scale/translation) — ne pas réimporter/réexporter sans vérifier
  ces échelles.
- Repère BodyParts3D = LPS ; bake appliqué : `(x, -z, y) × 0,001`, origine au centre du
  bassin, os droits à x négatif.
- Régénération plus fine : `scripts/rebuild_anatomy.py` (FJ IDs du README) + Draco via
  gltf-transform (vérifié : sous-ensemble 17 os → 635 Ko → 82 Ko Draco).

## Références

- `docs/styles-de-danse.md` (spec par style)
- `anatomy_meta.json` (métriques réelles)
- https://dbarchive.biosciencedbc.jp/en/bodyparts3d/license.html
- https://github.com/Z-Anatomy/Models-of-human-anatomy
