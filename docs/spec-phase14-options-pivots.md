# Spec Phase 14 — options de déplacement exclusives (radio) + vrais pivots de quart de tour

Demandes 2026-11-18 :
1. « Les déplacements (corridinho, quart de tour, 3 temps etc.) doivent être des **options non
   combinables** (options et non checkbox). »
2. « Les pivots pour le quart de tour ne sont pas bons. Pour un quart de tour sur la gauche (sens
   anti-horaire) le danseur amène le **talon de son pied gauche au niveau du bout de son pied
   droit en angle droit** (pied gauche orienté vers la gauche), puis ramène son **pied droit
   parallèle à son pied gauche en position initiale** en terminant le quart de tour.
   **L'orientation du haut du corps suit l'orientation du pied gauche et le bas du corps celle
   du pied droit.** »

## §1 Options de déplacement mutuellement exclusives

- `src/styles.ts` (purs) : `MovementKey = "none" | "corridinho" | "quarts" | "temps3" | "ida"` ;
  `movementOf({corridinho, quarts, temps3, ida})` (priorité corridinho > quarts > temps3 > ida) ;
  `movementFlags(m)` → exactement un flag à true (`none` → tous false).
- `src/App.tsx` : `movement = movementOf(...)` dérivé des 4 états ; `setMovement(m)` applique
  `movementFlags` (exclusivité). Parsing URL : si plusieurs params `corridinho=`/`quarts=`/
  `temps3=`/`ida=` sont présents, un seul est retenu via `movementOf` (les autres remis à 0).
- `src/components/Controls.tsx` : les 4 checkbox isolées deviennent un **groupe radio**
  « Déplacement (options exclusives) » : Aucun / Corridinho / Quarts de tour / Marka « 3 temps » /
  Ida e volta. Props : `movement` + `onMovement` (les props individuelles corridinho/quarts/temps3/
  ida disparaissent des Controls ; le Rig garde ses props booléennes, alimentées par les états
  exclusifs).
- Gherkin `docs/features/options-deplacement.feature` : `movementOf` priorité, `movementFlags`
  exclusivité (exactement un flag), aller-retour flags→movement.

## §2 Quarts de tour avec vrais pivots (vírgula pas à pas)

`quartTurnStep(b, reverse=false)` pur dans `src/styles.ts`. Constantes : `QH = 0.084` (demi
inter-hanches, pieds sous les hanches), `QF = 0.09` (pieds légèrement en avant), `QTOE = 0.11`
(talon G au bout du D), `QD = 0.17` (écart pieds parallèles). Cycle 16 temps = 4 quarts × 4 temps,
2 demi-pas de 2 temps par quart ; quart de tour à gauche = anti-horaire = yaw +π/2 :

- **demi-pas 0 (pied G)** : cible pied G = position courante pied D + R(th0)·(0, QTOE), yaw
  th0+π/2 (pied G orienté vers la gauche, à 90°) ; `upperYaw` rampe th0 → th1 (haut du corps suit
  le pied G) ; `lowerYaw` = th0 (bas du corps attend) ;
- **demi-pas 1 (pied D)** : cible pied D = position courante pied G + R(th1)·(−QD, 0), yaw th1
  (pied D ramené parallèle au pied G) ; `lowerYaw` rampe th0 → th1 (bas du corps suit le pied D) ;
  `upperYaw` = th1.
- Positions des pieds simulées quarter par quarter depuis l'état initial (pieds en (±QH, QF)) :
  les pieds tracent un petit carré autour de l'origine et **retrouvent leur position initiale
  après 4 quarts (2π)**.
- `reverse` (suiveur en paire, marche arrière) : z miroir, yaws opposés (comme `reversePath`).
- Retour : `{ q, half, stepSide: "L"|"R", upperYaw, lowerYaw, footL: {x,z,yaw}, footR: {x,z,yaw} }`.

`Rig.tsx` :
- `const qs = quarts ? quartTurnStep(b, reverse) : null` ; après `lockUpperTrunk` :
  `root.rotation.y += qs.lowerYaw` et `chest/head.rotation.y += qs.upperYaw − qs.lowerYaw`
  (**dissociation** : haut du corps = lacet pied G, bas du corps = lacet pied D) ;
- IK : quand `qs`, `stepIdx = floor(b/2)`, `stepLen = 2`, `swingSide = qs.stepSide`, cible absolue
  `(qs.foot[side].x, ankleOuterY, qs.foot[side].z)`, `lift = 0.04` ; le lacet du pied est ramené
  vers `qs.foot[side].yaw` via `virgulaFootYawDelta` (interpolé pendant le demi-pas) ; hors quarts
  (corridinho), le lacet du pied suit toujours le lacet du corps (comportement phase 11).
- `quartsPath` conservé tel quel (enveloppe lisse, tests existants) ; le rig utilise
  `qs.lowerYaw` pour le root.

Gherkin `docs/features/quarts-pivots.feature` :
- sur 16 temps `lowerYaw` croît de 0 à ~2π (tour complet), `stepSide` alterne L, R, L, R… ;
- pendant le demi-pas 0, `upperYaw − lowerYaw` atteint ~π/4 (dissociation) puis retombe à 0 en
  fin de quart ; pendant le demi-pas 1, `upperYaw` déjà = th1 ;
- pied G : yaw = th0+π/2 pendant le demi-pas 0 ; après 4 quarts, pieds revenus aux positions
  initiales (à 1e-9) ; `reverse` : yaws opposés, z miroir.

## §3 Captures + docs

- Re-générer `quarts-de-tour.gif` et `virgula-quarts.gif` (pivots visibles, cam=top pour la vírgula).
- README : option radio « Déplacement (exclusif) » ; spec/TASKS/CONTEXT/CONVENTIONS à jour.

## Hors scope

Corridinho inchangé (hors demande) ; pas de nouveau style ; conventions verrouillées intactes.

## Validation

- `npm test` (nouveaux features + 43 existants) vert — **et désormais garanti en CI** (job `test`,
  phase 13) ; `npm run build` vert.
- Sonde numérique sur `quarts=1` : |lacet pied − cible| < 1e-3 pendant tout le cycle ;
  `upperYaw − lowerYaw` pic à ~π/2 au milieu du demi-pas 0 ; retour positions initiales à 2π.
- Relecture visuelle des GIFs regénérés.
