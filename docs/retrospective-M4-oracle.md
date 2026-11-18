# Rétrospective M4 — addendum phase 18 : critique de l'évaluation des mouvements

## Ce qui a été fait

Oracle de poses discrètes par demi-pas (`src/oracle.ts`, `docs/oracle.feature`,
`scripts/test_oracle.mjs`, 6 scénarios PASS) : continuité `end(k)=start(k+1)` et raccord de
cycle, accord avec `quartTurnStep` aux frontières, dualité miroir G/D en `reverse`,
contraposition haut/bas (signes opposés en milieu de pas, nuls aux frontières), angle droit du
pied pivotant (π/2) sur les quarts de tour.

## Critique (leçon pour le process)

- **Piège évité grâce à l'oracle** : l'évaluation par courbes seules (bornes sur f(temps))
  ne détecte pas les **sauts au raccord des cycles** ni les inversions de rôles implicites.
  L'oracle énonce des poses de frontière discrètes et teste leurs propriétés (continuité,
  dualités) — complémentaire du rendu continu, pas un remplacement.
- **Raccourci pris à tort** : supposer que `quartTurnStep(b)` au temps pair = « fin du demi-pas
  précédent » ; en réalité b pair = début du demi-pas suivant (les cibles de lacet y sont déjà
  celles du nouveau demi-pas). L'angle droit se vérifie en milieu de demi-pas 0 (temps 1, 5, 9,
  13), pas à la frontière. Leçon : toujours préciser la convention « début de pas » vs « fin de
  pas » dans les specs de mouvements.
- **Périmètre respecté** : issue #17 (autre agent) réserve le moteur (`Rig.tsx`, `styles.ts`,
  `ik.ts`, `App.tsx`, leurs tests) — la phase 18 vit en fichiers neufs et ne fait que LIRE les
  fonctions pures ; coordination déclarée en commentaire de l'issue #17. La phase 17 (sorties
  exclusives) attend la clôture de #17 car elle touche les mêmes fichiers.

## Tâches (r)ajoutées

- [x] 50. Phase 18 oracle (fait ici).
- [ ] 49. Phase 17 sortie exclusive + combiné — **bloquée tant que #17 ouverte** (fichiers
  communs), à reprendre ensuite.
- [x] M5. Recoupement oracle ↔ poses finales du moteur #19 (livré, `scripts/test_oracle_final.mjs`,
  429 assertions PASS : pieds/lacets ~1e-17, dissociation exacte, sorties exactes, sol OK).
  Voir `docs/spec-phase18-oracle.md` §7 pour les leçons (convention début/fin de pas, lacet en
  Euler YXZ, repos GLB vs repos plan, projection reach-discs sur rootX).
