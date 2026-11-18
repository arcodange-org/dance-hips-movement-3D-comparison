# CONVENTIONS.md — conventions verrouillées (ne pas casser) + référence URL

## Conventions verrouillées

- **Hiérarchie glTF** (`public/anatomy.glb`) : `Skeleton → Pelvis (HipBone_R/L, Sacrum) ;
  HipPivot_R/L → Femur → KneePivot → Tibia/Fibula/Patella → AnklePivot → Foot_R/L`. Le code anime
  `r.hipR/L, r.kneeR/L, r.footR/L` (= nœuds GLB `HipPivot_*` etc.) et `r.root` (Skeleton).
  Côté droit à **x < 0**. GLB en `KHR_mesh_quantization` uniquement (vertices int16 ±32767,
  `node.scale` = demi-extent, `node.translation` = centre dans l'espace du parent) — ne pas
  réimporter/réexporter sans vérifier les compensations (bug corrigé : `scripts/fix_knee_bone_offsets.py`).
- **Métriques réelles** (`anatomy_meta.json`) : hanche `HIP_Y = 0,8835 m`, inter-hanches 0,168 m,
  hanche→genou 0,440 m, genou→cheville 0,389 m, `HIP_WIDTH = 0,34 m`.
- **Sol (amendement audit #17, 18/11/2026)** : les sommets osseux restent au-dessus de y=0
  (tolérance numérique 0,1 mm), les chevilles atteignent leurs cibles (≤1 mm). `root.y` peut
  être négatif pour fléchir les genoux ; les longueurs des deux segments restent constantes.
- **Pieds plats** : quaternion monde cible compensant toute la chaîne des parents, semelle
  déterminée par les sommets réels du GLB. Ne pas additionner des angles Euler locaux.
- **Pieds plantés par défaut en sur place** (amendement 2026-11-18) : à `travel=0`, contact sol
  constant (petit pivot sur la plante/« semi-pointe » via `extra`, `plantBlend`) ; `plant=0` =
  ancien glissé.
- **Isolation basse par défaut** (objectif premier, 2026-11-18) : `iso=1` — au-dessus du bassin le
  haut du tronc compense le roulis du bassin (`lockUpperTrunk` : la colonne contre-rotate le pelvis ;
  pitch conservé pour vague suave / cambré zouk) ; HUD : inclinaison monde du thorax en degrés.
- **Cadre de bras de danseur par défaut** (`cadre=1`) : coudes pliés, bras vers l'avant,
  avant-bras gauche vers le haut (paume à droite), avant-bras droit vers la gauche (paume vers le
  buste) ; suiveuse en paire : `DANCE_FRAME_FOLLOWER`.
- **Déplacement** : 0 = sur place, 1 = ±17 cm le long de la ligne de danse (axe x) ; `dir=-1` =
  marche arrière. IK de pas quand `travel > 0` (ou `ida=1`).
- **Repères** : repère fixe à l'origine (`repere=`, anneau+croix), ligne de danse = axe x
  (`ligne=`, rubans roses), boussole 8 directions (`boussole=`, E=+x=ligne, N=-z, S=+z).
- **Modes** : Solo / Observation hanche (~32 bpm, buste masqué) / Comparaison / Face à face.
- **Animation paramétrique f(temps) uniquement** — pas de mocap.
- **Réglages persistés** dans `localStorage` (préfixe `danse-comparateur:`) ; les paramètres d'URL
  priment (utilisés par les captures).
- **Attribution obligatoire** : maillages `public/anatomy.glb` + `public/anatomy_muscles.glb` =
  **BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan** — visible dans l'app (pied de page) et le
  README. Police embarquée : sous-ensemble DejaVu (Bitstream Vera).

## Paramètres d'URL (captures + partage)

`?mode=solo|observe|compare|pair&style=kizomba&styleB=kompa&bpm=90&travel=0.6&amp=1&playing=1&ghost=none&contacts=1`
(pas de `delay` : le retard du suiveur a été supprimé en phase 15 — en pair le suiveur est le
miroir exact de styleA ; `styleB` n'est utilisé qu'en `mode=compare` ; `contacts=` affiche les
repères de proximité poitrine/bassin/genoux en paire. Posture par style : `posture:{lean,knee}` dans
`src/styles.ts`.)
+ `&torso=0&muscles=1&sortie=1&repere=0&appui=1&plant=0&corridinho=1&ligne=0&iso=0&cadre=0&quarts=1&temps3=1&ida=1&dir=-1&boussole=0&solid=1&bare=1`
+ `&demo=<clé>&cam=default|hip|fixed|wide|diag|front|back|top&campos=x,y,z&camtgt=x,y,z&angle=45&zoom=2.5`
(`campos/camtgt` = angle caméra exact, produit par le bouton « Partager la vue », prioritaire sur
`cam=` ; `angle=` = azimut ° autour de la cible (0=+Z, 90=+X=E), `zoom=` = distance m, appliqués
sur le preset `cam=` via `resolveView` — `viewAnglesOf`/`posFromView` dans `src/cameras.ts` ;
vírgula : `virgulaFootYawDelta` dans `src/styles.ts` fait suivre le lacet du pied au lacet du corps
sur `quarts`/`corridinho`.)

## Tests

`npm test` = `test_styles.mjs` + `test_features.mjs` + `test_oracle.mjs` + `test_poses.mjs` dans `scripts/`.
Le dernier charge le GLB réel, applique `src/pose.ts` et contrôle les matrices monde finales,
les longueurs, semelles, angles HUD, appuis, continuité et indépendance à l’historique.
Le transport est partagé : aucun rig ne remet le temps à zéro en changeant de style.
Les pourcentages d’appui sont illustratifs et nuls sur un pied levé ; ils ne mesurent pas de
forces. Les repères verts sont distants de moins de 9 cm, sans preuve de contact de surfaces. Build : `npm run build`
(`tsc -b && vite build`). Captures : `npm run capture`.
**Garantie de non-régression** : `npm test` + `npm run build` sont exécutés en CI (job `test` de
`.github/workflows/deploy.yml`) à chaque push sur `main` et chaque PR ; le déploiement Pages est
bloqué si un test échoue (`needs: test`). Tout nouveau comportement doit donc arriver avec son
scénario Gherkin (ou test numérique) dans le même commit.
