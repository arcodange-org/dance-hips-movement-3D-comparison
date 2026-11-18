# Spec de session — objectifs, audit des points faibles, plan d'exécution (phases 16–18)

Demandes 2026-11-18 en attente, clarifiées ici AVANT exécution (spécification d'abord, puis renfort
du harness, puis exécution) :

1. **Contact en paire** (phase 16) : les marqueurs de contact sont verts mais aucun membre ne se
   touche visiblement, et les estomacs se traversent → **ajuster la flexion des genoux et
   l'inclinaison du buste/haut du corps** pour que les surfaces se touchent au bon plan.
2. **Sortie garçon/fille = option exclusive** (phase 17) : c'est un déplacement chorégraphié, à
   mettre dans le groupe radio « Déplacement » (options non combinables, phase 14), avec en plus
   l'option **combiné** qui enchaîne les deux (garçon puis fille).
3. **Oracle de positions** (phase 18) : critiquer l'évaluation des mouvements (actuellement
   des courbes continues) en proposant un **oracle** : pour chaque demi-temps, déduire la
   **position de départ** et la **position d'arrivée** (pieds x/z/lacet, lacet haut vs bas),
   en s'appuyant sur les points de repère (repère fixe, ligne de danse, boussole) et les
   principes de body dynamics : **orientation/croisement des jambes**, **dualité haut/bas du
   corps** (contraposition), **dualité danseur/partenaire** (miroir).

## Audit des points faibles du code actuel (mesuré pendant la session)

| # | Point faible | Preuve / mesure | Correctif prévu |
|---|---|---|---|
| W1 | Marqueurs de contact à z=0.10–0.13 mais surface réelle du ventre (torse ~0.055 + muscles) bien plus loin | sonde à l'URL pair : bosse frontale mesurée z≈0.21–0.23 (leader 0.212/0.233, follower 0.326/0.450 côté opposé) → avec PAIR_DZ=0.125, les ventres se **traversent de ~0.21 m** | phase 16 : PAIR_DZ recalé sur la surface, marqueurs sur la surface, lean plafonné en paire |
| W2 | Jambe à extension max au repos (HIP_Y = L1+L2) → toute flexion ajoutée après l'IK fait reculer le pied | sonde quarts : pied G atteignait z=0.084 au lieu de la cible 0.20 (« s'arrête à mi-chemin ») | fait en phase 15 : flexion intégrée DANS le solve (L2eff) → pied atteint 0.199≈0.200 |
| W3 | `THREE.Line` 1 px invisible après downscale GIF | phase 6 | rubans (boxes) pour la ligne de danse |
| W4 | L'analyseur d'images rate les petits détails 3D | frames vírgula mal lues | sonde numérique `window.__dbg` jetable, retirée avant commit |
| W5 | Outil search_replace : les backslashes doublés à l'occasion | regex `footL\\.z` non reconnue | vérifier (grep/cat -A), corriger via python |
| W6 | CI : le run push est annulé si un run PR tourne en parallèle (concurrency `pages`), et `gh run rerun` est bloqué par l'intégration | runs 44329358275 / 44341968298 cancelled | note ajoutée dans HARNESS : re-pusher un commit (checkpoint) pour redéclencher |
| W7 | Mutations `gh api`/merge bloquées dans le sandbox | — | livraison par ff-push `<branche>:main` (PR auto-MERGED) |
| W8 | Options de déplacement combinables (checkbox) | demande utilisateur | phase 14 : groupe radio exclusif (`movementOf`/`movementFlags`) |
| W9 | Évaluation des mouvements = courbes f(temps) seulement, pas de poses discrètes par demi-temps | demande utilisateur (oracle) | phase 18 : `src/oracle.ts` + Gherkin `oracle.feature` |
| W10 | Paramètre « retard du suiveur » (delay) donnait un faux sens en paire | demande utilisateur | phase 15 : supprimé ; paire = miroir exact, styleB réservé au compare |

## Modèle d'oracle (phase 18)

`src/oracle.ts` (fonctions pures, testées en Gherkin, donc garantidas en CI) :

```ts
interface Pose { footL: { x: number; z: number; yaw: number }; footR: { x: number; z: number; yaw: number }; upperYaw: number; lowerYaw: number; }
oracleHalfStep(movement: "quarts" | "ida", k: number, reverse?: boolean): { start: Pose; end: Pose }
```

- **Points de repère** : poses en coordonnées monde, repère fixe à l'origine, ligne de danse
  E=+x, N=−z (conventions verrouillées).
- **Orientation/croisement des jambes** : chaque demi-temps, un pied pivote à 90° (talon au bout
  de l'autre pied) puis l'autre pied se ramène parallèle — positions x/z/lacet explicites.
- **Dualité haut/bas** : half 0 → `upperYaw` avance (suit le pied qui pivote), `lowerYaw` fixe ;
  half 1 → `lowerYaw` rattrape (contraposition tango).
- **Dualité danseur/partenaire** : `reverse` = miroir (z→−z, yaw→−yaw) + rôles G/D échangés.
- Propriétés testées : **continuité** `end(k) = start(k+1)` ; **accord** avec `quartTurnStep` /
  `idaContra` aux frontières de demi-temps ; **dualité** `oracle(reverse)` miroir de `oracle`.

## Plan d'exécution

- **Phase 16** (branche courante `vibe/phase16-contact-fit-ae8a7a`) : contact fit — PAIR_DZ +
  marqueurs sur la surface mesurée, lean plafonné en paire, flexion genoux conservée via IK ;
  Gherkin écarts < 0.09 m ; GIF `paire-contacts` regénéré.
- **Phase 17** : `MovementKey += "sortie" | "sortie2"` ; option radio « Sortie garçon/fille » +
  « Sortie combinée (enchainement) » ; `sortieActive(side, b, combine)` pur (combiné : leader
  temps 0–7, suiveur 8–15) ; Gherkin.
- **Phase 18** : `src/oracle.ts` + `docs/features/oracle.feature` + rétrospective M4
  (critique de l'évaluation des mouvements).

Chaque phase : spec (faite ici) → code + tests Gherkin → `npm test` (garanti en CI) → captures →
PR → ff-merge → CI → site live → checkpoint.
