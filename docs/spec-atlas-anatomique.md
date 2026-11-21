# Spec — Atlas anatomique ouvert (PRD) · issue #132

[Accueil](../README.md) · [ADR 005](adr/005-atlas-donnees-ouvertes.md) · [Dossier atlas](atlas/README.md) · [Manifeste](atlas/manifest.json) · [Recherche biomécanique](recherche-biomecanique/README.md) · [Contrat oracle](spec-phase18-oracle.md)

## Demande (fondateur, 2026-11-21, verbatim)

> Est-ce qu'on peut nous mêmes produire un équivalent de anatobase.com à partir de données
> publics (s'inspirer de leur format et essayer de le reproduire nous mêmes à partir des
> squelettes 3D et des connaissances ouvertes pour produire de la documentation intermédiaire
> du format anatobase pour en suite consolider notre application aux corps dansant) ?

anatobase.com (AnatoBase) = **Motion Library** (séquences multi-angles de mouvements
articulaires, 326 sets / 5 341 photos) + **Anatomy Library** (muscle par muscle, origines /
insertions, fonctions, vidéos). Licence « reference-only » : aucune capture, aucune publication,
aucun usage IA — **rien d'AnatoBase n'entrera dans ce dépôt public**. On reproduit le *format*
avec nos propres données ouvertes.

## Contexte — ce qui existe déjà

- Squelette réel **BodyParts3D v4.0 © DBCLS CC BY-SA 2.1 Japan** : `public/anatomy.glb`
  (nœuds `Skeleton, Pelvis, HipPivot_R/L, KneePivot_R/L, AnklePivot_R/L, …`, métriques réelles
  `anatomy_meta.json`) + couche musculaire `public/anatomy_muscles.glb` greffée dans
  `src/muscles.ts`.
- Moteur de pose paramétrique `src/pose.ts` (testé sur le GLB réel, `scripts/test_poses.mjs`),
  IK 2 segments `src/ik.ts`, presets caméra `src/cameras.ts`, captures Playwright → GIF
  (`scripts/capture_gifs.mjs`, `scripts/capture_figure_gif.mjs`).
- Recherche biomécanique documentée : `docs/recherche-biomecanique/` (amplitudes marche,
  bassin/dissociation, genou/hanche, rachis FR).
- Oracle versionné : `src/oracle.ts` + `docs/spec-phase18-oracle.md` + niveaux de preuve
  (documenté / faible / proposition) déjà utilisés pour les pistes son (`docs/spec-son-synthese.md`).
- Prototype hors dépôt : `~/Work/Danse/anatomie-3d/` (Blender + **Z-Anatomy CC BY-SA 4.0**,
  fiches quadriceps/ischios/fessiers/mollets/pectoraux/dos/abdos/epaules/bras, rendus
  PNG/GIF/MP4) — à industrialiser dans ce dépôt.

## Objectif

Produire un **atlas anatomique ouvert et versionné** dans ce dépôt, qui sert de documentation
intermédiaire entre la biomécanique (recherche) et le comparateur 3D (styles de danse) :

1. **Planches « mouvements »** (équivalent Motion Library) : pour chaque mouvement articulaire
   du manifeste, une séquence d'images du squelette réel animé par `pose.ts`, rendue sous 5
   angles (face, trois-quarts, profil, trois-quarts dos, dos), avec ROM mesurée sur le GLB.
2. **Fiches « muscles »** (équivalent Anatomy Library) : un dossier par groupe musculaire avec
   nom TA, origine, insertion, action, innervation (textes Gray 1918 / Wikidata) et rendu 3D
   isolé (Z-Anatomy ou `anatomy_muscles.glb`).

L'atlas alimente ensuite l'oracle et les specs de styles : le roulis du bassin du kizomba vs
zouk se calibre contre la planche `bassin-obliquite`, avec niveau de preuve.

## Non-objectifs

- Pas de mocap (ADR 001) : pas de CMU/AMASS (licences académiques), pas de photos de modèles.
- Pas de copie d'AnatoBase (marque, images, vidéos,proces « prof qui valide » revendiqué).
- Pas de couverture des figures de danse elles-mêmes (l'atlas = anatomie articulaire, pas la
  chorégraphie ; les figures restent sourcées dans `docs/styles-de-danse.md`,
  `docs/ginga-angolana.md`).
- Pas de validation médicale : l'atlas est illustratif, « généré paramétriquement sur squelette
  réel » — dit tel quel dans chaque planche.

## Décisions

- **D1 — Deux familles de planches** : `docs/atlas/mouvements/<id>/` (5 vues × frames PNG + GIF
  + `meta.json`) et `docs/atlas/muscles/<id>/` (fiche `.md` + rendu PNG). Assets servis dans
  `public/atlas/`. Schéma d'URL futur : `?atlas=<id>&vue=<face|…>&frame=<n>`.
