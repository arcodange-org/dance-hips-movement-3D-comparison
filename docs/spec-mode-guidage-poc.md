# Spec #69 — preuve de concept du mode guidage

Fil d'Ariane : [docs](./) › spec #69. Dépend de la [recherche jeux vidéo #63](recherche-jeux-video/README.md)
(concept : [mode guidage](recherche-jeux-video/mode-guidage.md), niveau 2), des figures en paire
[ida e volta](spec-ida-paire.md), [quarts](spec-quarts-paire.md), [sortie garçon](spec-sortie-garcon.md),
[sortie fille](spec-sortie-fille.md) et des [placements du couple](spec-placements-couple.md).

> **Depuis #140 (21 novembre 2026)** : le défi de synchronisation est retiré. Les commandes s'empilent
> dans une file, le simulateur écoute dès l'ouverture, et Espace laisse le couple danser seul. Voir la
> [spec du mode jeu](spec-jeu-file-auto.md). Les sections « Commandes » et « Interface » ci-dessous sont à
> jour ; le reste du modèle (segments, repère du couple, inertialisation) est inchangé.

## Demande du propriétaire (20 novembre 2026)

- « J'imagine même un mode jeux vidéo où on peut guider sa partenaire. »
- « Vu que PoC est établi, après la documentation enchaîne avec du code. »

## Constat mesuré sur le code

Échantillonneurs évalués sur le GLB (quinconce, amplitude 1) :

- Les quatre figures en paire partent **exactement** de la même pose neutre : pieds sous les hanches,
  quinconce, racine au même point ; leader en appui D (`loadR = 1`), suiveuse en appui G.
- Leurs fins sont des **déplacements rigides** de cette pose : ida e volta revient sur place (temps 8) ;
  chaque quart de tour (4 temps) tourne le couple de 90° autour d'un centre ; la sortie fille
  translate le couple ; la sortie garçon aussi, pieds compris, sauf le bassin de la suiveuse qui finit
  1,5 cm en arrière de sa place neutre (`SORTIE_GARCON_TRAVEL.behind`). Mêmes appuis qu'au départ.
- La quinconce neutre est donc un **état pivot** naturel : on peut enchaîner les figures sans
  transition inventée, à condition de reporter le déplacement du couple.

## Modèle

### Segments et frontières

Une partie est une suite de **segments** sur l'horloge commune `clock.beat` :

| Segment | Durée | Temps local | Sortie possible |
| --- | --- | --- | --- |
| `base` : pas de base en paire | ouverte | `beat − début` | tous les 4 temps du segment (les styles ont des périodes de 1, 2 ou 4 temps : le déhanché reste continu) |
| `ida` : ida e volta en paire | 8 temps | 0 → 8 | à la fin |
| `quart` : un quart de tour en paire | 4 temps | 0 → 4 (premier quart) | à la fin |
| `sortieG` : sortie garçon | 5 temps, fin arrondie à 6 | 0 → 5 puis tenue | à la fin |
| `sortieF` : sortie fille | 5 temps, fin arrondie à 6 | 0 → 5 puis tenue | à la fin |

Les figures s'enchaînent **toujours par la quinconce** : à la fin d'une figure, si une commande
attend dans la file, la figure suivante commence ; sinon le couple revient au pas de base. Les sorties tiennent
leur marka un temps (durée 6) ; leur déhanché est figé au temps 4, en phase avec le temps 0 du
segment suivant.

### Commandes (#140)

- Une commande est `{ beat, figure }`, horodatée sur l'horloge des temps au moment de la pression.
- Elle entre dans une **file**. À chaque frontière, la première commande de la file commence ; une
  pression sur le temps de la frontière est prise à cette frontière, juste après elle attend la suivante.
- Rien n'est refusé : deux commandes différentes se suivent, la même commande pressée deux fois se danse
  deux fois, une commande pressée au début d'une figure se danse à sa fin.
