# Spec Phase 6 — comparatif d'appuis (jauges G/D) + corridinho au repère fixe après pivots D/G

Date : 2026-11-18. Tâches : `docs/TASKS.md` (section Phase 6). Branche prévue :
`vibe/phase6-comparatif-appuis-corridinho-ae8a7a`.

## Demandes (utilisateur, 2026-11-18)

1. **Mode « comparatif d'appuis »** : deux styles côte à côte avec leurs **jauges G/D**.
2. **Corridinho** en **déplacement circulaire au repère fixe**, mais **seulement après le pivot
   droit (quart de tour) puis le pivot gauche**.

## 1. Comparatif d'appuis

- Réutiliser le mode **Comparaison** (`mode=compare`) avec `appui=1` : chaque rig a déjà ses
  pastilles de charge et sa chaîne d'appui. Ajouter **une jauge G/D par corps** (barre
  horizontale scindée G|D, couleur du style, label « A · Kizomba » / « B · Kompa ») + HUD
  par style (appui %, genoux °, roll °).
- Implémentation : refs de stats **par rig** (`statsARef`, `statsBRef` — aujourd'hui un seul
  `statsRef` partagé, le dernier rig écrase l'autre) ; App rend deux jauges quand
  `mode=compare && showAppui`.
- Persistance/URL : rien de nouveau (`appui=` existe), éventuellement `?mode=compare&appui=1`.
- GIF : `comparatif-appuis.gif` (`bare=1&demo=comparatif-appuis&cam=wide&mode=compare&style=kizomba&styleB=kompa&bpm=90&travel=0&appui=1`),
  vérifié visuellement (deux jauges animées, couleurs A/B distinctes).
- Critère d'acceptation : `npm test` OK, build OK, GIF relu, les deux jauges animées lisibles.

## 2. Corridinho (après pivots D puis G)

Source : [Wikipédia FR, Kizomba](https://fr.wikipedia.org/wiki/Kizomba) — « les **1/4 de tour**,
en 3 temps avec un marqua » et « le **corridinho** ou *corridinha*, succession de pas qui forme
un **cercle au sol**, où l'homme avance en inclinant légèrement ses épaules vers l'intérieur du
cercle ». Séquence demandée : **pivot droit (quart de tour) → pivot gauche (quart de tour) →
corridinho** (déplacement circulaire autour du repère fixe), le tout lisible au **repère fixe**.

- Implémentation : case « Corridinho (après 1/4 tour D puis G) » (mode paire ou solo), persistée,
  param `corridinho=`. Séquence sur un cycle (ex. 16 temps) : temps 0–3 pivot droit
  (`root.rotation.y` quart de tour + marqua), 4–7 pivot gauche, puis 8–15 déplacement circulaire
  : `root.position` décrit un cercle de rayon ~0,25–0,35 m autour de l'origine (repère fixe),
  épaules inclinées vers l'intérieur (léger `chest.rotation.z` vers le centre).
- Le repère fixe (`OriginMarker`) rend le cercle relatif à l'origine visible ; capture
  `cam=fixed|wide`.
- GIF : `corridinho.gif` vérifié visuellement (cercle autour de l'anneau, après les deux pivots).
- Critère d'acceptation : séquence D→G→cercle visible, cercle centré sur le repère fixe,
  `npm test` OK (ajouter un test : la trajectoire fait bien un cercle après les pivots, rayon
  borné, pas de NaN).

## Hors scope

Pas de nouveau style, pas de mocap, pas de changement de hiérarchie GLB ni de clamp. Méthode
anti-amnésie inchangée (`CONTEXT.md`) : branche + PR draft tôt, checkpoints `TASKS.md`.

## 3. Vues lisibles (sorties) et corps lisibles (tâches 13–14, demande 2026-11-18)

- Problème constaté : en mode paire les danseurs se font face sur l'axe x ; la caméra frontale
  par défaut les montre **de profil orthonormé**, et la sortie (déplacement latéral local →
  profondeur monde z) y est invisible. Les buste semi-transparents se lisent comme des
  « squelettes qui tanguent ».
- Presets caméra `?cam=front|back|diag` (front [4.8,1.3,0.4], back [-4.8,1.3,0.4],
  diag [3.3,1.5,3.3], cible [0,0.85,0]) ; **caméra diago par défaut en mode paire** (bare et
  normal) quand aucun `cam=` n'est donné.
- GIF `sortie-garcon-fille` refait en `cam=diag` (+ `solid=1`) : déplacement latéral des deux
  danseurs visible relativement au repère fixe.
- Param `?solid=1` : prop `torsoOpacity` sur Rig (0,62 au lieu de 0,22) pour les captures, sans
  changer le rendu par défaut de l'app ; GIFs des 6 styles regénérés avec `solid=1`.
- Critères : sortie visible en vue diago (vérifié sur frame), corps lisibles (torse opaque),
  `npm test` + build OK, rien de cassé en mode normal.

## 4. Pieds plantés en sur place (tâche 15, demande 2026-11-18)

« Quand il y a du sur place on s'attend à ce que le pied garde constamment un contact avec le
sol (petit pivot possible sur la plante / "semi-pointe" = ball of the foot). »

- À `travel=0`, le rig fait tourner l'IK **sans pas** : les cibles des pieds restent les
  positions plantées de repos (`state.plant`), donc les pieds restent au sol pendant que le
  corps (root/pelvis) fait le transfert de poids G/D. Le pivot sur la plante reste possible
  via `extraL/extraR` (talon levé) et `foot.rotation.z = -hip.rotation.z`.
- Prop `plant` (défaut ON), case « Pieds plantés (sur place) », param `plant=` ; `plant=0`
  restaure l'ancien comportement glissé à travel=0 (convention handoff) — **amendement
  demandé explicitement par l'utilisateur le 2026-11-18**, à documenter dans README/CONTEXT.
- Blend : `w = travel>0 ? min(1, travel/0.2) : (plant ? 1 : 0)` ; pas de swing créé à
  travel=0 (pas de levée de pied).
- Vérif : GIF/frames — le pied d'appui ne quitte pas le sol (position au sol quasi fixe) ;
  `npm test` + build OK.

## 5. Sortie = ligne de danse (tâche 16, demande 2026-11-18 — AFFÛTÉE)

« Quand on parle de sortie, on parle de **ligne de danse** : le garçon ou la fille **sort de la
ligne puis revient dessus**. »

- **Ligne de danse** = axe x monde passant par le repère fixe (OriginMarker) : composant
  `LineOfDance` (ligne pointillée le long de x, au sol), visible en mode paire (case/param
  `ligne=`, défaut ON en paire).
- **Mode paire réorienté sur la ligne** : le couple est SUR la ligne, face à face selon l'axe z
  (leader z=-0.14 rotY=0, follower z=+0.14 rotY=π) au lieu de l'axe x — la sortie latérale
  (axe x) devient **visible en vue de face/diago** (elle était en profondeur en profil).
- **Sortie** = `sortieOffset(b, amp)` (fonction pure, testée) appliqué sur `root.position.x`
  local = perpendiculaire à la ligne : aller à ±0,22 m hors de la ligne (temps 0–5), **retour
  sur la ligne** x=0 (temps 5+). Leader et follower symétriques (chacun sort de son côté) ;
  le retard du suiveur décale la « sortie fille » (Wikipédia FR : « sortie garçon (5 temps) :
  l'homme sort de la ligne de danse sur la gauche puis revient en face de sa partenaire »).
- Validation : `docs/features/sortie-ligne-de-danse.feature` (enveloppe 5/8, bornée 0–0,22 m,
  périodique ; scénario perpendicularité @wip jusqu'à livraison).

## 6. Dissociation bras/buste vs bas du corps (tâche 17, à affiner ensuite)

Pendant la sortie, le **cadre des bras et le buste restent orientés sur la ligne de danse**
(contre-rotation du buste) pendant que le bassin sort et revient — dissociation thoraco-pelvienne
maximale. À spécifier finement quand la tâche 16 est livrée (bras = groupes armU/armF existants).

## 7. Validations Gherkin (tâche 18 — livré le 2026-11-18)

- `docs/features/*.feature` (7 fichiers) + runner minimal zéro-dépendance
  `scripts/test_features.mjs` câblé dans `npm test` : 14 PASS, 0 FAIL, 6 SKIP (@wip).
- Chaque tâche a son feature ; les scénarios @wip sont dé-wippés à la livraison de la tâche
  (corridinho, comparatif d'appuis, vues, perpendicularité de la sortie).
- Fonctions pures testables ajoutées : `plantBlend(travel, plant)`, `sortieOffset(b, amp)`.
