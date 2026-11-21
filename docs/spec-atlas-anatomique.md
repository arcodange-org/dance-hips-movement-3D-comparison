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

Premier lot (2026-11-21) : 15 mouvements — bassin (obliquité, rotation, antéversion),
hanche (flexion, extension, abduction, adduction, rotations médiale/latérale), genou (flexion),
cheville (dorsiflexion, flexion plantaire), tronc (rotation, flexion latérale, flexion/extension,
respiration).

## Pipeline de génération (à construire, prochaine contribution)

1. `scripts/capture_atlas.mjs --mouvement <id> [--vues …]` : charge `public/anatomy.glb`, pose
   le rig via le moteur `pose.ts` (pose neutre + balayage de la ROM en N frames), rend chaque
   frame sous chaque vue (`src/cameras.ts`), écrit PNG/GIF + `meta.json` (ROM mesurée en
   degrés sur les quaternions monde du nœud, frames, camera) dans `docs/atlas/mouvements/<id>/`
   et copie les assets servis dans `public/atlas/mouvements/<id>/`.
2. Fiches muscle : industrialiser le prototype Blender `~/Work/Danse/anatomie-3d/scripts/fiche.py`
   (Z-Anatomy) en `scripts/fiche_muscle.py`, sortie `docs/atlas/muscles/<id>/`.
3. Viewer : page statique `?atlas=…` lisant le manifeste + les planches (chantier ultérieur).

## Tâches

Voir `docs/TASKS.md`, section « Atlas anatomique ouvert (#132) ».

## Vérification

- `npm test` inclut `scripts/test_atlas_manifest.mjs` (manifeste valide, articulations résolues
  contre le GLB réel, ROM bornées, priorités 1 sur bassin/hanche).
- `npm run build` inchangé (aucun code app touché par le PRD).
- CI `test` du workflow Pages : `npm ci && npm test && npm run build`.

## Limites

- Buste = buste JSX stylisé au-dessus du sacrum (pas un maillage GLB) : les planches « tronc »
  montrent le buste stylisé, dit dans `meta.json`.
- ROM du manifeste = indicatifs en « proposition » tant que non sourcés dans
  `docs/recherche-biomecanique/`.
- L'atlas ne certifie aucune technique de danse (même avertissement que l'oracle).
