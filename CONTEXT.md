# CONTEXT.md — état du projet et méthode anti-amnésie (cross-session)

Ce fichier est la **source de vérité** pour reprendre le travail dans une nouvelle session.
Règle d'or : **aucun état important uniquement en mémoire ou dans /tmp** — tout vit dans ce
dépôt (ce fichier, `docs/spec-*.md`, `docs/adr/*`, `docs/TASKS.md`, README) et sur GitHub
(branche + PR), poussés tôt et souvent.

## Liens

- Dépôt : https://github.com/arcodange-org/dance-hips-movement-3D-comparison
- Site déployé (GitHub Pages) : https://arcodange-org.github.io/dance-hips-movement-3D-comparison/
- PR en cours / historique : `gh pr list --repo arcodange-org/dance-hips-movement-3D-comparison`
- Derniers runs CI (Pages) : `gh run list --repo arcodange-org/dance-hips-movement-3D-comparison --branch main --limit 5`
- Branche de travail courante : voir `git branch --show-current` (convention `vibe/phaseN-<slug>-ae8a7a`)

## Où en est le projet

- Phases 1–4 **mergées dans `main`** : migration Vite+React+three TS, IK de pas, anatomie
  BodyParts3D régénérée, persistance localStorage, vertèbres L/D, déploiement Pages, GIFs
  motion design, mouvements sourcés sur place (2 temps, sorties garçon/fille), couche
  musculaire BodyParts3D, tests numériques (`npm test`).
- Phase 6 **planifiée** (tâches 10–12 dans `docs/TASKS.md`, spec
  `docs/spec-phase6-comparatif-appuis-corridinho.md`) : comparatif d'appuis (jauges G/D par
  corps en mode Comparaison) + corridinho au repère fixe après pivots D puis G.
- Phase 6 aussi : tâches 13–14 (vues face/dos/diago, sortie lisible en diago, `solid=1` pour
  des corps lisibles en capture).
- Rétrospective / boucle de feedback : `docs/retrospective-phase3-5.md` + méta-tâche M4
  récurrente dans `docs/TASKS.md`.
- Phase 5 **livrée** : PR #3 mergée dans `main` (2026-11-18), CI Pages run 44272969552 =
  success, site vérifié (assets 200, smoke headless sans erreur). Branche :
  `vibe/phase5-repere-fixe-appui-ae8a7a`. Contenu : repère fixe
  (OriginMarker + `repere=` + `cam=fixed|wide` + pan off en bare), appuis & transmission
  (`support(b)`, pastilles de charge, chaîne pied→genou→hanche emissive, HUD, `appui=`),
  GIF vedette README = kizomba sur place + muscles (`kizomba-muscles-sur-place.gif`), corrections
  sourcing + ADR 003. Spec : `docs/spec-phase5-repere-fixe-appui.md`, tâches : `docs/TASKS.md`.

## Méthode anti-amnésie (à respecter à chaque session)

1. **Lire ce fichier d'abord**, puis `git fetch origin && git status`, puis `npm test`.
2. Branche de travail créée **dès le début** de chaque phase et **poussée tôt** ; PR **draft
   ouverte tôt** (`gh pr create --draft`) → l'état survit à la mort de la session.
3. **Commits petits et fréquents**, push après chaque unité de travail ; message = état.
4. À chaque jalon : mettre à jour `CONTEXT.md` + `docs/TASKS.md` et committer (checkpoint).
5. Tâches suivies à la fois dans l'outil de todo de la session **et** dans `docs/TASKS.md`
   (le fichier gagne — il survit).
6. Merge dans `main` par fast-forward push (`git push <token-url> <branche>:main`) — les
   outils de merge gh sont bloqués dans le sandbox ; la PR passe alors MERGED automatiquement.
   Surveiller `gh run list --branch main` (workflow « Deploy to GitHub Pages ») jusqu'à
   `success`, puis vérifier le site (200 sur `/`, GLB, draco, fonts, GIFs).
7. Assets lourds (zip BodyParts3D ~136 Mo, debs chromium, polices) restent en `/tmp` mais
   **re-téléchargeables** via les procédures documentées (README + ADR 002) : ne jamais les
   considérer comme de l'état.
8. Ne jamais exposer de secret ; push uniquement via
   `https://x-access-token:${GH_TOKEN}@github.com/arcodange-org/dance-hips-movement-3D-comparison.git`.

## Procédure de reprise de session (checklist)

```bash
git fetch origin && git checkout <branche-en-cours> && git status
npm test && npm run build          # sanity
cat CONTEXT.md docs/TASKS.md      # état + prochaines tâches
gh pr list --state open --repo arcodange-org/dance-hips-movement-3D-comparison
gh run list --branch main --limit 3 --repo arcodange-org/dance-hips-movement-3D-comparison
# reprendre la première tâche non cochée de docs/TASKS.md
```

## Conventions verrouillées (ne pas casser)

- Hiérarchie glTF : `Skeleton → Pelvis → HipPivot_R/L → Femur → KneePivot → Tibia/Fibula/Patella
  → AnklePivot → Foot_R/L`. Le code anime `r.hipR/L, r.kneeR/L, r.footR/L, r.root`.
- Métriques (`anatomy_meta.json`) : HIP_Y = 0,8835 m, inter-hanches 0,168 m, hanche→genou
  0,440 m, genou→cheville 0,389 m, HIP_WIDTH = 0,34 m. **Clamp sol** `root.position.y >= 0`.
- Pieds plats : `foot.rotation.x = -(hip.x + knee.x) + extra`. Déplacement 0 = sur place,
  1 = ±17 cm avec IK de pas. Modes Solo / Observation hanche / Comparaison / Face à face.
- Animation **paramétrique f(temps)** (pas de mocap). Réglages persistés (localStorage).
- **Attribution obligatoire** : maillages BodyParts3D v4.0, © DBCLS, **CC BY-SA 2.1 Japan**
  visible dans l'app et le README. Police embarquée : sous-ensemble DejaVu (Bitstream Vera).

## Environnement sandbox (rappels)

- Node 22, npm OK. Pas de curl ; python urllib OK. Chromium headless : `LD_LIBRARY_PATH=/tmp/debs/root/usr/lib/x86_64-linux-gnu`, args `--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader`, et `FONTCONFIG_FILE=/tmp/fontconfig/fonts.conf` (dir DejaVu) sinon aucun texte n'est rendu. ffmpeg-static **sans drawtext** → habillage des GIFs rendu par la page (`?demo=`).
- `vite preview --port 4173` pour les captures (`npm run capture`, `CAPTURE_BASE` pour changer).
- gh : `pr create/ready/view/list`, `run list/view` OK ; mutations API et merge bloqués →
  ff-push `branche:main`.
