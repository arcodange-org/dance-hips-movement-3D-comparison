# ADR 002 — Mouvements sourcés (sur place, 2 temps, sorties), couche musculaire et GIFs motion design

Date : 2026-11-17. Statut : accepté. Voir ADR 001 pour le cadre général (rig paramétrique
f(temps), pas de mocap, conventions verrouillées inchangées).

## Contexte

Le premier rendu suivait la spec biomécanique seule ; les mouvements semblaient « pas les bons »
pour les danses concernées. Demande utilisateur : favoriser les **mouvements sur place**, le
**« 2 temps » latéral**, les **sorties garçon / fille** (kizomba/semba), ajouter une **couche
musculaire**, le tout **sourcé** et illustré par de courtes vidéos/GIFs avec motion design.

## Décisions

### 1. Courbes de styles réancrées sur des sources externes

`src/styles.ts` a été réécrit : chaque style implémente désormais la nuance documentée dans
`docs/styles-de-danse.md` (section « Nuances des pas de base »), avec sources URLs :

- **Kizomba** : « 2 temps » latéral sur place avec marqua (pieds joints à chaque temps), pas ≤
  largeur du bassin, « touch » sans poids (Wikipédia FR, cours-kizomba.com).
- **Kompa** : balancier latéral sur place, un transfert de poids par temps, hip check sur le
  temps 4 (haitianmusiczone.com).
- **Semba** : rebond marqué quick-quick-slow, réception avant-pied (odanceevents.com,
  angolatravelguide.com).
- **Tarraxinha** : sur place, isolations pelviennes (udansa.com).
- **Suave** : « 8 » au sol + talon levé → changement de pied + vague L5→tête
  (cours-kizomba.com, emoveretherapie.com).
- **Zouk** : basic sur place slow-quick-quick + cambré (getbailar.com, danceinnj.com,
  inaya-zouk.com).

Toutes les captures GIF sont volontairement à `travel=0` (sur place) pour mettre en avant ces
nuances ; le curseur Déplacement et l'IK de pas restent disponibles et inchangés.

### 2. Sorties garçon / fille (mode Face à face)

`sortieEnvelope(b)` dans `src/styles.ts` : cycle de 8 temps, sortie latérale sur les temps 0–3,
retour sur 3–5, lissage smoothstep — conforme à la « sortie garçon/fille (5 temps) » décrite par
Wikipédia FR. Appliquée dans `Rig.tsx` uniquement en mode paire (`sortie && embrace`) :
`root.position.x += 0.22 * sortieEnvelope(b) * amp` (axe latéral local, donc les deux
partenaires sortent chacun de leur côté, sans collision). Le retard du suiveur décale la
« sortie fille ». Case « Sorties garçon / fille » (mode paire uniquement), persistée, param
URL `sortie=`.

### 3. Couche musculaire réelle (BodyParts3D)

- `scripts/build_muscles.py` extrait ~28 groupes musculaires (fessiers, psoas, iliaque,
  piriforme, quadriceps, ischio-jambiers, sartorius, gracile, adducteurs, TFL, gastrocnémiens,
  soléaire, tibiaux, fibulaires, érecteurs du rachis, obliques, pectoraux, trapèzes, deltoïdes)
  depuis `isa_BP3D_4.0_obj_99.zip` via `isa_parts_list_e.txt` + `isa_element_parts.txt`
  (résolution FMA→FJ→OBJ par côté R/L/C ; **piège** : le côté gauche a souvent l'id `<FJ
  droit>M`, ex. FJ1418M — ne jamais faire `rstrip("M")` sur les ids).
- Bake identique à l'anatomie osseuse : LPS→Y-up `(x, z, -y) × 0,001`, origine au centre du
  bassin → `public/anatomy_muscles.glb`, compressé Draco (11,9 Mo → **1,12 Mo**), décodeur dans
  `public/draco/gltf/`.
- Greffe dans `Rig.tsx` : `useGLTF(MUSCLES_URL, DRACO_DECODER_PATH)`, chaque maillage
  `Muscle_<Label>_<R|L|C>` re-parenté vers son pivot osseux (`src/muscles.ts` :
  `muscleParent`, `parentOffsetSkel`) avec décalage de la position du parent en espace
  Skeleton ; matériau rouge semi-transparent. **Piège** : ne pas re-parenter pendant un
  `traverse` (mutation du tableau `children` en cours d'itération → crash) : collecter d'abord,
  puis attacher. Case « Couche musculaire » (tous modes), persistée, param URL `muscles=`.
- Attribution : même licence **CC BY-SA 2.1 Japan © DBCLS** que l'anatomie osseuse, rappelée
  dans l'app (case + pied de page) et le README.

### 4. GIFs « motion design » depuis le README

`scripts/capture_gifs.mjs` (Playwright headless + ffmpeg-static) enregistre l'app en mode
`bare=1` avec un habillage rendu **par la page elle-même** (`?demo=<clé>`,
`src/components/DemoOverlay.tsx` : pastille de style colorée, légende de la nuance, pastille de
temps clignotant au tempo) — ffmpeg ne fait que fps/scale/palette GIF. Zoom hanche via
`?cam=hip` (preset caméra, évite le recadrage qui couperait l'habillage).
8 GIFs dans `docs/gifs/` : 6 styles sur place + `sortie-garcon-fille` (mode paire) +
`couche-musculaire`.

Pièges environnement (headless sans root) :
- Chromium : `LD_LIBRARY_PATH=/tmp/debs/root/usr/lib/x86_64-linux-gnu` (libs extraites des
  .deb Debian) + `--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader`.
- **Aucune police système** dans le sandbox : `measureText` renvoie 0 et aucun texte n'est
  rendu. Fix : `FONTCONFIG_FILE=/tmp/fontconfig/fonts.conf` pointant sur un `<dir>` contenant
  DejaVu (extrait du paquet `fonts-dejavu-core`), PLUS une webfont embarquée dans l'app
  (`public/fonts/DejaVuSans*-latin.ttf`, sous-ensembles via fontTools, `src/index.css`) pour
  les vrais navigateurs. `ffmpeg-static` n'a pas `drawtext` (pas de freetype) → d'où
  l'habillage dans la page plutôt qu'en post-traitement vidéo.
- Vidéo parfois plus courte que prévu (page lente sous SwiftShader) : le script sonde la durée
  réelle avec ffmpeg avant `-ss`.

### 5. Police embarquée

Sous-ensembles latin de DejaVu Sans (licence Bitstream Vera permissive) dans `public/fonts/`
+ `@font-face` dans `src/index.css` : le texte de l'interface est identique partout, y compris
sans police système.

## Conséquences

- `npm test` (`scripts/test_styles.mjs`) vérifie numériquement : aucune valeur non finie sur
  16 001 pas × 6 styles, clamp `root.position.y >= 0`, amplitude Déplacement ±16,6 cm à
  travel=1, `sortieEnvelope` bornée dans [0,1] et périodique de 8.
- Tailles : `anatomy_muscles.glb` 1,12 Mo (Draco) servi uniquement quand la case est cochée
  (chargement paresseux via `useGLTF`, mais le fichier est téléchargé dès le chargement du
  rig — acceptable ; piste d'amélioration : `useGLTF.preload` conditionnel).
- Les conventions verrouillées (hiérarchie de pivots, métriques, clamp sol, pieds plats,
  modes, persistance) sont inchangées.
