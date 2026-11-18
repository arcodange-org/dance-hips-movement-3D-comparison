# ADR 003 — Repère fixe pour les déplacements, visualisation des appuis/transmission, GIF muscles sur place en vedette, méthode anti-amnésie

Date : 2026-11-17. Statut : accepté. Spec : `docs/spec-phase5-repere-fixe-appui.md`.
Conventions verrouillées inchangées (voir `CONTEXT.md` et ADR 001/002).

## Contexte

1. Les sorties garçon/fille (et toute animation avec déplacement) étaient difficiles à lire :
   le repère restait centré, le déplacement relatif n'apparaissait pas.
2. La version « sur place + couche musculaire » (issue des itérations de vérification croisées)
   doit être **mise en avant** en GIF sur le README.
3. Priorité pédagogique : sur place, **transmission de l'appui depuis le sol**, transfert de
   poids G/D, effet sur genoux et hanches.
4. Revue critique des sources : 2 corrections (tempo semba, « avant-pied » = spec).

## Décisions

### 1. Repère fixe (déplacements lisibles)

- `src/components/OriginMarker.tsx` : anneau + croix fixes à l'origine monde (0,0,0), rendus
  dans tous les modes ; case « Repère fixe » (défaut ON, persistée, param `repere=`).
- Captures (mode `bare`) : `enablePan=false`, cible caméra verrouillée ; presets `?cam=fixed`
  ([0,1.25,4.0] → [0,0.88,0]) et `?cam=wide` ([0,1.35,4.6], cadrage paire élargi pour les
  ±0,22 m de sortie). `?cam=hip` inchangé pour les gros plans sur place.
- GIF `sortie-garcon-fille` refait en `cam=wide` avec repère visible : chaque danseur sort
  latéralement **depuis le repère fixe** ; le retard du suiveur décale la « sortie fille ».

### 2. Appuis & transmission (sur place)

- `support(b)` par style ∈ [-1,1] = charge sur le pied **droit** (`src/styles.ts`, repli déduit
  de `root.position.x` via `supportOf`) ; testé borné dans `npm test`. Convention : côté droit du
  rig à x < 0, donc `root.x > 0` = appui qui passe à gauche → `support = -S2(b)` etc.
- Pastilles de charge sous chaque pied (position monde des chevilles, taille/opacité ∝ charge).
- Chaîne d'appui du côté chargé : emissive (couleur du style) sur `Femur/Tibia/Fibula/Patella/
  Foot/HipBone_<R|L>` **et** sur les muscles du même côté si `muscles=1` ; seuil de déclenchement
  à 50 % de charge.
- HUD (bare + normal, quand `appui=1`) : appui D/G %, flexion genoux D/G (°), roll bassin (°),
  lus dans le rig à chaque frame via un ref partagé.
- Case « Appuis & transmission » (persistée, `appui=`, activée par défaut en mode Observation).
- Sources : angolatravelguide § Semba basics (verbatim « step in place », « side-to-side hip
  motion », « bounce come from the knees », « quick-quick-slow … 1-2-3, pause »), Wikipédia FR
  Kizomba (« du bas vers le haut »), odanceevents « Débuter la kizomba » (pas compacts près du
  sol, genoux souples), viends-danser/udansa (périmètre samba : pieds→genoux→hanches) —
  voir `docs/styles-de-danse.md`.

### 3. README — GIF vedette sur place + muscles

- `docs/gifs/kizomba-muscles-sur-place.gif` (bare, `cam=hip`, `travel=0`, `muscles=1`,
  `appui=1`, overlay `demo=kizomba-muscles` avec attribution CC BY-SA 2.1 Japan © DBCLS) placé
  **en tête du README, pleine largeur**.
- Note « Vérification » : itérations de vérification croisées par sous-sessions indépendantes
  (tests numériques `npm test`, parsing des GLB, captures headless, re-vérification des sources).

### 4. Corrections sourcing

- Tempo semba : « mid-tempo/bouncy », kizomba 60–80 BPM, kuduro 130–145 BPM (angolatravelguide) —
  le « ≈130 bpm » précédent était celui du kuduro, supprimé.
- « Réception sur l'avant-pied » requalifié comme issu de la spec biomécanique (handoff).

### 5. Méthode anti-amnésie (cross-session)

- `CONTEXT.md` (racine) : état, liens (site/PR/CI), méthode, procédure de reprise, conventions.
- `docs/TASKS.md` : miroir persistant de la todo-list, mis à jour à chaque commit (checkpoint).
- Branche `vibe/phaseN-<slug>-ae8a7a` + **PR draft ouverte tôt** et poussée souvent : l'état vit
  sur GitHub, pas dans la session. Commits petits et fréquents.
- Assets lourds (/tmp) re-téléchargeables via les procédures documentées — jamais de l'état.

## Conséquences

- `npm test` couvre désormais `support` (borné [-1,1]) en plus des courbes, du clamp, de
  l'amplitude Déplacement et de `sortieEnvelope`.
- Le repère fixe est visible par défaut ; les captures avec déplacement utilisent `cam=fixed|wide`.
- Pas de changement de hiérarchie GLB, de métriques, de clamp, ni de mocap (paramétrique f(temps)).