- **D2 — Manifeste comme source de vérité** : `docs/atlas/manifest.json` liste les mouvements
  (id, labels FR/EN, articulation = nœud GLB ou articulation buste JSX, axe local, ROM en degrés,
  côté, priorité 1..3, niveau de preuve). Validé par `scripts/test_atlas_manifest.mjs` dans
  `npm test` : articulations résolues contre les **nœuds réels du GLB** (chunk JSON parsé) et
  contre le `RigHandle` du buste, ROM bornées (|angle| ≤ 180°, amplitude ≤ 180°).
- **D3 — Génération paramétrique** : les planches mouvements sont produites par
  `scripts/capture_atlas.mjs` (à construire, extension de `capture_gifs.mjs`) qui pose le rig
  via `src/pose.ts` à des frames régulièrement espacées dans la ROM, pour chaque vue de
  `src/cameras.ts`. Déterministe, rejouable, testable.
- **D4 — Sources ouvertes et licences** (ADR 005) : BodyParts3D CC BY-SA 2.1 Japan (attribution
  maintenue), Z-Anatomy CC BY-SA 4.0 (fiches muscle), Gray's Anatomy 1918 (domaine public) +
  Wikidata (CC0) pour les textes, assets générés en CC BY-SA 4.0. OpenStax A&P 2e évité (images
  NC-SA).
- **D5 — Niveaux de preuve** : chaque planche porte son niveau (documenté / faible /
  proposition) ; les ROM du manifeste commencent en « proposition » et passent « documenté »
  quand `docs/recherche-biomecanique/` les source.
- **D6 — Intégration oracle** : à terme, `src/oracle.ts` peut comparer une pose de style à la
  planche atlas la plus proche (même articulation, même ROM) — chantier ultérieur, hors PRD.

## Spécification du manifeste (v1)

Voir `docs/atlas/manifest.json`. Champs par mouvement : `id` (kebab-case, unique), `label`,
`labelEn`, `rig` (`glb` | `buste`), `articulation` (nœud GLB ou joint buste), `axeLocal`
(x|y|z), `romDeg` [min, max] (min < max, |·| ≤ 180), `cote` (R | L | les deux), `priorite`
(1 = bassin/hanche/genou, cœur du comparateur), `preuve`, `notes`.

Premier lot (2026-11-21) : 16 mouvements — bassin (obliquité, rotation, antéversion),
hanche (flexion, extension, abduction, adduction, rotations médiale/latérale), genou (flexion),
cheville (dorsiflexion, flexion plantaire), tronc (rotation, flexion latérale, flexion/extension,
respiration).

## Pipeline de génération

1. `scripts/capture_atlas.mjs --mouvement <id> [--vues …]` : charge `public/anatomy.glb`, pose
   le rig via le moteur `pose.ts` (pose neutre + balayage de la ROM en N frames), rend chaque
   frame sous chaque vue (`src/cameras.ts`), écrit PNG/GIF + `meta.json` (ROM mesurée en
   degrés sur les quaternions monde du nœud, frames, camera) dans `docs/atlas/mouvements/<id>/`
   et copie les assets servis dans `public/atlas/mouvements/<id>/`.
2. Fiches muscle : industrialiser le prototype Blender `~/Work/Danse/anatomie-3d/scripts/fiche.py`
   (Z-Anatomy) en `scripts/fiche_muscle.py`, sortie `docs/atlas/muscles/<id>/`.
3. Viewer : page statique `?atlas=…` lisant le manifeste + les planches (chantier ultérieur).

## Chaîne de génération des planches « mouvements » (preuve sur `bassin-obliquite`)

Contribution du 2026-11-21 : la chaîne complète est construite et prouvée sur **un** mouvement
(`bassin-obliquite`, priorité 1). Les quinze autres suivront par la même chaîne (voir Tâches).

### D7 — Pose neutre anatomique par le moteur

- `applyPose` reçoit une option `neutral` (défaut `false`, comportement inchangé) : aucun mouvement
  de style, aucune posture de danse (`lean = 0`, `knee = 0`). Tout le reste du moteur est celui de
  l'application : bornes, isolation du haut du tronc (`iso=1`), IK des jambes, pieds à plat,
  hauteur du bassin donnée par la portée des jambes.
- Sans cette option, la « pose de départ » la plus neutre atteignable est un style à amplitude
  nulle, qui garde sa posture de danse (mesuré sur le GLB, kizomba à `amp=0` : genoux à 30,6°,
  thorax incliné de 5,7°). Ce n'est pas une position anatomique de référence.
