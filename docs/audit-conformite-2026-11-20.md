# Audit de conformité aux règles du propriétaire — 20 novembre 2026

Fil d'Ariane : [docs](./) › audit de conformité. Référence auditée : les règles R1–R21 de
[`docs/regles-proprietaire.md`](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/blob/arcodange/regles-proprietaire/docs/regles-proprietaire.md)
(PR #68) et les critères des specs qu'elles citent. Code audité : `main` à `941d754` (PR #58). Les
chantiers ouverts (#59 ginga, #64 ligne de danse, #66 CI) ne sont **pas** dans `main` ; ils sont
signalés quand ils changent le verdict. Aucun correctif dans ce chantier.

> Demande : « fait faire un audit pour vérifier qu'elles sont bien respectées (je devine qu'elles ne
> le sont pas) ». Réponse courte : **les figures en paire respectent les invariants techniques
> (aucun croisement d'os, pas de glissement), mais pas les règles de mouvement données depuis
> le 19 novembre** : la distance bassin-bassin varie de 32 à 53 cm dans les sorties, le bassin
> monte et descend de 14 à 17 cm, les transferts d'appui ne tombent pas sur les temps dans les quarts
> et l'ida e volta, le ginga n'est pas lié aux transferts, et **hors figures (sur place, temps3,
> corridinho), les os des jambes des partenaires se croisent dans les six styles**, sans aucun
> test pour le voir.

## Mise à jour du 21 novembre 2026

La sonde a été relancée sur `main` après les fusions #104 à #123 (`node scripts/audit_conformite.mjs`). Les
valeurs ci-dessous sont l'amplitude 1, en plage sur les six styles. Les tableaux plus bas restent ceux du
20 novembre.

| Figure | Écart avant-arrière des bassins (Δ) | Décalage latéral max | Hauteur bassin leader / suiveur | Plexus max |
|---|---|---|---|---|
| Sortie garçon | 16,6–19 → 48–52,4 cm (Δ 29–33,8 ; 32–36,8 avant) | 27,6–31,4 cm (40–44 avant) | 5,5–7,5 / 13,9–15 cm (16–17,1 avant) | 21–27,7 cm (15,7–17,5 avant) |
| Sortie fille, crochet | 14,3–18,7 → 44,8 cm (Δ 26,1–30,5 ; 49–53,4 avant) | 43,9–53,4 cm | 3–4,6 / 13,8–15,5 cm | **35,9–43,5 cm** (15–16 avant) |
| Sortie fille, recul | 11,2–15,6 → 45–46,1 cm (Δ 29,4–34,6 ; 47,7–52,7 avant) | 30,6–39,9 cm | 6,3–7,5 / 11,3–12,8 cm | 26,7–29 cm (17,6–18,2 avant) |
| Quarts de tour | 25,4 → 31,1–31,6 cm (Δ 5,7–6,2 ; 10,3–10,9 avant) | 8,1 cm | 3,1–4,7 / 5,7–6,3 cm | 6,4–10,3 cm |
| Ida e volta | 25,7–26,3 → 28,9–29,6 cm (Δ 2,6–3,9 ; 0–0,4 avant) | 12,5–13,4 cm (voir note) | 2–2,9 / 2–3,1 cm | 5,4–7,8 cm |

Lecture :
- **R2** s'améliore nettement dans la sortie fille (#105) et dans les quarts (#106). Dans l'ida, l'écart
  varie de 3 à 4 cm : c'est le pivot de bassin sur la hanche d'appui (#84).
- **R3** s'améliore un peu dans les sorties (suiveur 11 à 15,5 cm, contre 13 à 17 cm).
- **R4 se dégrade dans les sorties**, surtout la sortie fille en crochet : les repères de poitrine
  s'écartent jusqu'à 36–44 cm. La cause est #93 (« danseurs droits, sans posture de lutteur de sumo »,
  demande du propriétaire) : sans l'inclinaison vers l'avant, les bustes ne comblent plus l'écart des
  bassins. La garde de `test_plexus.mjs` est alors passée de 22 à 41 cm pour la sortie fille. Les deux
  demandes (R4 et danseurs droits) se contraignent l'une l'autre ; c'est l'écart que #75 demande de
  rendre visible avec le seuil de la règle.
- **Décalage latéral de l'ida** : la sonde le mesure dans l'axe du bassin du leader, que le pivot de #84
  tourne. Dans l'axe de ses pieds, le couple reste en quinconce (`scripts/test_ontologie.mjs`, PR #117).
- **Glissement des pieds porteurs** : la mesure de la sonde (barycentre des sommets de semelle au sol)
  saute chaque fois que le talon quitte le sol. Elle surestime donc le glissement quand le pied bascule :
  jusqu'à 2,6 mm par 1/32 temps dans les quarts (D du leader sur sa demi-pointe) et sur place. Le test
  dédié de #73 (`scripts/test_appui_fixe.mjs`) vérifie le point de pivot (demi-pointe ou talon) et
  mesure 0,00 mm sur 1 344 poses.
- **Règles sorties du statut « non respecté »** :
  - R13 et R14 (ginga, #42 et #59, fusionnés) ;
  - l'appui qui glisse sur place (#73, #121) ;
  - le croisement des os pendant le pivot de l'ida (#84, #120, 0 croisement).
- **R9** : en position 2 de la sortie garçon, les pieds D sont maintenant à 12 cm (#110), et non plus bord
  à bord. Décision du propriétaire attendue.

### Depuis cette mise à jour (21 novembre, après-midi)

Fusions postérieures à la relance de la sonde ; les tableaux ne sont pas recalculés.

- **R9, tranchée par le propriétaire (#130)** : « avoir le pied (voire le genou) en contact possible (donc
  très proche) sur D2 est important, quitte à reculer légèrement le bassin ». Semelles D à 3,8 cm, genoux
  D à 11,1 cm, bassin du leader 6 cm derrière son D, 0 croisement d'os (`test_sortie_garcon.mjs`). Le
  buste « légèrement en avant tout le temps » reste à traiter avec #93.
- **Quarts de tour (#126)** : début fluidifié, le buste suit le bassin 0,25 temps plus tard.
- **R26, nouvelle règle (#127, #128)** : la virgula, pied G du leader posé perpendiculaire. Premier pas de
  la sortie fille crochet, et option de l'ida e volta. Suiveur inchangé, buste du leader à moins de 1° de
  sa direction. Le talon se pose contre le bord intérieur du D, pas exactement à son bout : écart à
  valider par le propriétaire.
- **Écarts chiffrés** (`scripts/test_ecarts_regles.mjs`, #75 et #62) : R4, R8 et R21 sont maintenant
  mesurés à leur seuil dans `npm test`. Avec #130, dans la sortie garçon, le plus grand pas latéral du
  leader passe de 31,3 à 28 cm et l'écart des plexus de 27,1 à 27,3 cm. #127 ne change aucune valeur.

## Méthode

- Sonde indépendante [`scripts/audit_conformite.mjs`](../scripts/audit_conformite.mjs) (hors
  `npm test`), construite comme les tests existants : bundle esbuild de `src/*`, GLB réel
  (`scripts/pose_fixture.mjs`), triangles des os (`scripts/mesh_intersections.mjs`).
- **Vue de l'app reproduite** (`src/components/Rig.tsx:185-195`, `src/App.tsx:224`,
  `src/App.tsx:285`) : figures en paire avec placement quinconce, `plexus: true`,
  contraposition 1 ; **sur place, temps3, corridinho** : écartement `PAIR_DZ` = 17,5 cm,
  sans placement ni plexus (l'app n'en donne pas), `reverse` pour le suiveur du corridinho.
- Six styles × amplitudes 0,5 ; 1 ; 2 ; pas d'échantillonnage 1/32 temps (mesures), 1/8 temps (os).
- Mesures :
  - **écart avant-arrière des bassins** : vecteur bassin→bassin projeté sur l'axe où les danseurs se
    font face (moyenne de l'avant du leader et de l'arrière du suiveur), décalage latéral retiré ;
  - **hauteur** : variation (max − min) de la hauteur monde du bassin et du buste, par danseur ;
  - **plexus** : distance des repères `contactChest` (comme `scripts/test_plexus.mjs`) ;
  - **pas** : déplacement net de chaque pied entre deux repos (échantillonneur de la figure) ;
  - **os** : triangles fémur, tibia, fibula, rotule — entre partenaires (8 × 8) et pour un danseur (G × D) ;
  - **glissement** : déplacement du barycentre des points de semelle au sol (≤ 1 mm) d'un pied qui
    porte du poids (> 5 %) entre deux échantillons ;
  - **temps** : instants où l'appui prescrit passe 50 % (franchissement) et fin de chaque fenêtre de
    transfert (arrivée du poids), comparés aux temps entiers (un temps moteur = une noire de la
    grille musicale, `docs/spec-son-synthese.md` § Grille). Convention du dépôt :
    « le poids arrive sur le temps » ([confrontation moteur](musique/confrontation-moteur.md)).
- Rejouer : `node scripts/audit_conformite.mjs [cas…] --bones --json out.json`,
  `--appuis` (R13), `--hanches` (R16). Cas : `sortieG_line sortieG_right sortieF_hook sortieF_back
  quarts ida surPlace temps3 corridinho`.
- `npm test` sur `main` : vert (voir « Couverture des tests »).

## Synthèse

| # | Règle (résumé) | Verdict | Chiffre clé (amplitude 1, kizomba sauf mention) | Suivi |
|---|---|---|---|---|
| R1 | Neutre en quinconce, fin de figure en quinconce, sur place aussi | **partiel** | figures : oui (tests) ; sur place, temps3, corridinho : face à face, décalage latéral 0 ; amplitude 2 : plus de quinconce (`placementScale`) | #61 |
| R2 | Distance bassin-bassin quasi constante (latéral retiré) | **non respecté** | sortie G 16→48 cm (Δ 32), sortie F 0→53 cm (Δ 53), quarts 26→37 cm (Δ 11) ; ida 28 cm (Δ 0) | #67 |
| R3 | Pas de « monter-descendre » | **non respecté** (sorties) | bassin : sortie G 16 cm (suiveur), sortie F 14–17 cm, quarts 6 cm, ida 4 cm ; semba sur place 10 cm | #67 |
| R4 | Plexus contre plexus, avec contraposition | **partiel** | max : ida 3,5 cm, quarts 7,5 cm, sortie G 16 cm, sortie F 15,5–18 cm | #51 |
| R5 | Collé-serré | **partiel** | contacts des cuisses D/D tenus (tests) ; mais écarts de R2 | — |
| R6 | Ligne de danse perpendiculaire aux bustes | **non respecté sur `main`** ; incohérence après #64 | figures : ligne tournée dans l'axe des bustes (`App.tsx:386`) ; les figures progressent de 49 cm (G) et 52 cm (F) **dans l'axe des bustes** | #60, PR #64, #72 |
| R7 | Marche naturelle | **partiel** | figures : oui (`gaitStep`, tests) ; corridinho, temps3, curseur Déplacement : pieds à plat qui glissent en l'air (`pose.ts:181-206`) | #73 |
| R8 | Pas ≈ longueur de pied (21–25 cm) | **partiel** | ida 18 cm ✔ ; sortie G 7–54 cm ; quarts 22–47 cm ; sortie F 35–94 cm | #56 |
| R9 | Sortie G, temps 2 : bords externes des pieds D au contact | **respecté** | 2,2 mm (test) | — |
| R10 | Sortie F : ouverture plus courte | **respecté** | G2 du suiveur 44 cm (45 visé) | — |
| R11 | Quarts : rotation autour du leader, quinconce à chaque quart, anticipation 0,25 | **respecté** | tests `test_quarts_paire.mjs` ; suiveur 22 / 47 cm, leader 27 / 38 cm par quart | — |
| R12 | Ginga : hauteur stable, bassin qui bouge | **non respecté** | buste : sorties 14–18 cm de variation ; ginga plafonné à 0,06–0,12 rad dans les figures | #42, PR #59 |
| R13 | Ginga déclenché à chaque transfert | **non respecté** | accord appui du style / appui de la figure : 49–52 % (hasard) dans les quatre figures | #42, PR #59 |
| R14 | Leader ≈ 70 % du suiveur | **non implémenté** sur `main` | — | PR #59 |
| R15 | Hanches joyeuses, énergie du sol | **non testé** (jugement à l'œil) | — | — |
| R16 | Tarraxinha sur place : pas de genoux qui traversent ; intention de hanche vers l'avant | **non respecté** | os croisés dans 61/65 poses (amp. 1) ; avancée de chaque hanche ± 1 cm | #61, #71 |
| R17 | Hanches qui se cherchent / se repoussent | **partiel** | bassins couplés au départ et à la fin des sorties, pendant les quarts et l'ida ; pas sur place | — |
| R18 | Isolation : buste qui compense le roulis | **respecté** | `isolation-basse.feature`, `test_features.mjs:320` | — |
| R19 | Cadre : points de contact | **non implémenté** | spec seule (`docs/cadre/spec-implementation.md`) | #74 |
| R20 | Les contacts contraignent le mouvement | **non implémenté** | — | #74 |
| R21 | Transferts de poids sur les temps de la musique | **non respecté**, **non testé** | sorties : poids qui arrive sur le temps ✔ ; quarts : à 0,4 temps ; ida : 4 arrivées sur 6 sur le « et » ; sur place : plein appui entre les temps ; kompa : 4 × trop rapide | #62 |
| Inv. | Aucun croisement d'os des jambes (six styles, trois amplitudes) | **respecté dans les figures**, **non respecté sur place / temps3 / corridinho** | figures : 0 sur 6 444 poses de couple ; sur place : 8 à 65 poses sur 65 selon le style | #71 |
| Inv. | Pied d'appui immobile | **respecté** (figures) ; **partiel** (semba sur place) | figures ≤ 2,4 mm sur un échantillon à l'atterrissage ; semba sur place : barycentre d'appui qui glisse de 3 mm par 1/32 temps | #73 |

## Mesures détaillées

### Figures en paire (vue de l'app : quinconce, plexus, contraposition 1)

Valeurs sur les six styles (min–max des styles) à l'amplitude 1 ; amplitude 2 entre parenthèses
quand elle diffère (le placement s'estompe vers l'écartement de référence, `src/placement.ts:26`).

| Figure | Écart avant-arrière des bassins | Δ | Décalage latéral | Hauteur bassin (leader / suiveur) | Plexus max | Os croisés | Glissement |
|---|---|---|---|---|---|---|---|
| Sortie garçon, ligne | 13,6–16 → 48–51,8 cm | 32–36,8 cm | 8 → 40–44 cm | 4,7–6,9 / 16–17,1 cm | 15,7–17,5 cm | 0 / 41 poses × 18 | 0,07 mm |
| Sortie garçon, à droite | idem | 32–36,8 cm | 8 → 40–44 cm | idem | 15,7–17,5 cm | 0 | 0,07 mm |
| Sortie fille, crochet | 0–4,4 → 53,4 cm | 49–53,4 cm | 0 → 38–44 cm | 6,4–8,1 / 13,4–15,4 cm | 15–16 cm | 0 | 0 |
| Sortie fille, recul | 0–4,4 → 52–53 cm | 47,7–52,7 cm | 0 → 36–42 cm | 15,2–16,1 / 16,6–17,4 cm | 17,6–18,2 cm | 0 | 0 |
| Quarts de tour | 25,9–26,1 → 36,4–36,9 cm | 10,3–10,9 cm (6,1–11,4) | 7,6–10,2 cm | 5,8–7,2 / 2,2–3,9 cm | 7,0–7,8 cm | 0 / 129 poses × 18 | 2,4 mm (1 échantillon, fin du déroulé) |
| Ida e volta | 27,8–28,2 cm | 0–0,4 cm (0–17,6 : suave, tarraxinha) | 8,1 cm | 4,0–4,7 / 2,3–3,4 cm | 3,2–6,9 cm | 0 / 65 poses × 18 | 0 |

Lecture (kizomba, amplitude 1, sortie fille crochet, au quart de temps) : écart avant-arrière 28 → 53
(temps 1) → 34 (temps 2) → **0 (temps 3, côte à côte, 33 cm de côté)** → 40 (temps 4) → 28 cm. Le bassin
du suiveur descend de 86 à 72,6 cm au temps 2. Ce sont les chiffres relevés par #67, confirmés.

### Pas (déplacement net de chaque pied, kizomba, amplitude 1)

| Figure | Leader (cm) | Suiveur (cm) |
|---|---|---|
| Sortie garçon, ligne | G 25,9 · D 31,7 · G 40,5 · D 31,2 · G 7,2 (marka) | D 17 · G 18,6 · **D 54** · G 31,7 · D 22 |
| Sortie garçon, à droite | 25,9 · 31,7 · 40,5 · 38,3 · 6,7 | 17 · 18,6 · **54** · 34,8 · 25,2 |
| Sortie fille, crochet | 8,1 · 19,8 · 31 · **59,1** · 29,4 | **56,2 · 44,1 · 85,6 · 76,6 · 66,1** |
| Sortie fille, recul | 8,1 · 18,2 · 31 · **53,8** · 47,5 | **53,2 · 35,2 · 93,5 · 70 · 53,3** |
| Quarts (par quart) | G 27,3 · D 38,3 | D 22,1 · **G 46,9** |
| Ida e volta | 18 × 4 | 18 × 4 |

Longueur du pied : 21 cm ([spec #56](spec-pas-courts.md)). Sur les 38 pas des figures (hors ida), 9
sont ≤ 25 cm. La sortie fille et les quarts sont hors du périmètre de #56 ; la spec le dit.

### Transferts d'appui et temps de la musique (R21, R13)

Appui prescrit `loadR` (`src/pose.ts:461`), un temps moteur = une noire. Kizomba, amplitude 1 (les
instants ne dépendent pas du style dans les figures).

| Mouvement | Fenêtres de transfert (temps) | Arrivée du poids vs temps | Verdict |
|---|---|---|---|
| Sortie garçon | 0,66→1 · 1,63→2 · 2,75→3 · 3,63→4 | sur le temps (fin = temps entier) | ✔ |
| Sortie fille | 0,66→1 · 1,66→2 · 2,66→3 · 3,47→4 | sur le temps | ✔ |
| Quarts (leader) | 1,38→1,41 · 2,88→2,91 · … (instantané) | 0,41 et 0,09 temps après | ✘ et transfert instantané |
| Quarts (suiveur) | 1,44→1,47 · 3,06→3,13 · … | 0,47 et 0,13 temps après | ✘ |
| Ida e volta (`idaTransfers`, `src/idaPaire.ts:61`) | 1,19→1,5 · 1,53→1,97 · 3,19→3,5 · 5,19→5,5 · 5,53→5,97 · 7,19→7,5 | 4 sur 6 sur le « et » (x,5), 2 à 0,03 temps du temps | ✘ |
| Sur place kizomba, semba, zouk (`support = −S2`) | continu, sinusoïde de 2 temps | poids plein à x,5 (entre les temps), franchissement sur le temps | ✘ (déjà noté par la confrontation moteur) |
| Sur place tarraxinha, suave | `−0,5·S2`, `−0,2·S2` : transferts partiels | idem | ✘ |
| Sur place kompa (`−tanh(2,2·S1)`, `src/styles.ts:90`) | deux transferts par temps | plein appui à x,25 et x,75 | ✘ (4 × trop rapide selon les sources) |

R13 (ginga) : sur les instants où la figure porte tout le poids sur un pied, l'appui du style (qui
tourne sur l'horloge, `src/pose.ts:302`) est du même côté dans **49 à 52 %** des échantillons
(sorties, quarts, ida ; six styles) — un accord de hasard. Le déhanché n'est pas lié aux transferts.

### Hors figures : sur place, temps3, corridinho en paire

L'app ne donne ni placement ni plexus (`src/App.tsx:224`) : couple face à face à 2 × 17,5 cm, le
suiveur danse le même style dans son repère. **Aucun test ne vérifie les os des jambes dans ces vues.**

| Style | Sur place : poses avec os croisés (sur 65), amp. 0,5 / 1 / 2 | Paires d'os croisées (amp. 1, cumul) | Hauteur bassin (amp. 1) | Glissement de l'appui (amp. 1) |
|---|---|---|---|---|
| kizomba | 16 / 16 / 57 | 96 | 2,7 cm | 0 |
| semba | 8 / **49** / 33 | 470 | **10,3 cm** (23 cm à amp. 2) | **3 mm par 1/32 temps, 23 cm cumulés en 8 temps** |
| kompa | 25 / **59** / 17 | 348 | 2,5 cm | 0 |
| tarraxinha | **65 / 61** / 49 | 900 | 1,9 cm | 0 |
| suave | **59 / 59 / 63** | 406 | 1,7 cm | 1,7 mm par 1/32 temps, 15 cm cumulés |
| zouk | 0 / 24 / 51 | 144 | 8,2 cm | 0 |

Le glissement de la semba et du suave vient de la bascule des pieds (`extraL`, `extraR`,
`src/styles.ts:74-75`, `153-154`) autour de la cheville, sans point de pivot au sol (le pivot `ball`/`heel`
de `src/pose.ts` n'est appliqué qu'aux figures) : les points de semelle porteurs frottent sur le sol.
Cela vaut aussi en solo.

| Style | Temps3 en paire : poses avec os croisés, amp. 0,5 / 1 / 2 (sur 49) | Corridinho en paire : idem (sur 65) |
|---|---|---|
| kizomba | 12 / 12 / 43 | 22 / 20 / 28 |
| semba | 6 / 37 / 25 | 14 / 32 / 34 |
| kompa | 20 / 44 / 13 | 35 / 34 / 31 |
| tarraxinha | 49 / 46 / 37 | 35 / 40 / 38 |
| suave | 46 / 46 / 48 | 36 / 39 / 43 |
| zouk | 0 / 12 / 39 | 11 / 20 / 25 |

Premier croisement typique : rotule G du leader contre rotule D du suiveur, fémur contre fémur
(kompa, semba, tarraxinha dès le temps 0). Écart des bassins constant (35 cm) mais décalage
latéral nul au départ : pas de quinconce (R1).

R16, intention de hanche (tarraxinha, `src/styles.ts:118-127`) : chaque articulation de hanche
avance et recule de **± 1,0 cm** par rapport au centre du bassin (zouk ± 1,5 ; kizomba ± 0,3) ;
l'alternance G/D existe (lacet `0,12·cos(πb)`) mais reste peu visible, et rien ne modélise le
retour « vers l'arrière, légèrement sur le côté, en s'ouvrant ».

## Couverture des tests

`npm test` sur `main` (`941d754`) : **vert** (13 runners, Gherkin 82 PASS / 0 FAIL / 1 SKIP). Les écarts des repères de poitrine qu'il imprime (sortie G 16,0 cm, quarts 7,5, ida 3,4, sortie F 15,4–18,1) sont ceux de la sonde : les deux mesures concordent.

| Règle | Test qui la couvre | Ce que le test garantit vraiment |
|---|---|---|
| R1 | `test_sortie_garcon.mjs:84-86`, `test_quarts_paire.mjs:26-47`, `test_ida_paire.mjs` § 1 | fin en quinconce des figures ; **rien sur place** |
| R2, R3 | aucun | — |
| R4 | `test_plexus.mjs:22-30` | **garde de l'état mesuré** (18 cm sorties G, 22 cm sorties F, 11 cm quarts, 6 cm ida) : le test fige l'écart à la règle au lieu de l'exiger |
| R7 | runners des figures (talon, attaque, pivot) | figures seulement |
| R8 | `test_sortie_garcon.mjs` (progression `share`) | la progression réduite, pas la longueur des pas |
| R9 | `test_sortie_garcon.mjs:192-195` | ✔ ≤ 3 mm |
| R11 | `test_quarts_paire.mjs` § 1–3 | ✔ |
| R13, R14, R21 | aucun (`test_music.mjs` ne lit pas les appuis) | — |
| R18 | `test_features.mjs:320-323`, `isolation-basse.feature` | ✔ |
| Os des jambes | runners des figures, `TEST_PLEXUS=1` | figures seulement ; **sur place, temps3, corridinho en paire non testés** |

## Écarts et suivi

Les écarts déjà suivis reçoivent un commentaire d'audit avec les chiffres ; les écarts sans suivi
ont une nouvelle issue (étiquette `audit-conformite`, #71 à #75).

| Écart | Règles | Suivi |
|---|---|---|
| Os des jambes qui se croisent en paire sans placement (sur place, temps3, corridinho), six styles ; aucun test | Inv., R1, R16 | #71 |
| La ligne de danse et la progression des figures : #64 dessine la ligne perpendiculaire aux bustes, mais les figures progressent dans l'axe des bustes | R6 | #72 |
| Marche naturelle et appui fixe hors figures (corridinho, temps3, curseur Déplacement ; semba sur place) | R7, Inv. | #73 |
| Cadre non implémenté | R19, R20 | #74 |
| Tests qui figent l'état mesuré (plexus) et règles sans test (R2, R3, R12, R13, R21) | R2–R4, R12, R13, R21 | #75 |
| Distance bassin-bassin et hauteur des bassins | R2, R3, R12 | #67 (commentaire) |
| Transferts hors des temps de la musique | R21 | #62 (commentaire) |
| Ginga non lié aux transferts | R12–R14 | #42 (commentaire) |
| Pas longs (sortie fille, quarts, D3 de la sortie garçon) | R8 | #56 (commentaire) |
| Plexus à 15–18 cm dans les sorties | R4 | #51 (commentaire) |
| Tarraxinha sur place, quinconce sur place | R1, R16 | #61 (commentaire) |

## Limites de l'audit

- Mesures géométriques et cinématiques ; aucune validation chorégraphique ni jugement à l'œil
  (R15, « joyeuses et sensuelles », reste au propriétaire).
- L'axe avant-arrière est déduit des repères racine ; il suit la rotation du couple dans les quarts.
- Le glissement est mesuré sur les sommets de semelle au sol ; un pivot chargé sur l'avant-pied
  compte comme glissement s'il déplace le barycentre (aucun cas dans les figures au-delà de 2,4 mm).
- Le pas « net » ignore le détour du pied pendant le vol (le D2 du leader recule de 5 cm avant d'avancer).
- Les branches ouvertes (#59, #64) n'ont pas été mesurées : le verdict R6, R12–R14 pourra changer
  à leur fusion.
