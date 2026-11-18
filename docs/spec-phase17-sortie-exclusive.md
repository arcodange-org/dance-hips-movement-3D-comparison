# Spec phase 17 — sortie garçon/fille en option EXCLUSIVE (+ combiné), en attente de l'issue #17

Demande 2026-11-19 : « sortie garçon / fille est un déplacement chorégraphié qui doit être une
option exclusive. (on pourra ajouter le combiné qui consiste à enchaîner les deux) ».

> **Blocage** : cette phase touche `src/styles.ts`, `src/App.tsx`, `src/components/Rig.tsx`,
> `src/components/Controls.tsx` — fichiers réservés par l'issue #17 (audit moteur, PR #19 en
> cours, branche `arcodange/audit-poses-finales`). Coordination déposée en commentaire de #17.
> **Exécution prévue dès clôture/merge de #17**, en repartant de `main` à jour.

## 1. Conception

### Modèle
- `MovementKey += "sortieG" | "sortieF" | "sortieGF"` (7 options exclusives au total avec
  none/corridinho/quarts/temps3/ida).
- `movementOf` / `movementFlags` étendus à 7 drapeaux (un seul vrai — non-combinable, comme
  phase 14).
- Nouvelle fonction pure `sortieActive(side: "leader"|"follower", m: MovementKey, b): number`
  → enveloppe [0,1] de la sortie pour ce danseur au temps b :
  - `sortieG` : leader → `sortieEnvelope(b)` (cycle 8), follower → 0 ;
  - `sortieF` : follower → `sortieEnvelope(b)`, leader → 0 ;
  - `sortieGF` (combiné) : cycle 16 — leader actif sur p∈[0,8) (`sortieEnvelope(p)`),
    follower sur p∈[8,16) (`sortieEnvelope(p−8)`) : enchaînement G puis F.

### Application (Rig)
- Le bloc sortie actuel (`if (sortie && embrace)`) devient :
  `const se = embrace && side ? sortieActive(side, movement, b) : 0;` puis
  `r.root.position.x += 0.22 * se * amp` + contre-rotation buste `0.22*e / 0.12*e` (inchangée).
- Le suiveur a `rotationY = π` sur son groupe externe : un déplacement local +x est miroir en
  monde −x → en combiné les deux sorties sont **symétriques** (le couple s'écarte puis se
  rassemble), lisible sur la ligne de danse (axe x au repère fixe).
- La sore n'a de sens qu'en paire (`embrace`) : hors paire, `sortieActive` n'est pas appliquée.

### UI / URL
- Controls : la checkbox « Sorties garçon / fille » est **supprimée** ; le fieldset radio
  « Déplacement (options exclusives) » gagne 3 entrées (visibles en mode paire) :
  « Sortie garçon (paire) », « Sortie fille (paire) », « Sortie combinée G→F (paire) ».
- URL : bloc exclusif étendu — `sortie=1` (legacy → `sortieG`), `sortieF=1`, `sortieGF=1` ;
  le parse `sortie` isolé est retiré ; `onShare` écrit `sortieG/sortieF/sortieGF` à la place
  de `sortie`.
- `scripts/capture_gifs.mjs` : la capture `sortie-garcon-fille` passe en `sortieGF=1`
  (combiné) ; `DemoOverlay` : caption « suiveur en retard » à corriger (delay supprimé en
  phase 15).

### Tests (Gherkin, `docs/features/options-deplacement.feature` étendu)
- Exclusivité à 7 options : `movementFlags(m)` a exactement un drapeau vrai pour chaque clé.
- `sortieActive` : bornes [0,1] ; sortieG → leader plein sur temps 1–3 du cycle 8, follower nul ;
  sortieF inverse ; sortieGF → leader nul sur p≥8, follower plein sur p∈[9,11] du cycle 16 ;
  périodicité 8 (G/F) et 16 (combiné).

## 2. Fichiers concernés (à ne lancer qu'après #17)

`src/styles.ts` (MovementKey/movementOf/movementFlags/sortieActive), `src/App.tsx` (états,
parse URL exclusif, props Rig, onShare), `src/components/Rig.tsx` (bloc sortie via
`sortieActive`, prop `movement` à la place de `sortie`), `src/components/Controls.tsx`
(radios, suppression checkbox), `src/components/DemoOverlay.tsx` (caption),
`scripts/capture_gifs.mjs` (query sortieGF), `scripts/test_features.mjs` (steps sortieActive),
`docs/features/options-deplacement.feature`, README (params), TASKS 49, CONTEXT.

## 3. Validation

- `npm test` (Gherkin + oracle) + `npm run build` ; GIF `sortie-garcon-fille.gif` regénéré ;
  vérification visuelle mode paire (sortie G, sortie F, combiné) ; CI job `test` sur la PR.