- Mouvements du bassin (`articulation: "Pelvis"`) : chaîne fermée, **pieds plantés**. L'angle
  est appliqué au bassin par `pelvisOffset.rotation` autour de l'axe du manifeste. Les jambes
  suivent par IK : la hanche qui descend fait fléchir son genou. Le haut du tronc compense
  (`iso=1`), comme dans le comparateur.
- Bras : cadre de danse par défaut (`cadre=1`), déterministe, et qui dégage le bassin de profil.
- Les autres articulations (hanche, genou, cheville en chaîne ouverte ; buste) demandent leur
  propre règle de pose. Tant qu'elle n'existe pas, `applyAtlasPose` et le script **refusent** le
  mouvement avec un message explicite, au lieu de produire une planche fausse.

### D8 — Module pur `src/atlas.ts`

- `atlasAngles(mouvement, frames)` : angles régulièrement espacés de `romDeg[0]` à `romDeg[1]`
  (N impair recommandé pour passer par 0 quand la ROM est symétrique ; défaut 9).
- `applyAtlasPose(r, model, mouvement, angleDeg)` : pose le rig par `applyPose` (D7).
- `measureAtlasPose(r, model, mouvement, reference)` : mesures sur le rig posé (voir D11).
- Lecture typée du manifeste (`docs/atlas/manifest.json`), source de vérité unique pour le
  script, le test et la vue.

### D9 — Cinq vues

`ATLAS_VIEWS` dans `src/cameras.ts` : azimuts autour de la cible du preset `hip` (bassin et
jambes), élévation et distance du preset conservées (`resolveView`).

| Vue | Azimut | Lecture |
| --- | --- | --- |
| `face` | 0° | caméra devant le sujet (+z) |
| `troisQuarts` | 45° | trois-quarts avant |
| `profil` | 90° | profil |
| `troisQuartsDos` | 135° | trois-quarts arrière |
| `dos` | 180° | caméra derrière le sujet |

Pour un mouvement d'un seul côté (`cote: "R"`), les azimuts sont inversés : la caméra passe du
côté du membre qui bouge (le côté droit du sujet est en x < 0).

### D10 — Vue de capture `?atlas=`