- ↑ pendant la sortie fille l'enchaîne (#90) ; la touche de l'ida transforme le prochain pas possible de
  la danse en aller-retour du pied (#91, #144, [spec](spec-ida-partout.md)) au lieu d'entrer dans la file :
  voir la [spec #140](spec-jeu-file-auto.md).
- Avant #140, une seule commande était gardée par frontière, et elle pouvait être refusée (trop tôt, trop
  tard, ambiguë, répétée). Ce modèle est retiré.

### Repère du couple

Chaque figure terminée déplace le **repère du couple** de sa transformation rigide (lacet + translation),
calculée à partir des pieds du leader à la fin de la figure. Les deux danseurs sont rendus dans ce
repère : chaque segment est échantillonné depuis la pose neutre locale. Les transformations se
composent (équivalent du *root motion* des jeux).

### Inertialisation du bassin

Si, à une frontière, la racine d'un danseur (dans le repère du couple) diffère entre la fin du segment
précédent et le début du suivant, l'écart (x, z) est ajouté à la racine du nouveau segment puis
effacé sur `INERTIA` temps (1 temps) par une courbe de degré 5 sans dépassement (Bollo). Seule la
racine bouge : les cibles des pieds restent celles de l'échantillonneur, l'IK des jambes s'applique
après. Cas concerné : la fin de la sortie garçon (1,5 cm, suiveuse).

Les figures en paire bornent différemment la flexion des genoux, la rotation et le balancement du
bassin (`kneeCap`, `rotationCap`, `sway`) : à pieds identiques, la **hauteur du bassin** et sa pose
propre changent d'une figure à l'autre (mesuré : jusqu'à 3 cm au genou en tarraxinha). Ces écarts
(hauteur, position et rotation du bassin) sont mesurés une fois par enchaînement sur le danseur
lui-même (`src/guidagePose.ts`) et effacés de la même façon, **avant** l'IK des jambes. La hauteur
est remesurée avec les écarts plan et de bassin appliqués en entier, car ils déplacent la hauteur que
trouve la portée des jambes : l'écart est exact à la frontière. C'est aussi
un constat pour #67 : les figures ne partagent pas la même hauteur de bassin.

### Pas de base en paire

Le sur place en paire de `main` (#61, `src/placePaire.ts`) : quinconce neutre (même pose que le départ
des figures), pieds plantés, déhanché du style, bassins couplés, cadre des bras (#40). Ses appuis sont
ceux du style. Une première version de cette PoC avait son propre pas de base ; elle a été remplacée
par celui de #61 à la fusion de `main`.

### Jugement du placement (retiré par #140)

La première version notait chaque pression par son écart au temps (Parfait, Bien, Juste, Raté) et tenait
une série. Le propriétaire a demandé de ne plus avoir « le défi d'être synchronisé » ni de voir ses
mouvements « rater » : les notes, la série et les refus sont supprimés du code et de l'interface.

### Rejeu

L'état d'une partie est **une liste de commandes horodatées**, à laquelle #140 ajoute la liste des
bascules écoute / danse automatique et la graine du tirage ; segments et repère du couple sont une
fonction pure de ces données et du temps. Revenir en arrière dans le temps et rejouer donne le même
résultat. Un plan ne réécrit jamais son passé : une commande déjà commencée n'est plus modifiée.

## Interface

- `?mode=pair&guidage=1` (avec `style=` et `bpm=` facultatifs) ouvre une vue dédiée ; le reste de
  l'app est inchangé.
- Touches par **position physique** (`KeyboardEvent.code`) : **W** ida e volta, **D** sortie garçon,
  **A** sortie fille, **Q** quart de tour en QWERTY, soit **Z**, **D**, **Q**, **A** en AZERTY ;
  **Espace** bascule entre l'écoute et la danse automatique (#140 ; la pause est un bouton). Flèches (#89, [spec](spec-jeu-fleches.md)) : **↑** avancer, **↓** reculer,
  **↑ ↑** double et marka ; **→** ou **↓** maintenue avec la touche de l'ida : jambe droite, en arrière
  d'abord. Kompa, tarraxinha et zouk ne proposent que la marche. Les boutons tactiles équivalents affichent les lettres de la disposition
  réelle (API Keyboard quand elle existe, sinon apprise à la première pression).
- HUD : compte (1 à 8), figure en cours, file d'attente, mode (écoute ou danse seule). Le couple danse
  dès l'ouverture ; `auto=1` ouvre en danse automatique, `graine=N` fixe son tirage.
- La caméra suit le centre du couple.
- Captures (#137) : `muscles=1` affiche la couche des muscles dans cette vue, comme dans l'app. Les GIFs
  des démonstrations (`demo=1`, `demo=fleches`, `demo=enchainement`) sont capturés avec ce paramètre :
  `scripts/capture_figure_gif.mjs` sur `?mode=pair&guidage=1&bare=1&demo=…&muscles=1`.

## Critères (tests)

1. **Ordonnancement** (pur) : frontières, pression sur le temps de la frontière, file de commandes
   (#140 : rien de refusé, ordre conservé), rejeu identique, accès direct à un temps identique à l'accès
   séquentiel.
2. **Danse automatique** (#140) : critères de la [spec #140](spec-jeu-file-auto.md). Les notes et la
   série ne sont plus testées : elles n'existent plus.
3. **Continuité aux frontières** (GLB) : pour chaque enchaînement de deux segments parmi les cinq,
   les pieds des deux danseurs dans le monde ne sautent pas (< 1 mm) ; la racine non plus (< 1 mm),
   grâce à l'inertialisation ; l'écart inertialisé est nul après `INERTIA`.
4. **Repère du couple** : après une figure, la pose neutre recomposée coïncide avec la fin de la
   figure (pieds < 1 mm) pour les deux danseurs.
5. **Invariants GLB** : pas de base, six styles, amplitudes 0,5 / 1 / 2, quinconce, avec et sans
   plexus : aucun croisement d'os de jambe (entre danseurs ni pour un même danseur), semelles
   au-dessus du sol, pieds immobiles. Séquences d'intentions aléatoires (graine fixe) : aucun
   croisement pendant les transitions et l'inertialisation.
6. **Non-régression** : sans `guidage`, aucune pose ni empreinte ne change (`npm test` inchangé).

## Rapport (20 novembre 2026)

- `scripts/test_guidage.mjs` (dans `npm test`, environ 45 s) : ordonnancement, notes, rejeu, repère du
  couple, continuité, GLB.
- Continuité aux 25 enchaînements, six styles : pieds et racines < 1 mm ; squelette entier (bassin,
  hanches, genoux, pieds, buste, tête) : saut maximal **0,001 mm** sur 10⁻⁶ temps (seuil du test
  0,2 mm), contre 30 mm au genou sans l'inertialisation de la pose du bassin et 3,6 mm quand la hauteur
  était mesurée sans les autres écarts (relevé par la relecture de code).
- Haut du tronc (#42) : le ginga donne au style sa phase dans l'ida e volta, différente de celle de
  l'horloge au pas de base ; la colonne, le buste et la tête entrent dans l'écart inertialisé (angles
  relevés là où `trunkOffset` s'ajoute, avec les écarts plan et du bassin, puisque le buste se tourne vers
  le partenaire). Avant : 1,3 cm à la tête (suave, base → ida).
- Pas de base : pieds immobiles, aucun croisement d'os, os au-dessus du sol (six styles, amplitudes
  0,5, 1 et 2, plexus). Sessions aléatoires (graine fixe, six styles) : 1 626 poses autour des
  frontières sans croisement d'os.
- La traînée du bassin est masquée en mode guidage (elle est tracée en coordonnées du monde et serait
  déplacée une seconde fois par le repère du couple).
- Limite connue : le contrôle de continuité du pied G du leader est en partie tautologique (il définit
  le déplacement du couple) ; le pied D, les pieds de la suiveuse, les racines et le squelette sont
  des contrôles indépendants.

## Hors périmètre

Transferts guidés et ginga par transfert (#42, PR #59), hésitation visible dans le corps, guidage
continu, interruption de figure, contraintes de distance des bassins (#67), calibration de latence,
son dédié. Ces tests ne valident pas la chorégraphie.
