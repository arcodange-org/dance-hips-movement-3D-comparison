# Atlas anatomique ouvert

[Accueil](../../README.md) · [Spécification (PRD)](../spec-atlas-anatomique.md) · [ADR 005](../adr/005-atlas-donnees-ouvertes.md) · [Recherche biomécanique](../recherche-biomecanique/README.md) · [Manifeste](manifest.json)

Atlas produit **en interne** à partir de données ouvertes, au format inspiré d'anatobase.com
(planches multi-angles + fiches muscle par muscle) **sans copier ni marque ni contenu**.
Objectif : documentation intermédiaire vérifiable pour consolider le comparateur 3D aux corps
dansants (roulis du bassin, isolations, compensation du tronc).

## Contenu

- `manifest.json` — inventaire des mouvements articulaires prioritaires, mappés sur les nœuds
  réels du rig GLB (`public/anatomy.glb`) ou du buste JSX, avec ROM en degrés, priorité et
  niveau de preuve. Validé par `scripts/test_atlas_manifest.mjs` dans `npm test`.
- `mouvements/` — planches générées (à venir) : un dossier par mouvement, 5 vues
  (`face`, `troisQuarts`, `profil`, `troisQuartsDos`, `dos`), PNG + GIF + `meta.json`
  (ROM mesurée sur le GLB, frames, caméra).
- `muscles/` — fiches muscle par muscle (à venir) : nom TA, origine, insertion, action,
  innervation (textes Gray 1918 / Wikidata), rendu 3D isolé (Z-Anatomy CC BY-SA 4.0 ou couche
  musculaire BodyParts3D embarquée dans `public/anatomy_muscles.glb`).

## Licences

| Élément | Source | Licence |
|---|---|---|
| Maillages squelette/muscles | BodyParts3D v4.0 © DBCLS | CC BY-SA 2.1 Japan (attribution maintenue) |
| Atlas 3D dérivé (Z-Anatomy) | Z-Anatomy | CC BY-SA 4.0 |
| Textes anatomiques | Gray's Anatomy 1918, Wikidata | Domaine public, CC0 |
| Planches générées par nos scripts | `src/pose.ts` + captures | CC BY-SA 4.0 |

## Niveaux de preuve

Même vocabulaire que le reste du dépôt : **documenté** (source citée), **faible**, **proposition**.
L'atlas est « généré paramétriquement sur squelette réel » — ce n'est **pas** des photos de
modèles relues par un professeur d'anatomie. Le dire dans chaque planche.

## Comment contribuer

1. Ajouter un mouvement dans `manifest.json` (schéma validé par le test), priorité 1 = bassin,
   hanche, genou — ce que le comparateur anime.
2. Générer les planches avec le pipeline de capture (à construire, voir spec §Pipeline) :
   `npm run build && node scripts/capture_atlas.mjs --mouvement <id>`.
3. Sourcer les ROM dans `docs/recherche-biomecanique/` avant de passer la preuve en « documenté ».