- `?atlas=<id>&vue=<vue>&frame=<n>&frames=<N>&muscles=0|1` ouvre une vue dédiée
  (`src/components/AtlasApp.tsx`, morceau séparé comme le mode guidage) : un seul rig, posé par
  `applyAtlasPose`, caméra de la vue, légende rendue par la page (libellé, vue, angle,
  attribution) dans deux bandes hors du rendu 3D, car ffmpeg-static n'a pas `drawtext`.
  Sans `frame`, la vue montre la frame du milieu (la pose neutre d'une ROM symétrique).
- L'URL est l'interface : le script change de frame et de vue par `history.replaceState` +
  `popstate`, sans recharger la page (le GLB n'est chargé qu'une fois par mouvement).
- Signal de rendu : `document.documentElement.dataset.atlasRendu = "<id>|<vue>|<frame>/<frames>"`
  une fois la pose appliquée **et** une image complète rendue avec cet état. Le script attend ce
  signal avant chaque capture (aucune attente fixe).
- Cette vue est le socle du futur viewer (tâche « Viewer `?atlas=` ») ; elle n'a pour l'instant
  ni navigation ni contrôle de caméra.

### D11 — Fichiers produits et `meta.json`

`npm run build && node scripts/capture_atlas.mjs --mouvement <id> [--frames 9] [--vues face,profil]
[--sans-muscles] [--meta-seul]` écrit dans `docs/atlas/mouvements/<id>/` :

- `<vue>-<nn>.png` : une image par vue et par frame, 400 × 500 px, couleurs indexées ;
- `<vue>.gif` : aller-retour de la ROM par vue, extrêmes tenus ;
- `planche.png` : planche composite, une ligne par vue, une colonne par frame, avec en-têtes,
  mesures, provenance et licences (mise en page HTML rendue par le navigateur) ;
- `meta.json` : mesures et provenance ;
- `README.md` : page de la planche, entièrement dérivée de `meta.json`.

Chaque image porte sa légende (libellé, vue, angle) et l'attribution BodyParts3D dans deux bandes
hors du rendu 3D : une image qui circule seule reste attribuée. La couche musculaire est affichée
par défaut (préférence du propriétaire pour les captures) ; `--sans-muscles` donne le squelette seul.

Le script sert lui-même `dist/` sur un port libre (jamais le serveur d'une autre session), échoue
sur toute erreur de console ou ressource en échec, et n'utilise aucune attente fixe (signal D10).

Assets servis, copiés à l'identique dans `public/atlas/mouvements/<id>/` : `meta.json` et
`planche.png`. Les images par frame et les GIF restent dans `docs/` : le viewer rendra la 3D en
direct, et aucun consommateur n'a besoin des GIF sur le site. Les y ajouter est une ligne
(`fichiers.servis`) le jour où une page en a l'usage.

Poids mesuré pour `bassin-obliquite` (9 frames × 5 vues) : 2,4 Mo dans `docs/` (45 images de 21 à
34 Ko, 5 GIF de 140 à 200 Ko, planche 230 Ko), 0,24 Mo dans `public/`. Les 16 mouvements du
manifeste pèseraient environ 42 Mo au même réglage.

`meta.json` est **déterministe** (ni date ni machine) et calculé hors navigateur, sur le GLB réel,
par le même moteur que l'application (`scripts/atlas_meta.mjs`) :

- provenance : « généré paramétriquement sur squelette réel », ni mocap, ni photos de modèles,
  ni relecture par un professeur d'anatomie ; niveau de preuve repris du manifeste ; licences ;
- articulation, axe local, axe monde mesuré, convention de signe ;
- `romDeg` du manifeste et ROM **mesurée** : angle signé du quaternion monde du nœud GLB, relatif
  à la frame neutre (angle 0), autour de l'axe monde mesuré ;
- par frame : angle commandé, angle mesuré, écart de hauteur des centres de hanche, flexion des
  genoux, inclinaison du thorax, hauteur du bassin, sommet osseux le plus bas ;
- vues (azimut, position et cible de la caméra), fichiers, paramètres de capture.

### Résultat sur `bassin-obliquite`

[Planche et mesures](atlas/mouvements/bassin-obliquite/README.md). Sur le squelette réel, de −10°
à +10° : ROM mesurée sur le nœud `Pelvis` égale à la ROM commandée ; écart de hauteur des centres
de hanche de −28,4 à +30,1 mm (0,9 mm à la pose neutre, asymétrie du squelette) ; le genou du côté
qui descend fléchit jusqu'à 31° pendant que l'autre reste à 6,9° ; le bassin descend de 14,5 mm ;
le thorax reste vertical. Ces valeurs décrivent le modèle, pas une personne.

### D12 — Test `scripts/test_atlas_planches.mjs` (dans `npm test`, sans navigateur)

Pour chaque planche présente dans `docs/atlas/mouvements/` :

1. la ROM mesurée sur le quaternion monde du nœud égale la ROM du manifeste (≤ 0,01°) ;
2. preuve indépendante de l'orientation, par les **positions** : pour l'obliquité, une hanche
   monte et l'autre descend, de `distance inter-hanches × sin(angle)` ; l'axe monde mesuré est
   antéro-postérieur. Un axe erroné dans le manifeste fait échouer ce contrôle ;
3. conventions verrouillées après pose : sommets osseux au-dessus du sol, chevilles sur leurs
   cibles, longueurs des segments constantes, thorax vertical (`iso=1`) ;
4. `meta.json` versionné = `meta.json` recalculé (tolérances 0,05° et 0,5 mm) : une planche
   périmée par un changement du moteur ou du manifeste est signalée, avec la commande à relancer ;
5. fichiers listés présents et aucun autre, signatures PNG/GIF et dimensions cohérentes, copies
   `public/` identiques, `README.md` à jour, attribution DBCLS et mention de provenance présentes ;
6. les mouvements sans règle de pose sont refusés explicitement et n'ont pas de planche.

### Correction du manifeste (axes du bassin)

Vérifié sur le GLB par le moteur : le sujet regarde +z, son côté droit est en x < 0. L'obliquité
(plan frontal) est donc une rotation autour de **z** (c'est `pelvis.rotation.z`, le `roll` du
HUD) et l'antéversion (plan sagittal) une rotation autour de **x**. Le manifeste v1 les avait
inversées ; il est corrigé, et le contrôle 2 du test l'empêche de revenir.

## Tâches

Voir `docs/TASKS.md`, section « Atlas anatomique ouvert (#132) ».

## Vérification

- `npm test` inclut `scripts/test_atlas_manifest.mjs` (manifeste valide, articulations résolues
  contre le GLB réel, ROM bornées, priorités 1 sur bassin/hanche).
- `npm test` inclut `scripts/test_atlas_planches.mjs` (D12) : planches mesurées sur le GLB, à jour et intègres.
- `npm run build` : la vue `?atlas=` est un morceau séparé ; l'application n'est pas modifiée hors de l'option `neutral` du moteur (défaut inchangé) et de la propriété `atlas` du rig.
- CI `test` du workflow Pages : `npm ci && npm test && npm run build`.

## Limites

- Buste = buste JSX stylisé au-dessus du sacrum (pas un maillage GLB) : les planches « tronc »
  montrent le buste stylisé, dit dans `meta.json`.
- ROM du manifeste = indicatifs en « proposition » tant que non sourcés dans
  `docs/recherche-biomecanique/`.
- L'atlas ne certifie aucune technique de danse (même avertissement que l'oracle).
