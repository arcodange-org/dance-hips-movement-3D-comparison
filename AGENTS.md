# AGENTS.md — Comparateur 3D des styles de danse

## Workflow de contribution (consignes du propriétaire, en vigueur)

Ces consignes remplacent les anciennes procédures « ff-push sur `main` » des phases Vibe.

- **Trunk réservé** : le checkout principal reste sur `main`, synchronisé avec `origin`. Tout travail
  d'agent se fait dans un worktree (`.claude/worktrees/<slug>` ou `.Codex/worktrees/<slug>`) sur une
  branche `arcodange/<slug>`.
- **Issue d'abord**, publiée avant le code pour réserver le périmètre ; **spec poussée en premier**
  (`docs/spec-*.md`), puis code, tests, captures.
- **Une PR par chantier**, qui ferme ses issues (`Closes #N`). La branche est **gelée** tant que la PR
  est ouverte ; un travail dépendant part de cette branche et s'annonce « Stacks on #N ».
- **Fusion** : uniquement avec l'accord du propriétaire, CI verte et commentaires résolus (merge
  commit, pour préserver les empilements). Vérifier ensuite le run `main` et le site Pages.
- Ne jamais construire ni afficher d'URL contenant un token ; utiliser `origin` et le gestionnaire
  d'identifiants Git.

