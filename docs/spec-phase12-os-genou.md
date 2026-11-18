# Spec Phase 12 — bug : os mal placés au genou (anatomy.glb)

Bug remonté 2026-11-18 avec l'URL
`…?mode=observe&style=tarraxinha&…&ida=1&campos=1.43,1.05,1.09&camtgt=0,0.88,0` (vue de côté
gauche rapprochée du bassin) : un os mal placé au niveau du genou.

## Diagnostic (mesuré sur public/anatomy.glb)

Nœuds sous `KneePivot_*` — le maillage porté par chaque nom est le mauvais (noms décalés) :

| nœud | taille maillage (2×scale) | translation actuelle | attendu |
|---|---|---|---|
| Tibia_L | 0.074×**0.380**×0.063 (gros tibia) | (-0.001,-0.189,+0.006) | ✓ OK |
| Patella_R | 0.074×**0.380**×0.063 (gros tibia) | (0,-0.189,+0.007) | ✗ devrait être le petit sur Tibia_R |
| Tibia_R | 0.042×**0.039**×0.022 (petite rotule) | (-0.009,+0.008,+0.035) | ✗ rotule au front du genou, nom tibia |
| Fibula_L | 0.036×**0.384**×0.030 (fibula) | (+0.028,-0.190,+0.005) | ✓ OK |
| Patella_L | 0.036×**0.384**×0.030 (fibula D) | (-0.001,+0.008,+0.035) | ✗ fibula au front du genou |
| Fibula_R | 0.042×**0.039**×0.022 (petite rotule) | (-0.028,-0.190,+0.005) | ✗ rotule flottante mi-tibia |

(tailles mesurées via node.scale × 2 ; côté via moyenne x des sommets quantizés int16.)

Conséquence visuelle : au genou **gauche** une longue fibule "pointe" vers l'avant (nœud
Patella_L), et à droite une petite rotule flotte au milieu du tibia externe (nœud Fibula_R) —
visible à la caméra donnée, surtout quand le genou plie (ida=1).

## Correction

`scripts/fix_shin_bone_meshes.py` réassigne les mesh indices (cycle à 4) :

- `Tibia_R.mesh ← Patella_R.mesh` (gros tibia), `Patella_R.mesh ← Fibula_R.mesh` (petite rotule),
- `Fibula_R.mesh ← Patella_L.mesh` (fibula droite), `Patella_L.mesh ← Tibia_R.mesh` (petite rotule),
- translations : `Tibia_R → [+0.001,-0.189,+0.006]`, `Patella_R → [+0.001,+0.008,+0.035]`
  (miroirs des valeurs L existantes ; les 4 autres translations sont déjà correctes).

Règles attendues après fix (testées en Gherkin `docs/features/os-symetrie.feature`) :
- Tibia_* : taille y > 0.30 m et t.y < -0.10 (mi-tibia) ;
- Fibula_* : taille y > 0.30 m, |t.x| > 0.02 (côté externe), t.y < -0.10 ;
- Patella_* : taille y < 0.08 m, t.y > -0.05 et t.z > 0.02 (front du genou) ;
- symétrie L/R pour chaque paire (HipPivot, HipBone, Femur, KneePivot, AnklePivot, Tibia,
  Fibula, Patella, Foot) : |t_R.x + t_L.x| ≤ 0.02, |t_R.y − t_L.y| ≤ 0.02, |t_R.z − t_L.z| ≤ 0.02.

## Validation

- `npm test` vert (nouveau feature + 39 existants) ; `npm run build` vert.
- Re-capture de la vue exacte du bug (mêmes params URL) + gros plan genoux : plus d'os flottant
  au genou ; tibia/fibula/rotule au bon endroit des deux côtés.
- Pas de changement de hiérarchie de pivots ni de métriques (conventions verrouillées intactes).
