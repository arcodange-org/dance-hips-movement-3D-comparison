# Spec Phase 8 — déplacements : quarts de tour, marche avant/arrière + marka « 3 temps », ida e volta, bug GLB

Date : 2026-11-18. Demandes utilisateur 2026-11-18 (priorité : mouvements individuels d'abord).

## §1 Bug — os flottants quand « Pieds plantés » est décoché

Signalé : avec `plant=0`, 2 os visibles (rotule genou gauche, sous le fémur droit).
Cause trouvée (sonde world positions + parsing GLB) : les nœuds `Patella_L`, `Fibula_R`,
`Fibula_L` avaient des translations locales erronées dans `public/anatomy.glb`
(patella à y=-0,206 sous le KneePivot = mi-tibia ; fibulas à ±0,15-0,18 m en x = flottantes).
Correction : `scripts/fix_knee_bone_offsets.py` (patella au genou [0, 0.008, 0.035], fibulas
côté externe mi-tibia [∓0.028, -0.190, 0.005]). Validé par Gherkin (`le GLB place patella et
fibula au niveau du genou`) + captures headless relues (plant=0 travel=0 et 0.6 : plus d'os
flottant, jambes continues).

## §2 Quarts de tour — mouvement SÉPARÉ du corridinho

- `quarts=1` : `quartsPath(b)` — 4 quarts de tour sur 16 temps = **tour complet (ry 0→2π)**, au
  repère fixe. Test Gherkin : ry monotone 0→2π.
- En mode paire (`quarts=1` ou `corridinho=1`), le **suiveur fait le mouvement en marche
  arrière** : `reverse={isPair && (corridinho || quarts)}` sur le rig B → `reversePath(cp)`
  (x/z miroir, ry opposé ; le cercle inversé passe encore par le repère).
- GIFs : `quarts-de-tour.gif` (solo, tour complet vérifié : face→dos→face), `corridinho-paire.gif`
  (guideur cercle avant, suiveur miroir arrière).

## §3 Marche avant / arrière + marka « 3 temps »

- `dir=1` (défaut) / `dir=-1` = **marche arrière** : `travelOffset(travel, dir, b)` inverse le
  déplacement le long de la ligne de danse (test Gherkin : dir=-1 = opposé de dir=1).
- `temps3=1` : marka « 3 temps » — `swingBeat(b, temps3)` = un pas tous les 3 temps (au lieu de
  chaque temps) pendant le Déplacement.
- GIFs : `marche-3temps.gif` (avant), `marche-arriere.gif` (dir=-1).

## §4 Ida e volta (aller-retour), seul ou à 2 face à face

- `ida=1` : `idaEVoltaStep(b)` sur un cycle de 8 temps — **pied gauche avant puis arrière
  (temps 0-3), pied droit avant puis arrière (temps 4-7)** ; pas en avant/arrière (axe z,
  ±0,09 m) via l'IK de pas. Test Gherkin : séquence L+, L-, R+, R-.
- Mode paire : les deux rigs ont `ida` → face à face tous deux font ida e volta.
- GIF : `ida-e-volta.gif` (mode pair, cam=diag).

## §5 Hors scope (non prioritaire, reporté phase 9)

- Cadre de bras spécifique de la suiveuse en paire (coude G levé hauteur d'épaule, avant-bras
  sur le dos du guideur ; coude D baissé, main D en contact avec la main G du guideur).
- Bouton « partager la vue » (URL avec paramètres + angle caméra).
- README : descriptions dépliables (<details>) sous les GIFs + bascule vue squelette/muscles.
