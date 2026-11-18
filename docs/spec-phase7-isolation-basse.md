# Spec Phase 7 — Isolation du bas du corps : buste au-dessus du bassin STABLE

Date : 2026-11-18. Recherche source : `docs/ginga-angolana.md` (citations verbatim FR/EN/PT).

## §1 Objectif (demande utilisateur 2026-11-18)

« L'objectif premier du projet est de **discerner les isolations du bas du corps : ce qui est au
-dessus du bassin doit être stable et ne pas balancer**. »

Fondement sourcé (voir `docs/ginga-angolana.md` §2) : dans la ginga angolaise (kizomba/semba),
« the movements hips down are the dominant ones [...], not the upper body movements » (Eddy Vents,
via saidadance.com) ; « The non-dominant upper body movements [...] only facilitate, help the
dominant movements below the hips » ; « Keep the shoulder line level and do not pitch or sway the
entire body » (SOS Dance Footwork Manual) ; « the upper body remains stable and calm in the
connection » pendant que « only your pelvis moves » (udansa) ; « The upper body must remain
straight, while the hips remain mobile » + « dissociate the upper body, which remains stable, from
the lower body » (SalsaNueva FR).

## §2 Mode « Isolation basse » (`iso=1`) — **AMENDÉ 2026-11-18 : activé PAR DÉFAUT**

- Paramètre `iso=1` (case « Isolation basse (buste verrouillé) » + `iso=` URL, persisté
  localStorage). **Valeur par défaut : true** (« normalement on devrait voir le haut du tronc
  stable et constamment vertical » — demande utilisateur 2026-11-18).
- Implémentation (`lockUpperTrunk` dans `styles.ts`, appelée après `STYLES[key].apply` et les
  blocs sortie/corridinho) : la colonne (`spine`) **contre-rotate le roll/pitch du pelvis**
  (thorax vertical en monde) ; `chest` et `head` perdent leur bascule latérale (y/z → 0).
  Le **pitch (x) est conservé** : posture, cambré du zouk et vague du suave passent par la
  chaîne sagittale (spine/lumbar/thoracic) et restent visibles — seules les bascules
  latérales (le « balancement ») sont supprimées.
- **Toujours actif** : genoux légèrement fléchis en permanence (« ce sont les genoux qui
  fléchissent »), pieds plantés (`plant=1`), clamp sol inchangé.
- `iso=0` = ancien buste libre.

## §2b Cadre de bras de danseur (`cadre=1`, défaut true)

- `applyDanceFrame` (`DANCE_FRAME` dans `styles.ts`) : coudes pliés, bras vers l'avant ;
  avant-bras **gauche vers le haut, paume vers la droite** ; avant-bras **droit vers la gauche,
  paume vers le buste** (vérifié visuellement en `cam=front`).
- `cadre=0` = bras le long du corps (reset ±0,12 rad).

## §3 Métrique de « stabilité du buste » (testable pure)

- Fonction pure dans `styles.ts` (ou `cameras.ts`-style module dédié) :
  `upperStability(chestDisp, pelvisDisp)` = `1 - clamp(chestDisp / max(pelvisDisp, eps), 0, 1)`,
  où `chestDisp` = amplitude (RMS ou max-min) du déplacement monde x/z du nœud `chest` **relatif
  au pelvis**, `pelvisDisp` = amplitude du déplacement monde x/z du `pelvis`.
- HUD : « stabilité buste XX % » à côté des jauges G/D et du HUD appuis.
- **Gherkin** `docs/features/isolation-basse.feature` :
  - `iso=1` → déplacement relatif thorax/pelvis < 5 % de l'amplitude du pelvis pendant que le
    pelvis oscille (amplitude > seuil) ;
  - `iso=0` → le thorax peut suivre (pas de contrainte) ;
  - genoux restent fléchis (knee flexion > 0) en sur place ;
  - clamp sol toujours respecté.

## §4 Ginga « 8 au sol » (passada)

- Wikipédia FR Kizomba : ginga = mouvement de hanche « **en décrivant un 8 au sol** » (passada).
- Le tracé d'orbite du bassin existe déjà ; en mode `iso=1` + kizomba, le mettre en évidence
  (couleur dédiée) pour lire le « 8 au sol ».

## §5 Captures / README

- Nouveau GIF `docs/gifs/isolation-ginga.gif` : `bare=1&demo=iso-ginga&cam=hip&mode=solo&style=kizomba&bpm=90&travel=0&iso=1&appui=1&solid=1`
  (ajout d'une entrée `iso-ginga` dans `DEMOS` de `DemoOverlay.tsx`).
- README : galerie + param `iso=` + option d'interface + objectif du projet en tête de README.

## §6 Tâches (ajoutées à `docs/TASKS.md`, phase 7 : tâches 19–24)

19. `iso=1` + case + param + verrouillage haut du corps dans `Rig.tsx` (après `apply`, écraser
    rotations spine/lumbar/thoracic/chest/head/bras) ; 20. métrique `upperStability` pure + HUD ;
21. Gherkin `isolation-basse.feature` dé-wippé dans `npm test` ; 22. GIF `isolation-ginga.gif` +
    démo overlay ; 23. README (objectif + galerie + params) ; 24. vérifs + livraison PR +
    ff-merge + CI + site live.

## §7 Hors scope (ne pas casser)

- Conventions verrouillées inchangées (hiérarchie GLB, métriques, clamp sol, pieds plats,
  plant=1 par défaut, attribution BodyParts3D CC BY-SA 2.1 Japan).
- `iso=0` reproduit l'ancien comportement (buste libre). Les styles suave/zouk gardent leur
  vague/cambré même en iso=1 (pitch conservé) — validé par les scénarios `styles-sur-place`.
