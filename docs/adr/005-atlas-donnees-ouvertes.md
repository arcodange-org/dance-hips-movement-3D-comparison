# ADR 005 — Atlas anatomique produit en interne à partir de données ouvertes

- **Statut** : accepté (2026-11-21, issue #132). Voir ADR 001 pour le cadre général (rig
  paramétrique f(temps), pas de mocap, conventions verrouillées inchangées).
- **Contexte** : anatobase.com (AnatoBase) propose un format utile — Motion Library (séquences
  multi-angles de mouvements articulaires) et Anatomy Library (muscle par muscle, origines /
  insertions, fonctions) — mais sa licence interdit toute capture, publication, partage et tout
  usage IA. Ce dépôt étant public (GitHub Pages), aucun asset AnatoBase n'y entrera jamais.
  Demande du fondateur (2026-11-21) : produire nous-mêmes un équivalent à partir de données
  publiques, pour servir de documentation intermédiaire vers le comparateur 3D.

## Décision

1. **On produit notre propre atlas ouvert**, au format inspiré (planches multi-angles +
   fiches muscle), sans copier ni la marque ni le contenu d'AnatoBase. Le format « séquence
   multi-angles d'un mouvement articulaire » est un pattern générique.
2. **Sources ouvertes, licences compatibles avec un dépôt public** :
   - Maillages squelette et muscles : **BodyParts3D v4.0 © DBCLS, CC BY-SA 2.1 Japan** (déjà la
     base du dépôt, attribution maintenue dans l'app, le README et l'AGENTS.md).
   - Atlas 3D dérivé pour les fiches muscle : **Z-Anatomy, CC BY-SA 4.0** (prototype Blender
     existant hors dépôt, `~/Work/Danse/anatomie-3d/`).
   - Textes anatomiques (origine, insertion, action, innervation) : **Gray's Anatomy 1918**
     (domaine public, Wikisource/Gutenberg), **Wikidata** (CC0). OpenStax A&P 2e évité : images
     en CC BY-NC-SA.
   - Mouvements : **générés paramétriquement** via `src/pose.ts` sur le squelette réel — pas de
     mocap propriétaire (CMU/AMASS = licences académiques, hors scope, cohérent avec ADR 001).
3. **Stockage** : manifeste et planches dans `docs/atlas/` (versionnés, testables) ; assets
   servis dans `public/atlas/`. Licence des assets générés : CC BY-SA 4.0.
4. **Génération** : planches mouvements par le pipeline de capture existant
   (`scripts/capture_gifs.mjs`, presets `src/cameras.ts`, 5 vues) étendu en
   `scripts/capture_atlas.mjs` ; fiches muscle par le prototype Blender Z-Anatomy.
5. **Intégration** : l'atlas alimente l'oracle (`src/oracle.ts`, contrat
   `docs/spec-phase18-oracle.md`) et les specs de styles avec les niveaux de preuve du dépôt
   (documenté / faible / proposition).

## Conséquences

- **Positif** : tout est publiable dans le dépôt public, rejouable et testable (`npm test`
  valide le manifeste contre les nœuds réels du GLB) ; les ROM et poses de l'atlas deviennent
  des références citées par les specs de styles ; l'attribution DBCLS reste la seule contrainte,
  déjà en place.
- **Négatif** : l'atlas est « généré paramétriquement sur squelette réel », pas « photos de
  modèles relues par un professeur d'anatomie » — niveau de preuve à dire honnêtement dans
  chaque planche. Pas de couverture des danses elles-mêmes (l'atlas couvre l'anatomie
  articulaire, pas les figures de kizomba/zouk).
- **Risque écarté** : aucune violation de licence (rien ne provient d'AnatoBase) ; pas de
  scraping ni d'assets tiers non licenciés.
