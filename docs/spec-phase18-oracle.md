# Spec phase 18 — Oracle de poses discrètes par demi-pas (critique de l'évaluation des mouvements)

Demande 2026-11-19 : « réviser le plan de la session et critiquer l'évaluation des mouvements :
il y a des points de repère et des principes de base de body dynamic sur l'orientation /
croisement des jambes, la dualité haut/bas du corps, la dualité danseur/partenaire. On peut
proposer un oracle et déduire quelle position de départ et quelle position d'arrivée avoir entre
chaque demi-temps. »

## 1. Critique de l'évaluation actuelle (audit W9, `docs/spec-session-16-18.md`)

L'évaluation actuelle des mouvements est **courbe-continue** : on trace des trajectoires f(temps)
et on vérifie des bornes (support ∈ [-1,1], extra ∈ [-0.05, 0.35], lacets, etc.). Problèmes :

- Une courbe peut être « dans les bornes » tout en étant **discontinue au raccord des cycles**
  (saut de translation des quarts de tour, saut d'orientation du corridinho) — invisible aux
  bornes, visible à l'œil.
- Les poses **réellement appliquées au squelette** (après IK, clamp sol, vírgula) ne sont pas
  testées : seule la courbe amont l'est.
- La **dualité danseur/partenaire** (miroir + échange G/D en `reverse`) et la **dualité
  haut/bas** (contraposition) sont implicites dans le code, jamais énoncées comme propriétés.

## 2. Oracle proposé

`src/oracle.ts` (fichier neuf — ne touche pas au moteur) définit la **pose discrète** par
demi-pas (2 temps) :

```ts
interface FootPose { x: number; z: number; yaw: number }
interface Pose { footL: FootPose; footR: FootPose; upperYaw: number; lowerYaw: number }
oracleHalfStep(movement: "quarts" | "ida", k: number, reverse?: boolean): { start: Pose; end: Pose }
```

- `quarts` : poses déduites de `quartTurnStep(2k)` / `quartTurnStep(2k+2)` (pieds en cibles monde
  du demi-pas, lacets, upperYaw/lowerYaw).
- `ida` : poses déduites de `idaEVoltaStep(2k)` (pied actif, direction ±0.09 m en z, pied
  d'appui fixe) + `idaContra(2k)` (upperYaw/lowerYaw en cloche).

## 3. Propriétés exigées (principes de body dynamic, testés en Gherkin `docs/oracle.feature`)

1. **Continuité** : `end(k) == start(k+1)` (tolérance 1e-9) pour tout k, y compris au raccord
   de cycle (k = 7 → 0 sur 16 temps pour quarts, 3 → 0 sur 8 pour ida) — détecte les sauts.
2. **Accord avec le moteur** : les poses de l'oracle = `quartTurnStep`/`idaContra` aux
   frontières de demi-pas (l'oracle ne réinvente pas, il énonce).
3. **Dualité danseur/partenaire** : `reverse` = miroir (z → −z, yaw → −yaw) + échange des
   rôles G/D (`stepSide` L↔R, pied pivotant D'abord).
4. **Dualité haut/bas (contraposition)** : pendant un pas, `upperYaw` et `lowerYaw` évoluent
   en opposition (signe opposé), et retombent à la frontière entre demi-pas.
5. **Orientation/croisement des jambes** : au quart de tour, le pied qui pivote a
   `yaw = th0 + π/2` (angle droit avec l'autre pied) à la fin de son demi-pas.

## 4. Limites (à documenter)

- L'oracle couvre les **poses de frontière** (début/fin de demi-pas), pas la courbe interne :
  c'est volontaire (évaluation discrète, lisible), la courbe reste du rendu.
- Il ne teste pas encore la pose **post-IK** (issue #17 en cours sur le moteur) ; ici on teste
  la consigne de pose amont. Le recoupement viendra quand #17 livrera les tests de poses finales.

## 5. Périmètre fichiers (coordination issue #17)

Fichiers neufs uniquement : `src/oracle.ts`, `scripts/test_oracle.mjs`, `docs/oracle.feature`
(hors `docs/features/`), + une ligne dans le script `test` de `package.json`, + docs
(TASKS 50, CONTEXT, rétrospective M4). Aucun édition de `Rig.tsx`/`styles.ts`/`ik.ts`/`App.tsx`.

## 6. Validation

- `npm test` inclut `scripts/test_oracle.mjs` (64 PASS Gherkin existants + scénarios oracle).
- `npm run build` OK. CI job `test` sur la PR.
- Rétrospective M4 : addendum `docs/retrospective-M4-oracle.md` (évaluation mouvements :
  courbes → poses discrètes par demi-temps).

## 7. Phase M5 — recoupement oracle ↔ poses finales du moteur #19 (livré)

`scripts/test_oracle_final.mjs` (branché dans `npm test`) applique `applyPose` sur le GLB réel
(fixture) et compare aux prédictions de `src/oracle.ts` :

- **quarts** (solo, cycle 16) : chevilles x/z et lacets à chaque pas posé (b=2k+1,2, e=1) ;
  `root.rotation.y = lowerYaw` et `chest.rotation.y = upperYaw − lowerYaw` à chaque quart de
  temps. Erreurs max mesurées : pieds 7e-17 m, lacets 0.
- **ida e volta** (solo, cycle 8) : pieds aux frontières b=2k, **relatifs au repos GLB** (le
  moteur pose relativement au repos réel du GLB, ±0,0708, pas aux constantes plan ±0,084) ;
  convention « dernier pas du côté » (recherche arrière) reprise dans l'oracle.
- **sorties** (solo sortieG + paire sortieGF) : déplacement latéral des pieds EXACT vs oracle
  (rel repos) ; `rootX` avec tolérance 0,08 m (la projection de portée reach-discs décale le
  root, err max mesurée 0,070) ; contre-rotation buste prédite (`upperYaw = −0.22·se`) ;
  fenêtres du combiné (leader p<8, follower p≥8) et miroir du suiveur vérifiés.
- **sol** : minY sommets = −5e-16 ≥ −1e-9 (coherent avec la garantie #19).

Résultat : **429 assertions PASS**. Leçons : convention début/fin de pas à préciser (e=0 vs
e=1), lacet lu en Euler YXZ/local (pas atan2 du forward, pollué par le pitch), repos GLB ≠
repos plan (comparer relatif au repos pour ida/sorties).
