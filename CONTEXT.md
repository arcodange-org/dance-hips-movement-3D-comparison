# CONTEXT.md — état du projet et méthode anti-amnésie (cross-session)

Ce fichier est la **source de vérité** pour reprendre le travail dans une nouvelle session.
Règle d'or : **aucun état important uniquement en mémoire ou dans /tmp** — tout vit dans ce
dépôt (ce fichier, `docs/spec-*.md`, `docs/adr/*`, `docs/TASKS.md`, README) et sur GitHub
(branche + PR), poussés tôt et souvent.

## Atlas anatomique ouvert #132 (21 novembre 2026)

Branche `arcodange/atlas-anatomique`, worktree `.claude/worktrees/atlas-anatomique`, PR #139 (Draft,
à jour avec `main` par fusion). Demande du fondateur : produire nous-mêmes un équivalent
d'anatobase.com à partir de données ouvertes (format inspiré, jamais de contenu copié : la licence
AnatoBase est « reference-only » et ce dépôt est public).

Livré : PRD [docs/spec-atlas-anatomique.md](docs/spec-atlas-anatomique.md),
[ADR 005](docs/adr/005-atlas-donnees-ouvertes.md) (BodyParts3D CC BY-SA 2.1 Japan © DBCLS,
Z-Anatomy CC BY-SA 4.0, Gray 1918 domaine public, Wikidata CC0), [manifeste v1](docs/atlas/manifest.json)
(16 mouvements) + `scripts/test_atlas_manifest.mjs`.

Chaîne de génération des planches « mouvements », prouvée sur `bassin-obliquite`
([planche et mesures](docs/atlas/mouvements/bassin-obliquite/README.md)) :

- `applyPose` a une option `neutral` (pose neutre anatomique, défaut inchangé). `src/atlas.ts` (pur)
  pose un mouvement du manifeste et le mesure ; le bassin est en chaîne fermée, pieds plantés.
- Vue `?atlas=<id>&vue=&frame=&frames=&muscles=` (`src/components/AtlasApp.tsx`, morceau séparé),
  cinq vues `ATLAS_VIEWS` dans `src/cameras.ts`, signal de rendu `data-atlas-rendu`.
- `npm run build && node scripts/capture_atlas.mjs --mouvement <id>` : images, GIF, planche,
  `meta.json` (calculé hors navigateur sur le GLB, déterministe), `README.md`. Le script sert `dist/`
  lui-même sur un port libre. Sur ce Mac : `CHROME_PATH` vers le Chromium 1228 de Playwright.
  Régénérée deux fois sur cette machine, la planche est identique à l'octet près.
- `scripts/test_atlas_planches.mjs` dans `npm test` : ROM sur le quaternion monde du nœud, preuve par
  les positions des hanches, conventions verrouillées, fraîcheur de `meta.json` (une planche périmée
  par le moteur échoue, avec la commande à relancer), intégrité des fichiers.
- Le manifeste v1 inversait les axes du bassin (obliquité = z, antéversion = x) : corrigé.

Mesuré de −10° à +10° : hanches de −28,4 à +30,1 mm, genou du côté bas jusqu'à 31°, thorax vertical.