Modules des figures en paire : [sortie garçon](docs/spec-sortie-garcon.md) (`src/sortieGarcon.ts`,
`scripts/test_sortie_garcon.mjs`), [sortie fille](docs/spec-sortie-fille.md) (`src/sortieFille.ts`,
`scripts/test_sortie_fille.mjs`), [quarts de tour en paire](docs/spec-quarts-paire.md) (`src/quartsPaire.ts`,
`scripts/test_quarts_paire.mjs`), [ida e volta en paire](docs/spec-ida-paire.md) (`src/idaPaire.ts`,
`scripts/test_ida_paire.mjs`), [marche en paire et flèches du mode jeu](docs/spec-jeu-fleches.md)
(`src/marchePaire.ts`, `scripts/test_marche_paire.mjs`), [enchaînement sortie fille → sortie garçon](docs/spec-enchainements.md)
(`src/enchainement.ts`, `scripts/test_enchainement.mjs`), [ida inséré dans les sorties](docs/spec-insertion-ida.md)
(`src/insertion.ts`, `scripts/test_insertion.mjs`), [ida e volta à tout pas qui avance ou recule](docs/spec-ida-partout.md)
(#144, R27 : `sampleTouched`, table `TOUCH_POSITIONS` des positions validées sur le GLB, `scripts/test_touches.mjs` ;
un segment du mode jeu porte ses allers-retours, il n'y a plus de figure « sortie avec ida »). Poids de l'ida (#210, [spec](docs/spec-ida-poids.md)) : trois quarts sur le pied sorti, ginga continu et bassin qui ne s'arrête jamais (`IDA_WEIGHT_ELECTED`, `idaGingaWindows`, `IDA_FLOW` ; garde de vitesse dans `test_ida_paire`) ; mesures `scripts/mesure_ida_ginga.mjs`, `scripts/mesure_vitesse_bassin_ida.mjs`, tracé `scripts/tracer_bassin_ida.mjs`. Marche des pas de figure, fin en quinconce et plexus :
[spec](docs/spec-marche-naturelle.md) (`src/gait.ts`, `scripts/test_plexus.mjs`). Le combiné `sortieGF` reste historique. Virgula du leader
(pied G posé perpendiculaire, #127) : premier pas de la sortie fille crochet, sonde de calibrage `scripts/search_virgula.mjs` ; en option dans
l'ida e volta en paire (#128, `virgula=1`, `scripts/test_ida_virgula.mjs`). Oracle :
[contrat](docs/spec-phase18-oracle.md) ; `scripts/oracle_assertions.mjs` centralise les gardes finies
et les comparaisons de quaternions ; ne pas réintroduire une comparaison d'une fonction de mouvement
avec elle-même comme preuve de continuité ou de chorégraphie. [Éditeur futur](docs/spec-editeur-figures.md).
Son synthétisé : [spec](docs/spec-son-synthese.md) (`src/music/`, `scripts/test_music.mjs`) ; grilles = données
sourcées de `docs/musique/`, chaque piste garde son niveau de preuve ; son coupé, l'horloge reste inchangée.
Musique enregistrée générée par IA (#142) : [spec](docs/spec-musique-elevenlabs.md) (`src/music/loop.ts` pur, `loopOutput.ts`,
registre généré `src/music/recordings.data.ts`, pistes `public/musique/`, `scripts/generer_musique.mjs`, `scripts/tempo.mjs`,
`scripts/test_musique_enregistree.mjs`) ; la clé ElevenLabs ne s'écrit nulle part, une prise coûte des crédits : accord du propriétaire.
Vitrine (#150) : [spec](docs/spec-vitrine-danse-auto.md) (`src/vitrine.ts` pur, `?vitrine=1` ouvre la vue du mode jeu en danse
automatique, en musique, au tempo de la piste ; `scripts/test_vitrine.mjs`).
Jeu et vitrine sur téléphone (#186) : [spec](docs/spec-jeu-telephone.md) ; commandes en trois dispositions (téléphone tenu droit, couché, écran large :
`src/jeuHud.ts` pur, `src/components/jeu/`), rien n'est posé sur le couple (`CadreLibre`), boutons de 44 px au moins ; `docs/features/jeu-telephone.feature` ;
l'interface réelle se mesure dans un navigateur avec les profils de téléphone de Playwright : `scripts/mesure_jeu_telephone.mjs` (hors `npm test`).
Page principale (#192) : [spec](docs/spec-page-scene-panneau.md) ; la scène toujours visible, sa barre de lecture, les réglages dans un panneau à tiroirs ;
onglets « Seul · Comparer · En couple · Jeu » (`src/page.ts` pur : inventaire `COMMANDES` des commandes et de leur place, `src/components/page/`) ;
chaque commande porte son nom (`data-commande`) ; `docs/features/page-scene-panneau.feature` ; mesure dans un navigateur : `scripts/mesure_page.mjs` (hors `npm test`).
`src/App.tsx` garde l'état, la lecture de l'adresse, la scène et la vue `bare=1` ; aucun paramètre d'URL renommé.
Haut du corps anatomique (#176) : [spec](docs/spec-haut-du-corps.md) ; option `haut=1` : os et muscles du buste, des bras et des mains
(`public/anatomy_upper.glb`, `scripts/build_upper_body.mjs`, `src/upperBody.ts` pur, `src/components/UpperBodyLayer.tsx`,
`scripts/test_upper_body.mjs`) ; la main anatomique vient où le rig pose la sienne ; le rig publie la couche dans `rig.upperBody`.
Cadre des bras (#40, [spec](docs/cadre/spec-implementation.md), `src/cadre.ts`, `scripts/test_cadre.mjs`) : le bras droit du guideur ne se baisse pas (#178, R35) ;
main gauche de la suiveuse sur l'épaule droite du guideur, coude vers son bras (#180, R37) ; paume droite du guideur sur l'omoplate de la suiveuse, dont le bras passe par-dessus (#185, R38 : `BACK` dans `src/upperBody.ts`, mesure `scripts/mesure_cadre_bras.mjs` ; coude levé choisi le 23 novembre, #190) ; prise des mains (#179, R36) : attitude choisie le 23 novembre (mains sur le côté, emboîtées), candidat restant `?essai=mainsBasses` ; tenue choisie le 24 novembre (#199, R41, `SKYWARD`, `TENUE`) : main du guideur en plateau, pouce visible, coude de la suiveuse qui retombe ; la tenue sur le côté en option `?tenue=cote`
([dossier](docs/elections/2026-11-22-mains/README.md)), doigts et poignet articulés dans le haut du corps (`HAND_SHAPES`, `GRIP`, `src/upperBody.ts`) ;
emboîtement des mains : sonde de calibrage `scripts/search_prise_mains.mjs` (deux mains humaines, ou deux mains décrites en fichier avec leur chair, #183 : `UpperBody.grip`), mesure `scripts/mesure_essai_mains.mjs` (jeu entre les os des deux mains).
Mode jeu (#140, [spec](docs/spec-jeu-file-auto.md)) : les commandes s'empilent dans une file (plus de note ni
de refus), Espace bascule entre l'écoute et la danse automatique (tirage reproductible par graine) ; un plan
ne réécrit jamais son passé. Hasard tenu (#152) : le tirage se souvient des figures et des paires récentes
(`GUIDE_VARIETY`, `hasard=libre|tenu|strict`), toujours fonction pure de la graine et de l'historique.
Ginga du couple (#157, [spec](docs/spec-ginga-couple.md)) : option `ginga` de `applyPose`, activée par le mode jeu
(`GUIDE_GINGA`, `ginga=sans|discret|marque|ample`) ; phase lue sur les appuis du leader (`gingaPhase`), poursuivie d'une figure à la suivante (`gingaFrom`, #167), les figures
déclarent où il s'efface (`gingaRoom`, `gingaCap`, et la place au-dessus du plafond `gingaCapRoom`, #163) et leurs jonctions (`gingaJunctions` : une figure modifiée à une
jonction garde son passé) ; `scripts/test_ginga_couple.mjs`. Calibré à l'amplitude 1. [Aperçu des réglages](docs/elections/ginga-couple.md) ;
le « 8 » des hanches (#159, [spec](docs/spec-ginga-huit.md)) : prototypes `GUIDE_EIGHT` à élire
([élection](docs/elections/ginga-huit.md)), non contrôlés sur le GLB, `scripts/test_ginga_huit.mjs` ; tracé des
hanches dans les trois vues : `scripts/tracer_hanches.mjs` ; GIF du mode jeu en un seul chargement de page :
`scripts/capture_session_gif.mjs`. Kompa (#161) et semba (#162) : leur pas de base, danseur seul sur place, est le pas élu
(`KOMPA_ELECTED`, `SEMBA_ELECTED` ; drapeau `base` de `StyleDef.apply`) ; variantes par `?kompa=`, `?semba=` (`ancien` : avant les
votes) ; en couple et en déplacement, l'ancien modèle ; le traceur mesure aussi les genoux et la posture. Le kompa seul
se danse sur un temps par appui (#195, R40 : `KOMPA_BEATS`, `kompaBeat` ; `?kompa=deuxTemps` : le pas tel que voté).
Pas de base « 1 2 » de la kizomba et du semba seuls (#196, R42, [spec](docs/spec-pas-de-base-1-2.md)), élu le 24 novembre : `UM_DOIS_ELECTED`
(`src/umDois.ts` pur, `applySit` et `UM_DOIS` dans `src/styles.ts`, `scripts/test_um_dois.mjs`) ; l'ancien pas est la figure « Sur place » (`surPlace`).
La hanche porte le pas de côté (#209, R45, [spec](docs/spec-un-deux-geste.md)), élu le 25 novembre : la hanche d'abord (`UM_DOIS_GESTURE_ELECTED`, `?geste=` pour les autres lectures) ;
relevé des figures où le pied part avant le bassin : `scripts/sonde_geste_hanche.mjs`.
Suave seul, sur place : deux temps par côté, sans rebond (#200, R44, [spec](docs/spec-suave-deux-temps.md), `SUAVE_SLOW`) ; en couple, l'ancien modèle.
Jamais de jambe tendue (#203, R43, [spec](docs/spec-flexion-minimale.md)) : 30° de flexion au moins (`KNEE_FLOOR_ELECTED`, élu le 24 novembre) ;
le couple se tient plus loin (`COUPLE_DZ`, `KNEE_ROOM`, `src/placement.ts`) ; croisements d'os en couple : `scripts/sonde_croisements_couple.mjs` (hors `npm test`, `REGLAGE` pour essayer un réglage).
Transfert de poids continu (#167, R34 : ni saccade, ni téléportation, ni relais soudain) : [spec](docs/spec-transfert-continu.md) ;
`scripts/test_saccades.mjs` mesure, dans des séances du mode jeu, les à-coups du bassin de chaque figure et le passage d'un côté
à l'autre ; l'état est enregistré (`scripts/fixtures/saccades.json`, cliquet ; `WRITE=1` après un changement voulu).
Exercices d'isolation (#206, lot L441 de ReCoDanse) : [spec](docs/spec-isolations.md) ; `?isolation=<exercice>` (cou, poitrine,
bassin), danseur seul pieds posés, seule la partie nommée bouge, en boucle (`src/isolations.ts` pur, option `isolation` de
`applyPose`, `scripts/test_isolations.mjs`, `docs/features/isolations.feature`, films `scripts/capture_isolation_gif.mjs`) ; trois vitesses
par boucle, amplitude moyenne, le huit qui alterne glisse et tourne, élus les 24 et 25 novembre (`docs/elections/2026-11-24-isolations/`).
Mode guidage (PoC #69) : [spec](docs/spec-mode-guidage-poc.md) (`src/guidage.ts` pur, `src/guidagePose.ts`,
vue `src/components/GuidageApp.tsx`, `scripts/test_guidage.mjs`) ; recherche : [jeux vidéo](docs/recherche-jeux-video/README.md).

Explications des transitions (leader engagé, suiveur reçu, contacts) : [spec](docs/spec-transitions.md)
(`src/transitions.ts` pur, `src/components/TransitionCard.tsx`, `scripts/test_transitions.mjs`).

Règles de mouvement du propriétaire, consolidées et vérifiables : [`docs/regles-proprietaire.md`](docs/regles-proprietaire.md).

Décision de mouvement en attente du propriétaire (#148) : filmer les candidats et les lui faire élire
([spec](docs/spec-elections-variantes.md), [procédure](.vibe/CONTRIBUTING.md), `src/essais.ts` : `?essai=` inerte sans
le paramètre, `scripts/mesure_essai_*.mjs`, `docs/elections/`). Rien n'est implémenté avant son vote.
Premier tour voté (21 novembre) : en paire la ligne de danse passe par les deux danseurs (R6 réécrite) ; hors
figure, le cercle du corridinho se marche pied déroulé (`plannedFeet`, `scripts/test_marche_deroulee.mjs`,
[spec](docs/spec-marche-naturelle.md)) ; l'ida e volta en paire garde le pied opposé du suiveur.

**Lire ce fichier en premier dans toute session.** Le harness complet pour travailler sur ce projet
en autonomie (méthode anti-amnésie, conventions, contribution agentique) est dans **[`.vibe/`](.vibe/)**
— commencer par [`.vibe/HARNESS.md`](.vibe/HARNESS.md), puis [`.vibe/CONTRIBUTING.md`](.vibe/CONTRIBUTING.md)
et [`.vibe/CONVENTIONS.md`](.vibe/CONVENTIONS.md). L'état courant du projet est dans
[`CONTEXT.md`](CONTEXT.md), la liste des tâches dans [`docs/TASKS.md`](docs/TASKS.md).

## Projet

App web 3D (Vite + React 19 + @react-three/fiber 9 + drei 10 + three 0.187 + TypeScript strict +
Tailwind 3) qui compare visuellement six styles de danse (kizomba, semba, kompa, tarraxinha, suave,
zouk brésilien), animés paramétriquement f(temps) — pas de mocap. Déployée sur GitHub Pages :
https://arcodange-org.github.io/dance-hips-movement-3D-comparison/

**Objectif premier** : discerner les **isolations du bas du corps** — au-dessus du bassin, le haut
du tronc compense le roulis du bassin (`iso=1` par défaut), avec pitch du style conservé. Voir
[`docs/ginga-angolana.md`](docs/ginga-angolana.md) (sources FR/EN/PT, citations verbatim).

## Règles d'or (résumé — le détail dans `.vibe/`)

1. **Anti-amnésie** : aucun état important qu'en mémoire — tout vit dans le dépôt (CONTEXT.md,
   docs/TASKS.md, docs/spec-*.md, docs/adr/*) et sur GitHub (branche + PR poussées tôt).
   Démarrage de session : `cat AGENTS.md CONTEXT.md docs/TASKS.md && git fetch origin && git status && npm test`.
2. **Spec d'abord** (`docs/spec-phaseN-*.md` + tâches dans `docs/TASKS.md` + branche + PR draft
   ouverts tôt), puis code, puis validations Gherkin (`docs/features/*.feature` dans `npm test`),
   puis captures GIF, puis livraison.
3. **Conventions verrouillées** : voir [`.vibe/CONVENTIONS.md`](.vibe/CONVENTIONS.md) — ne jamais
   les casser (hiérarchie GLB, métriques, sommets osseux au-dessus du sol, pieds plantés par défaut, attribution
   BodyParts3D **CC BY-SA 2.1 Japan © DBCLS** visible dans l'app et le README).
4. **Livraison** : voir « Workflow de contribution » ci-dessus (PR, fusion par le propriétaire).
   **Garantie de non-régression** : la CI (`.github/workflows/deploy.yml`) exécute le job `test`
   (`npm ci && npm test && npm run build`) à chaque push sur `main` **et chaque PR** ; le déploiement
   Pages (`build`/`deploy`) n'a lieu que si `test` passe (`needs: test`).
5. **Jamais de secret** en clair (ni token dans une URL de remote ou un log).

## Moteur et preuves des poses finales

`src/pose.ts` applique la pose complète du GLB ; `src/clock.ts` et `DanceTransport` fournissent
une horloge commune. `Rig.tsx` conserve le montage et l’apparence. `src/rigJoints.ts` partage les
positions du buste entre rendu et fixture. `npm test` exécute courbes, Gherkin, oracle **et** poses
finales (`scripts/test_poses.mjs`, GLB réel). Voir [la spec #17](docs/spec-audit-poses-finales.md).
Le bassin peut descendre : l’invariant sol porte sur les sommets et les semelles, jamais sur
`root.y >= 0`. Longueurs osseuses constantes ; HUD après IK ; appuis illustratifs, proximité
sans simulation de contact. Ces tests ne constituent pas une validation chorégraphique.

## Maintenance de ce fichier (AGENTS.md)

- **Toute session qui touche à la structure du projet, aux commandes, aux conventions ou au
  workflow de livraison met à jour ce fichier dans le même commit** (et `.vibe/*` si le harness
  change).
- Garder AGENTS.md **court** (règles d'or + pointeurs) : l'état courant vit dans `CONTEXT.md`,
  les tâches dans `docs/TASKS.md`, les specs dans `docs/spec-*.md` — ne pas les dupliquer ici.
- Si un nouveau type de tâche récurrent apparaît (ex. nouvelle phase, nouveau type de capture),
  documenter le process dans `.vibe/CONTRIBUTING.md` et le référencer ici en une ligne.
- Ne jamais supprimer les règles d'or sans les remplacer explicitement ; l'attribution
  **CC BY-SA 2.1 Japan © DBCLS** doit rester mentionnée ici, dans le README et dans l'app.
