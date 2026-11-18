# Spec Phase 16 — ajuster le contact en paire : flexion des genoux + inclinaison du buste

Retour 2026-11-18 (URL pair tarraxinha `…muscles=1…campos=-4.3,1.85,0.25…`) : « on ne voit
effectivement aucun membre se toucher alors que les estomacs des danseurs se traversent :
**ajuster la flexion de genoux et l'inclinaison du buste/haut du corps**. »

## Diagnostic à faire

- Sonde temporaire sur les marqueurs de contact (monde) + bosse max en z des maillages
  (torse + couche musculaire) par danseur, à l'URL exacte, pour mesurer le recouvrement des
  ventres et la distance réelle des marqueurs (poitrine/bassin/genoux).
- Le problème attendu : `PAIR_DZ=0.125` avec marqueurs frontaux à z_local≈0.10–0.13 → les
  marqueurs se touchent, mais la bosse musculaire/ventrale (qui dépasse le plan des marqueurs)
  se traverse ; et la posture (`lean`, `knee`) déplace le buste/hanches hors du plan de contact.

## Correction visée

1. **Inclinaison du buste en paire** : le `lean` s'applique en pivotant autour du point de
   contact (hanche/bassin), pas en faisant plonger la poitrine dans le partenaire. Le plan de
   contact reste z_local = PAIR_DZ pour la poitrine ET le bassin (ligne d'embrace droite).
2. **Flexion des genoux** : ajustée pour que le bassin (hanches) soit à la bonne hauteur/position
   de contact quand les genoux sont fléchis (le bassin descend avec la flexion ; les hanches
   doivent rester en contact, pas flotter ni traverser).
3. **PAIR_DZ** recalé sur la bosse mesurée (surface ventrale max) pour que les ventres se touchent
   exactement (pas de traversée), avec les 4 marqueurs de contact dans le seuil vert (< 0.09 m).
4. Gherkin : distances de contact < 0.09 m pour les 4 points avec le PAIR_DZ retenu ; posture
   (lean/knee) dans les bornes ; pas de recouvrement (marqueur poitrine z_leader ≥ −marqueur
   poitrine z_follower, i.e. écart ≥ 0 au niveau contact).

## Validation

- Sonde runtime à l'URL du bug : écart des marqueurs poitrine/bassin/genoux ∈ [0, 0.09] (touchent
  sans se traverser) ; bosse musculaire max de chaque danseur ≤ plan de contact.
- Captures : `paire-contacts.gif` regénéré (membres qui se touchent visiblement) + vérif visuelle.
- `npm test` (garanti en CI) + build ; README/CONTEXT/TASKS à jour.