Les trois planches du bassin sont générées ([spec D13](docs/spec-atlas-anatomique.md)) :
[obliquité](docs/atlas/mouvements/bassin-obliquite/README.md),
[rotation](docs/atlas/mouvements/bassin-rotation/README.md) (−15° à +15° : une hanche avance de
43,9 mm, l'autre recule) et [antéversion](docs/atlas/mouvements/bassin-anteversion/README.md)
(−15° à +15° : le centre du sacrum passe de 30,1 à 51,1 mm au-dessus de l'axe des hanches, les
jambes ne bougent pas).

- Dans les trois, le thorax garde son orientation neutre. **`lockUpperTrunk` (`iso=1`) ne compense
  pas le lacet**, seulement le roulis et le tangage : pour la rotation, la règle de pose de l'atlas
  contre-tourne la colonne (`trunkOffset`). Sans cela le buste tournait avec le bassin (trouvé à la
  relecture des images ; `thoraxDeg`, une inclinaison, ne le voyait pas). Le comparateur n'est pas
  modifié : le thorax y suit le lacet du bassin (tarraxinha 12,7°, zouk 10,3°), question posée au
  propriétaire dans `docs/TASKS.md`.
- `meta.json` porte en plus l'avancée des hanches, la position du sacrum et la rotation du thorax
  tous axes. Chaque planche affiche le repère de position de son axe. Le test prouve chaque planche
  par les positions (deux vecteurs liés au bassin en rotation rigide, axe erroné détecté).
- Deux élections attendent le propriétaire. Rotation : thorax de face (versionné) ou buste
  solidaire (GIF montrés, non versionnés). Obliquité : genoux en relais (versionné) ou chevauchés,
  bassin à hauteur constante. Cette seconde variante est produite (spec D14) :
  `applyAtlasPose(…, "chevauchement")`, vue `?atlas=bassin-obliquite&variante=chevauchement`,
  GIF côte à côte par `scripts/capture_atlas.mjs --variante chevauchement`, page de vote
  [`docs/elections/obliquite-genoux.md`](docs/elections/obliquite-genoux.md). Les planches
  versionnées ne changent pas tant que le vote n'est pas rendu.
- `main` a été fusionné quatre fois dans la branche (conflits : `package.json`, `README.md`,
  `docs/TASKS.md`, `CONTEXT.md`, `src/main.tsx` ; garder les deux côtés).

Suite : règles de pose des 13 autres mouvements (le script les refuse pour l'instant), décision sur
le poids versionné (≈ 2,5 Mo par mouvement, 7,4 Mo pour les trois planches du bassin), fiches muscles (prototype Blender hors dépôt :
`~/Work/Danse/anatomie-3d/`), sourcing des ROM, viewer `?atlas=` complet + branchement oracle.

## Vitrine : danse automatique en musique, lien direct (#150, 21 novembre 2026)

- `?vitrine=1` ouvre le mode jeu en danse automatique, au tempo de la piste enregistrée, muscles et
  buste lisibles, vue libre qui tourne, interface réduite ; bouton « Partager » (style et graine)
  ([spec](docs/spec-vitrine-danse-auto.md), `src/vitrine.ts`). Dans le mode jeu, la danse automatique
  prend aussi le tempo de la piste et affiche les muscles.
- Destiné à être intégré sur un autre site par Arcodange (fragment `iframe` dans la spec).
  **Hors périmètre, prévu plus tard** : les mascottes Rémi et Corinne à la place des corps.
- La branche part de la musique (#143) : la PR s'annonce « Stacks on #143 » tant que celle-ci est ouverte.

## Musique enregistrée générée par ElevenLabs (#142, PR #143, 21 novembre 2026)

- Le bouton « Son » joue une boucle enregistrée par style quand elle existe, sinon la synthèse
  ([spec](docs/spec-musique-elevenlabs.md)). **Aucune piste publiée** : la prise 1 de la kizomba
  (prompt du propriétaire) a été refusée à l'écoute — « ça ressemble plus à de la techno qu'à de la
  kizomba semba angolaise » — et retirée de la branche.
- Le propriétaire a retenu la **variante C** (fusion kizomba et semba) sur extraits de 15 s. La
  première prise complète (un bloc de 62 s) est revenue **silencieuse** : échec de génération,
  775 crédits perdus. Les prises complètes sont maintenant demandées en sections de 32 temps.
  Redemandée ainsi, la prise est bonne à l'analyse (101,996 bpm, groove constant, boucle de
  96 temps) et publiée dans la branche.
  Le propriétaire l'a **validée à l'écoute** (« Oui, elle convient »).
- **Suite** : les cinq autres styles, par la même méthode (variantes en plan de composition,
  extraits de 15 s, choix à l'oreille, prise en sections de 32 temps — détail dans la spec).
  Ne rien générer sans l'accord du propriétaire (environ 965 à 1 340 crédits par style).
- Commandes : `node scripts/generer_musique.mjs --plan` (sans réseau) ; avec la clé,
  `node --env-file=<fichier d'environnement> scripts/generer_musique.mjs --essais kizomba`, puis
  `--styles kizomba --variante kizomba=<lettre>` (la clé n'est pas dans le Vault ; ne jamais
  l'écrire ni l'afficher). Sans crédits : `--analyse`, `--decaler`, `--temps`.
- Pièges : un générateur respecte le tempo demandé à peu près — toujours mesurer ; une musique
  syncopée ne pose pas une attaque sur chaque temps (la confiance se lit par quart de morceau) ;
  le temps 1 se déduit de la structure (début, changement de section, fin) ; un prompt sans époque
  ni type de production dérive vers le plus probable (ici, l'électronique) : dire aussi ce qu'on
  ne veut pas (plan de composition), et lire la signature rythmique avant de faire écouter ;
  l'API peut rendre un fichier silencieux sans erreur (vérifier le niveau avant tout) ; le coût
  réel se lit sur le compteur de l'abonnement (750 crédits par minute mesurés, pas 900).

## Chantiers du 21 novembre 2026 : quarts, sortie garçon D2, GIFs avec muscles, virgula

Depuis le 20 novembre, l'état de chaque chantier vit surtout dans les issues (commentaires « Reprise »)
et les specs. Résumé de la journée du 21 :

- **#126 (PR #131, fusionnée)** : quarts de tour, début fluidifié ; le buste suit le bassin avec
  0,25 temps de retard ([spec](docs/spec-quarts-paire.md)).
- **#130 (PR #133, fusionnée)** : sortie garçon, pieds D tout près en position 2 (3,8 cm), genoux D à
  11 cm, bassin du leader 6 cm derrière son D. R9 tranchée contre #104
  ([spec](docs/spec-sortie-garcon.md)). Reste ouvert : buste légèrement en avant en permanence (#93).
- **#129 (PR #134, fusionnée)** : GIFs du README avec la couche des muscles. Règle : toute capture de
  figure se fait avec `muscles=1`.
- **#127 (PR #135, fusionnée)** : sortie fille, variante crochet : le G1 du leader est une **virgula** (pied posé
  perpendiculaire, talon contre le bord intérieur du D, bassin ouvert de 10°, buste inchangé, suiveur
  inchangé) ([spec](docs/spec-sortie-fille.md), règle R26). Sonde : `scripts/search_virgula.mjs`.
- **#128 (PR #136, fusionnée)** : la même virgula en option dans l'ida e volta en paire (`virgula=1`, case à cocher),
  `scripts/test_ida_virgula.mjs` ([spec](docs/spec-ida-paire.md)).
- **#140 (PR #141)** : mode jeu. Les commandes s'empilent dans une file (notes, série et refus retirés),
  le couple danse dès l'ouverture, Espace bascule vers la danse automatique (figure tirée à chaque position
  neutre, choix aux jonctions des sorties, position neutre cherchée toutes les 32 temps, graine
  reproductible `graine=N`, `auto=1`). `src/guidage.ts` : `planGuide(commandes, motions, until, { modes,
  seed, offered })`, `GUIDE_AUTO`, `autoFigure` ; un plan ne réécrit jamais son passé
  ([spec](docs/spec-jeu-file-auto.md)).
- **#144 (PR #145)** : règle R27 du propriétaire, « chaque pied qui avance ou qui recule peut devenir un "ida e
  volta" (un simple aller retour du pied, en virgula ou non) ». `src/insertion.ts` : `sampleTouched` ajoute un
  aller-retour (2 temps, en touche) avant un pas d'une figure ; `TOUCH_POSITIONS` liste les 13 pas validés sur le
  GLB (plus 3 positions de l'enchaînement) avec leurs ajustements. Mode jeu : un segment porte ses allers-retours
  (`segment.touches`), la touche de l'ida vise le prochain pas possible (figure en cours, sinon figure en attente),
  Maj = virgula, la danse seule tire les mêmes choix. Restent à trancher par le propriétaire les pieds de la
  suiveuse (le même pied que le leader ou le pied opposé, issue #86 ; et ce qu'elle fait quand elle allait de
  côté) : voir « Questions en attente » de [la spec](docs/spec-ida-partout.md) ; le D4 de la sortie
  garçon n'est pas proposé (jambes croisées).
- **#152 (PR #154)** : hasard tenu de la danse seule. `autoFigure` reçoit l'historique des figures ; `GUIDE_VARIETY`
  (`libre`, `tenu` par défaut, `strict`) pèse les figures et les paires dansées récemment et borne les séries.
  Mesures avant et après dans [la spec](docs/spec-jeu-file-auto.md). Le propriétaire doit élire le réglage en
  regardant (`?auto=1&graine=7&hasard=…`).
- **Élection #86 (PR brouillon #153)** : pieds de la suiveuse dans l'ida e volta, deux questions en GIF
  (`docs/elections/suiveuse-ida.md` sur la branche `arcodange/election-suiveuse`), en attente de son vote.
- PR brouillon en relecture du propriétaire : #117 (ontologie), #76 (audit).
- Pièges : `npm test` complet dure 25 min ou plus en local. Lancer ses scripts en parallèle, un journal
  par script, le ramène à une dizaine de minutes ; `test_placements` et `test_plexus` rejouent d'autres
  scripts sous les mêmes noms de bundle : une erreur d'import peut être une collision, relancer le script
  seul. Les captures GIF échouent si la machine est très chargée : les lancer une par une.
- CI de `main` : un seul run tourne et un seul attend. Après deux fusions rapprochées, le run en attente
  de la première est annulé (« cancelled ») au profit de celui de la seconde, qui contient les deux : c'est
  ce dernier run qu'il faut vérifier (tests, build, déploiement).
- **#137** : GIFs du mode guidage, de l'enchaînement, des flèches et du ginga refaits avec les muscles ;
  la vue du mode guidage lit `muscles=1`.

## Preuve de concept du mode guidage #69 (20 novembre 2026)

Branche `arcodange/mode-guidage-poc`, PR #70 empilée sur #65 (Draft). `?mode=pair&guidage=1` : le joueur
(leader) choisit au clavier la figure suivante ; elle part à la prochaine frontière depuis la quinconce
(pas de base = sur place en paire `src/placePaire.ts`, #61 ; sortie tous les 4 temps). `src/guidage.ts` (pur) : intentions horodatées
→ segments, repère du couple composé, notes de placement, rejeu exact. `src/guidagePose.ts` : écarts de
bassin (racine, hauteur, pose) aux frontières mesurés sur le danseur et effacés en 1 temps avant l'IK
(sans cela, 3 cm au genou en tarraxinha : les figures n'ont pas la même hauteur de bassin, à relier à #67).
`scripts/test_guidage.mjs` dans `npm test`. [Spécification et rapport](docs/spec-mode-guidage-poc.md).

## Recherche jeux vidéo et mode guidage #63 (20 novembre 2026)

Documentation seule (#63, PR #65, Draft : porte de compréhension). `docs/recherche-jeux-video/` :
le réalisme des jeux de sport vient des données (motion matching, HyperMotion), inapplicable sans
capture ; trois emprunts recommandés : machine à états de figures calée sur le temps avec la
quinconce comme état pivot, transferts d'appui déclenchés et jugés comme un jeu de rythme (suite du
ginga #42), inertialisation des transitions hors quinconce. Concept d'un mode guidage en trois
niveaux et questions ouvertes au propriétaire dans le README du dossier.

## Ida e volta en paire #54 (19 novembre 2026)

Branche `arcodange/ida-paire`, PR #55 (draft, base `main` depuis la fusion de #52). En paire, `idaPaire: true` (activé par l'app
quand le placement est donné) remplace le même pas des deux danseurs par un pas balancé du couple
(`src/idaPaire.ts`) : le leader avance pendant que le suiveur recule avec le pied opposé, dans le même
couloir, puis retour au quinconce (temps 4 et 8). Pas de marche `gaitStep` (roulé 30 %), le pied qui
recule part 0,5 temps avant, pied G ouvert de 2 cm, genoux et bassin du style plafonnés (0,3 / 0,06 rad),
lacet de bassin de la phase 15 réduit de moitié : 0 croisement d'os, avec ou sans plexus. Bassins
ensemble : contact plexus tenu avec contraposition. Six transferts d'appui explicites par cycle
(`idaTransfers`, `support`, `transfer`) : point d'accroche du ginga (#42).
`scripts/test_ida_paire.mjs` dans `npm test`. [Spécification](docs/spec-ida-paire.md).

## Pas plus courts #56 (20 novembre 2026)

Sortie garçon : seule la progression du couple le long de la ligne est réduite (70 %, tables
d'affectation par atterrissage dans `SORTIE_GARCON_TRAVEL`), sans pied qui glisse. Pas du leader 27 à
31 cm (G3 croisé 40 cm), du suiveur 17 à 33 cm (D3 54 cm) ; plus court, pieds ou os se croisent
(`scripts/search_pas_courts.mjs`). Le passage du suiveur pendant le croisé est une décision
chorégraphique en attente. [Spécification](docs/spec-pas-courts.md).

## Fin en quinconce, marche naturelle, contact des pieds D, plexus #48 #49 #50 #51 (19 novembre 2026)

Branche `arcodange/marche-naturelle`. Les deux sorties finissent en position neutre (départ translaté :
quinconce, pieds sous les hanches, stagger du D), bassins recouplés dès le compte 3 (`endCoupling`).
`src/gait.ts` donne à chaque pas un cycle de marche (talon qui se lève, passage de jambe, attaque du
talon ou pose de l'avant-pied, pivot sans glissement) ; les pas croisés ou au contact roulent peu
(calibré sur le GLB, six styles). Sortie garçon : D2 bord à bord contre le D du suiveur (2,2 mm), G1
moins latéral ; le contact des cuisses descend au tiers inférieur (s ≈ 0,87). Option `plexus`
(app : « Plexus contre plexus », avec ou sans contraposition) : buste penché vers le partenaire
(rapprocher les bassins croise les jambes) ; `scripts/test_plexus.mjs` mesure l'indicateur (16 cm
garçon, 7,5–9,5 cm quarts, 15–21 cm fille : les distances des sorties restent trop grandes, #51) et
rejoue les runners en mode plexus. [Spécification](docs/spec-marche-naturelle.md).

## Son synthétisé #44 (19 novembre 2026)

Branche `arcodange/musique-synthese`, PR draft (sans fusion). Bouton « Son » éteint par défaut :
musique Web Audio par style d'après `docs/musique/` (grilles de 16 pas en données, niveau de
preuve par piste), planification 120 ms à l'avance, **horloge audio maîtresse** de `clock.beat`
quand le son est actif (`stepTransport` + pilote de `useMusic`), comportement inchangé sinon.
Choix A/B en comparaison ; `son=1`, `musique=A|B` en URL. `scripts/test_music.mjs` + Gherkin
`son-synthese.feature`. Choix provisoires (tempo global, 32 bpm, phases inchangées) listés dans
[la spec](docs/spec-son-synthese.md), à valider par le propriétaire avec une écoute.

## Quarts de tour en paire #37 (19 novembre 2026)

Branche `arcodange/quarts-de-tour`, PR #43. En paire, `quartsPaire: true` (activé par l'app quand
le placement est donné) remplace le miroir du suiveur par une rotation rigide du couple autour d'un
centre C du côté du leader (`src/quartsPaire.ts`). Ordre des appuis calibré sur le GLB (le D du
suiveur recule d'abord, le G du leader prend sa place, puis G du suiveur, D du leader), buste du
leader en avance de 0,25 temps, bassins qui tournent avec le second pied, genoux et style adoucis au
croisement. `scripts/test_quarts_paire.mjs` dans `npm test`. Points à valider : voir la spec.
[Spécification](docs/spec-quarts-paire.md).

## Recherche biomécanique (19 novembre 2026)

Documentation seule (#34, PR #35). `docs/recherche-biomecanique/` réunit
environ 50 sources FR/EN (pied, bassin, genou et hanche, danse de couple, kiné/ostéo) et une page de
confrontation paramètre par paramètre. Aucune étude biomécanique ne porte sur les six styles : les
comparaisons passent par la marche, la danse orientale, le tango et la danse de salon. Les points à
valider par le propriétaire sont listés en fin de `confrontation-modele.md`.

## Placements du couple #28 (19 novembre 2026)

Fusionné dans `main` (PR #33, 07794bd) et déployé.
Décisions du propriétaire : quinconce par défaut (jambes droites intercalées, demi-pointes au contact, genoux D
décalés, bassins couplés, pieds dans l'axe des genoux), arrivées relatives conservées,
seulement les deux sorties pour commencer, rapprochement atténué au-delà de l'amplitude 1.
`src/placement.ts` ; les échantillonneurs reçoivent un décalage de départ absorbé sans glissement.
`scripts/test_placements.mjs` rejoue les runners garçon/fille pour chaque placement.
Le moteur garde `placement: "reference"` par défaut, ce qui conserve les empreintes validées.
Vues comparables dans `docs/placements/`. Suite : quarts de tour en paire (#37).
[Spécification](docs/spec-placements-couple.md).

## Sortie fille #27 (19 novembre 2026)

Branche `arcodange/sortie-fille-sol` empilée sur #26 (base moteur `fa551c3`).
`sortieF` en paire utilise cinq actions et deux variantes pour le second pas.
Le leader amorce la sortie par le cadre. Le crochet accompagne un pas purement latéral du suiveur ;
le recul du leader accompagne une avancée diagonale du suiveur. Le troisième pas du suiveur avance en diagonale, puis aligne les chevilles droites côte à côte.
Le combiné reste historique. Les placements initiaux resserrés sont suivis séparément.
[Spécification, contrôles et limites](docs/spec-sortie-fille.md) · [Issue #28](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/28).

## Chantier oracle #25 (19 novembre 2026)

PR #24 fusionnée en `8e44b85`, déploiement Pages run `44413404026` réussi et vérifié.
Nouveau chantier : `.Codex/worktrees/oracle-corrections`, branche `arcodange/oracle-corrections`.
Issue #25 créée avant le code ; spec et note de sortie fille poussées dans le premier commit.
Contrat : `docs/spec-phase18-oracle.md` ; corrections : `docs/spec-oracle-corrections.md` ;
preuves : `docs/retrospective-oracle-corrections.md`. Une PR, sans fusion automatique.

Oracle quarts/ida indépendant des fonctions de styles, poses/cibles séparées, champs locaux
nommés explicitement ; API historique des sorties séparée. Bornes inclusives, reverse seulement
quarts, limites t±ε, orientations monde Kizomba par quaternions, assertions finies et cinq
mutants détectés. 792 poses d'oracle GLB ; suite complète, build et revue M4 réussis.
Assets JS/CSS identiques à #24. Aucun changement du rendu ou des trajectoires. La prochaine sortie fille
est décrite dans `docs/notes-sortie-fille.md`, sans implémentation à ce stade.

Les sections suivantes documentent les chantiers précédents.

## Sortie garçon #21 et spec éditeur #22 — historique

Base `2621e59`, branche `arcodange/sortie-garcon`, worktree `.Codex/worktrees/sortie-garcon`.
PR #24 ; `main` acd0cdd (M5, PR #23) intégré avant réouverture. Les deux nouveaux runners
coexistent ; le cas d'oracle latéral historique reste vérifié via l'option interne `sortie`.
Son runner échantillonne désormais réellement les pieds posés (669 assertions) ; le code
de l'oracle et le rendu de sortieF/sortieGF ne changent pas.
Séquence et clarification pieds du leader/partenaire validées par le propriétaire. Issues :
[#21](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/21),
[#22](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/22).
Specs poussées avant le code : `docs/spec-sortie-garcon.md`, `docs/spec-editeur-figures.md`.
Une PR demandée, sans fusion. Sortie fille/combiné hors périmètre ; éditeur = documentation.

- Plan coordonné en cinq actions, quatre transferts, croisé et marka sans transfert.
- Deux fins, contraposition réglable, arrêt final, poses sélectionnables, rejeu, partage et export.
- Corrections de revue M4 : bassin progressif aux actions 1/3, modulation de marche interrompue
  pendant le marka, dégagement des os mesuré sur triangles ; chargement sous Suspense,
  portée des paramètres/exports et remise à zéro des traces au seek/rejeu.
- Vérifications locales : 7 272 poses G, 2 052 poses de couple pour les os des jambes,
  576 références F/GF inchangées ; tests historiques et build réussis. Navigateur, chargement
  différé, partage et export vérifiés ; GIF ajouté. Voir `docs/retrospective-sortie-garcon.md`.
  Les paragraphes de phases ci-dessous sont historiques.

## État courant — corrections de l’audit #17

Base initiale : `3ccdc75` (phase 16) ; `main` `ce84acd` (PR #18, oracle) intégré avant
réouverture de la PR #19, en conservant les deux runners de tests. Issue créée avant le code :
https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/17.
Branche `arcodange/audit-poses-finales`, worktree `.Codex/worktrees/audit-poses-finales`.
Livraison demandée : une PR regroupée, sans fusion ni déploiement automatique de cette session.
La phase 17 reste hors périmètre ; la phase 18 provient de #18, sans modification de son oracle.
Les paragraphes de phases ci-dessous sont historiques.

- `pose.ts` partagé entre React et tests GLB ; horloge commune ; longueurs constantes,
  hauteur du bassin adaptée, trajectoires continues ; métriques après IK.
- Convention remplacée : `root.y >= 0`, tibia virtuellement raccourci et correction par sphères
  ne font plus autorité. Sol testé sur les sommets réels ; détails dans la spec #17.
- Écartement du couple et plafond de lean de phase 16 conservés. Repères de genou animés ;
  proximité explicitement distincte d’un contact mécanique, appuis explicitement illustratifs.
- Vérifications : 6 534 poses paramétrées, régressions composées et mode libre, 93 105 assertions
  de poses ; Gherkin 64 PASS / 0 FAIL / 1 SKIP. Revue indépendante sans défaut bloquant restant.
- Navigateur : Solo/Comparaison/Paire, même phase après changement de style et remontage,
  HUD sans doublon, exports depuis la pause de 4 et 16 temps, restauration de la pose/lecture,
  aucune erreur console. GIFs `audit-comparaison` et `audit-quarts-paire` actualisés ; ancienne
  galerie explicitement historique. Ces vérifications ne valident pas la technique de danse.
- Références : `docs/spec-audit-poses-finales.md`, `docs/retrospective-audit-poses.md`.

## Liens

- Dépôt : https://github.com/arcodange-org/dance-hips-movement-3D-comparison
- Site déployé (GitHub Pages) : https://arcodange-org.github.io/dance-hips-movement-3D-comparison/
- PR en cours / historique : `gh pr list --repo arcodange-org/dance-hips-movement-3D-comparison`
- Derniers runs CI (Pages) : `gh run list --repo arcodange-org/dance-hips-movement-3D-comparison --branch main --limit 5`
- Branche de travail courante : voir `git branch --show-current` (convention `vibe/phaseN-<slug>-ae8a7a`)

## Recherche musicale #38 (19 novembre 2026)

[docs/musique/](docs/musique/README.md) : caractéristiques musicales des six styles (niveaux de
preuve), grilles de 16 pas et timbres Web Audio proposés, confrontation avec `src/styles.ts`. Écarts
relevés : tempo global, plein appui entre les temps (kizomba, semba, zouk), kompa quatre fois trop
rapide, semba deux rebonds par temps, basic zouk lent-vite-vite absent. Son non implémenté : attend
la validation du propriétaire.
## Recherche sur le cadre #40 (19 novembre 2026)

[docs/cadre/](docs/cadre/README.md) : dix points de contact, quinze actions de guidage, règle des
hanches (recherche, répulsion, retour), application aux sorties et aux quarts de tour, spec
d'implémentation (critères A0 à A14). Constats : le cadre actuel ne se ferme pas, aucun os au-dessus
du bassin dans le GLB, bras absents de la fixture. Non implémenté : attend la validation du
propriétaire et la fusion de #33 (tableaux des sorties à relire).

## Où en est le projet

- Phases 1–4 **mergées dans `main`** : migration Vite+React+three TS, IK de pas, anatomie
  BodyParts3D régénérée, persistance localStorage, vertèbres L/D, déploiement Pages, GIFs
  motion design, mouvements sourcés sur place (2 temps, sorties garçon/fille), couche
  musculaire BodyParts3D, tests numériques (`npm test`).
- Phase 6 **LIVRÉE** (PR #4 mergée 2026-11-18, commit `83d680b` sur main, CI Pages run
  44284489080 = success, site live vérifié : assets 200 + smoke headless 0 erreur console sur
  comparatif-appuis / sortie paire diago / corridinho / muscles) — branche
  `vibe/phase6-vues-plant-solid-ae8a7a`. Contenu :
  comparatif d'appuis (jauges G/D ×2 en mode Comparaison, `statsBRef` + composant `Gauge`),
  corridinho (`corridinhoPath` : pivot D 0–3, pivot G 4–7, cercle R=0,3 m autour du repère
  8–15, `corridinho=`), presets caméra `src/cameras.ts` (`cam=default|hip|fixed|wide|diag|front|back`,
  diago par défaut en paire), `solid=1` (`SOLID_TORSO_OPACITY=0.62`), pieds plantés en sur place
  (`plantBlend`, amendment convention 2026-11-18, `plant=0` = ancien glissé), **ligne de danse**
  (`LineOfDance` en rubans roses — piège : `THREE.Line` 1 px invisible après downscale GIF),
  paire réorientée sur la ligne (face à face selon z, sortie = `sortieOffset` sur root.x local,
  perpendiculaire, retour temps 5+), dissociation (contre-rotation chest/head pendant la
  sortie), Gherkin `docs/features/*.feature` + `scripts/test_features.mjs` → **19 PASS / 0 FAIL /
  1 SKIP** dans `npm test`. 11 GIFs regénérés (`docs/gifs/`, sortie/corridinho/comparatif avec
  `ligne=1&repere=1&solid=1`). Vérifs : sortie latérale confirmée numériquement (root.x
  0→0,22 m au pic), ligne rose mesurée dans les frames GIF (117–458 px), jauges/torse opaque/
  pieds au sol confirmés visuellement. Spec : `docs/spec-phase6-comparatif-appuis-corridinho.md`.
- Phase 7 **en livraison** (branche `vibe/phase7-isolation-ginga-ae8a7a`, PR #5) — **objectif
  premier redéfini 2026-11-18 : discerner les isolations du bas du corps, le haut du tronc
  (au-dessus du bassin) doit rester stable et vertical**. Recherche web FR/EN/PT sur la ginga
  angolaise : `docs/ginga-angolana.md` (citations verbatim). Implémenté : `iso=1` **par défaut**
  (`lockUpperTrunk` : spine contre-rotate le pelvis, chest/head sans bascule latérale, pitch
  conservé pour vague suave/cambré zouk), **cadre de bras de danseur** `cadre=1` par défaut
  (`applyDanceFrame` : coudes pliés, avant-bras G en haut paume→droite, avant-bras D vers la
  gauche paume→buste), métrique `upperStability` + HUD « stabilité buste % », Gherkin
  `isolation-basse.feature` (npm test 22 PASS 0 FAIL 1 SKIP). Fessiers (GluteusMaximus/Medius,
  parentés au Pelvis) visibles et mobiles en vue de dos — vérifié numériquement (centroid
  musculaire déplacé entre 2 temps) + GIF `fessiers-muscles.gif`, `isolation-ginga.gif`.
  Spec : `docs/spec-phase7-isolation-basse.md`.
- Phase 8 **en livraison** (branche `vibe/phase8-mouvements-ae8a7a`, PR #6) — déplacements
  (priorité : mouvements individuels) : **bug os flottants plant=0 corrigé** (translations GLB
  Patella_L/Fibula_R/Fibula_L → `scripts/fix_knee_bone_offsets.py` + test Gherkin sur le GLB) ;
  **quarts de tour séparés** du corridinho (`quarts=1`, `quartsPath` 0→2π/16 temps ; en paire le
  suiveur en marche arrière via `reverse`+`reversePath`) ; **marche avant/arrière** (`dir=-1`) +
  **marka « 3 temps »** (`temps3=1`, `swingBeat`) ; **ida e volta** (`ida=1`, L avant/arrière puis
  R avant/arrière, 8 temps, solo et paire). Gherkin `mouvements-deplacement.feature` → 27 PASS
  0 FAIL. 18 GIFs. Spec : `docs/spec-phase8-deplacements.md`.
- Phase 9 **en livraison** (branche `vibe/phase9-partage-vue-ae8a7a`, PR #7) : bouton
  **« 🔗 Partager la vue »** (URL complète + angle caméra `campos=`/`camtgt=` restauré à la charge,
  `src/share.ts` + Gherkin `partage-url.feature`), **cadre de la suiveuse** en paire
  (`DANCE_FRAME_FOLLOWER`), **boussole 8 directions** au repère (`CompassRose.tsx`, `boussole=`,
  E=+x=ligne de danse) + HUD direction du buste (diago) et position / repère (`src/directions.ts`,
  Gherkin `directions.feature`), README avec **<details> « Détails & source » sous chaque GIF** +
  bascule segmentée **Vue Squelette / + Muscles**. Spec : `docs/spec-phase9-partage-boussole.md`.
- Phase 10 **LIVRÉE** (PR #8 mergée, commit `49e8058`, CI success) — **harness agentique** :
  `AGENTS.md` racine (lu en premier, avec section « Maintenance de ce fichier ») + dossier caché
  `.vibe/` = `README.md` + `HARNESS.md` (démarrage session, anti-amnésie, livraison ff-push/CI/site,
  sandbox, secrets) + `CONTRIBUTING.md` (cycle phase complet) + `CONVENTIONS.md` (conventions
  verrouillées + params URL). Toute session Mistral peut adopter et continuer le projet en
  autonomie.
- Phase 11 **LIVRÉE** (PR #9 mergée, commit `da6968a`, CI success) — **vírgula + URL angle/zoom** :
  sur les quarts de tour/corridinho le pied fait l'angle avec le corps (pivot sur la boule du
  pied, `virgulaFootYawDelta` ; sonde : max |Δlacet| = 4.4e-4 rad ; recherche `docs/virgula.md`)
  ; params URL `angle=`/`zoom=` en plus de `campos`/`camtgt` (`viewAnglesOf`/`posFromView`/
  `resolveView` dans `src/cameras.ts`, preset `top`, écrits par « Partager la vue ») ; cadre
  avant-bras G vers le haut verrouillé par Gherkin ; GIF `virgula-quarts.gif` (19 GIFs).
  Spec : `docs/spec-phase11-virgula-vue.md`. Tests : 39 PASS 0 FAIL 1 SKIP.
- Phase 12 **LIVRÉE** (PR #10 mergée, commit `639f337`, CI success) — **bug os mal placés au genou** :
  dans `public/anatomy.glb` les maillages tibia/patella/fibula étaient mal assignés aux noms sous
  les KneePivot (fibule « en pointe » au genou G, rotule flottante mi-tibia D) ; corrigé par
  `scripts/fix_shin_bone_meshes.py` (mesh+scale+translations) + Gherkin `os-symetrie.feature`
  (43 PASS 0 FAIL). Spec : `docs/spec-phase12-os-genou.md`.
- Phase 13 **LIVRÉE** (PR #11 mergée, commit `349efb5`, CI success) — **garantie de non-régression** :
  job CI `test` (`npm ci && npm test && npm run build`) sur push main + chaque PR, déploiement
  Pages conditionné à `needs: test` (`.github/workflows/deploy.yml`) — vérifié sur le run 349efb5
  (job test success avant build/deploy). Doc harness mise à jour dans le même commit (AGENTS.md,
  `.vibe/HARNESS.md`, `CONTRIBUTING.md`, `CONVENTIONS.md`).
- Phase 14 **LIVRÉE** (PR #12 mergée, commit `92a34e2`, CI success ; PR #13 = garde-fou CI
  `if: github.event_name != 'pull_request'` sur build/deploy) — **options de déplacement
  exclusives (radio `movementOf`/`movementFlags` + groupe radio Controls, parsing URL exclusif) +
  vrais pivots de quart de tour** `quartTurnStep(b, reverse)` (talon pied G au bout du pied D à
  90°, pied D ramené parallèle ; haut du corps = lacet pied G, bas = lacet pied D ; sonde runtime
  exacte). 50 PASS 0 FAIL 1 SKIP. Spec : `docs/spec-phase14-options-pivots.md`.
- Phase 15 **LIVRÉE** (PR #14 mergée, commit `71c2016`, CI test success) — **paire biomécanique** :
  plus de paramètre « retard du suiveur » (delay supprimé ; en pair le suiveur = miroir exact de
  styleA, styleB réservé au mode compare) ; contacts **poitrine + bassin + genoux** visibles
  (`PAIR_DZ=0.125`, marqueurs `contactKneeL/R`, ContactViz 4 points, param `contacts=`) ;
  **posture par style** `posture:{lean,knee}` (flexion genoux intégrée à la résolution IK) ;
  **contraposition** ida (`idaContra`) + vírgula affinée (pied G au bout du pied D — sonde
  z=0.199≈0.200 — root suit le pied ; en paire le suiveur pivote d'abord le pied D à 90°).
  56 PASS 0 FAIL 1 SKIP, 21 GIFs. Spec : `docs/spec-phase15-paire.md` ; sources
  `docs/posture-contraposition.md`.
- Session 16–18 **spécifiée** (PR #15 mergée) : spec consolidée
  `docs/spec-session-16-18.md` (objectifs + audit des points faibles W1–W10 mesurés + modèle
  d'oracle) + harness renforcé (`.vibe/HARNESS.md` §6 pièges)
- Phase 16 **LIVRÉE** (PR #16 mergée, commit `b5d6d89`, CI push main run 44356011283 = success,
- Phase M5 **LIVRÉE** (PR #23 mergée, commit `aec06ea`, CI PR run 44384036634 = success ; push
  main à relancer par checkpoint) : recoupement oracle ↔ poses finales GLB du moteur #19 —
  `scripts/test_oracle_final.mjs` (429 assertions PASS : pieds/lacets ~1e-17, dissociation
  exacte, sorties G/F/combiné exactes, sol minY=-5e-16) + oracle étendu (sorties, `rootX`) ;
  issues #21/#22 surveillées (pas de PR ouverte de l'autre agent à ce stade ; coordination
  en commentaires)
- Phase 17 **LIVRÉE** (PR #20 mergée, commit `43293bd`, CI push main run 44369926848 = success,
  site vérifié 200 + GIF/spec en ligne) : sortie garçon/fille/combinée G→F en **option
  exclusive** (`MovementKey` += sortieG/sortieF/sortieGF, `sortieActive(side, m, b)`, `pose.ts`
  via `sortieEnv`, radios paire, URL `sortie=1`(legacy G)/`sortieF=1`/`sortieGF=1`) — validé
  moteur (fixture GLB) + sonde navigateur (fenêtres G/F/combiné, retour x=0 en 16 temps) ;
  68 PASS Gherkin + 6 oracle ; GIF sortie combiné regénéré
- Phase 18 **LIVRÉE** (PR #18 mergée, commit `ce84acd`, CI push main run 44363605287 = success,
  site vérifié 200 + fichiers oracle en ligne) : oracle de poses discrètes par demi-pas en
  fichiers neufs (`src/oracle.ts`, `docs/oracle.feature`, `scripts/test_oracle.mjs` dans
  `npm test`) — 6 scénarios PASS (continuité + raccord de cycle, dualité reverse, angle droit
  π/2, contraposition ida) ; coordination issue #17 (commentaire déposé) ; phase 17 (sorties
  exclusives) **en attente de l'issue #17** (fichiers communs avec l'audit moteur)
- Phase 16 **LIVRÉE** (PR #16 mergée, commit `b5d6d89`, CI push main run 44356011283 = success,
- Phase 18 **EN COURS** (branche `vibe/phase18-oracle-ae8a7a`) : oracle de poses discrètes par
  demi-pas en fichiers neufs (`src/oracle.ts`, `docs/oracle.feature`, `scripts/test_oracle.mjs`
  branché dans `npm test`) — 6 scénarios PASS (continuité, raccord de cycle, dualité reverse,
  angle droit π/2, contraposition ida) ; coordination issue #17 (moteur réservé à un autre
  agent, commentaire déposé) ; phase 17 (sorties exclusives) en attente de #17
  site vérifié 200 + GIFs/feature en ligne) : contact fit en paire **sans les bras**
  (PAIR_DZ=0.175, marqueurs 0.16/0.14/0.135, sonde : pénétration corps −0.0015 m, marqueurs
  0.011–0.105 m) + **clamp sol renforcé** (aucun os sous y=0 : `clampSolY` + `groundDip`,
  sonde minY=+0.004 m) + Gherkin `sol-contact.feature` (64 PASS 0 FAIL 1 SKIP)
  (PAIR_DZ/marqueurs sur surface mesurée, lean plafonné en paire) → phase 17 sortie en option
  exclusive + combiné → phase 18 oracle de positions par demi-temps (`src/oracle.ts`).
- Rétrospective / boucle de feedback : `docs/retrospective-phase3-5.md` +
  `docs/retrospective-phase6.md` + méta-tâche M4 récurrente dans `docs/TASKS.md`.
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
