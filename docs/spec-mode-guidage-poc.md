# Spec #69 — preuve de concept du mode guidage

Fil d'Ariane : [docs](./) › spec #69. Dépend de la [recherche jeux vidéo #63](recherche-jeux-video/README.md)
(concept : [mode guidage](recherche-jeux-video/mode-guidage.md), niveau 2), des figures en paire
[ida e volta](spec-ida-paire.md), [quarts](spec-quarts-paire.md), [sortie garçon](spec-sortie-garcon.md),
[sortie fille](spec-sortie-fille.md) et des [placements du couple](spec-placements-couple.md).

## Demande du propriétaire (20 novembre 2026)

- « J'imagine même un mode jeux vidéo où on peut guider sa partenaire. »
- « POOC » = « proof of concept (PoC) » ; « vu que PoC est établi, après la documentation enchaîne
  avec du code ».

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
| `base` : pas de base en paire | ouverte | `beat − début` | à chaque temps pair du segment |
| `ida` : ida e volta en paire | 8 temps | 0 → 8 | à la fin |
| `quart` : un quart de tour en paire | 4 temps | 0 → 4 (premier quart) | à la fin |
| `sortieG` : sortie garçon | 5 temps, fin arrondie à 6 | 0 → 5 puis tenue | à la fin |
| `sortieF` : sortie fille | 5 temps, fin arrondie à 6 | 0 → 5 puis tenue | à la fin |

Les figures s'enchaînent **toujours par la quinconce** : à la fin d'une figure, si une intention
attend, la figure suivante commence ; sinon le couple revient au pas de base. Les durées des sorties
sont arrondies à un nombre pair de temps pour garder la carrure de deux temps du pas de base.

### Intentions

- Une intention est `{ beat, figure }`, horodatée sur l'horloge des temps au moment de la pression.
- Elle vaut pour la **prochaine frontière** qui suit d'au moins `PREP` temps (0,25 temps : la
  préparation, l'avance du buste du leader) ; plus tard, elle attend la frontière suivante (mémoire
  tampon d'une seule intention).
- Deux intentions **différentes** pour la même frontière : guidage ambigu, la suiveuse reste au pas
  de base (retour « hésitation »), comme le recommande la recherche (ne jamais faire une mauvaise
  figure). La même intention répétée est ignorée.
- Pendant une figure, une intention donnée avant ses deux derniers temps est refusée (« trop tôt ») :
  le guidage se prépare à la fin de la figure, pas au début.

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
après. Cas concerné aujourd'hui : la fin de la sortie garçon (1,5 cm, suiveuse).

### Pas de base en paire

Quinconce neutre (`idaNeutral`), pieds immobiles, déhanché du style à l'horloge locale, mêmes
plafonds que l'ida e volta (genoux, rotation du bassin, couplage des bassins). Appuis illustratifs :
leader `loadR = (1 + cos πb) / 2` (appui D aux temps pairs, G aux temps impairs), suiveuse en miroir.
Provisoire : le ginga déclenché par les transferts (#42) remplacera ce rythme d'horloge.

### Jugement du placement

Chaque pression est notée par son écart au temps le plus proche, `b` = durée d'un temps :

| Note | Fenêtre |
| --- | --- |
| Parfait | ±min(50 ms ; 0,08 b) |
| Bien | ±min(100 ms ; 0,15 b) |
| Juste | ±min(160 ms ; 0,25 b) |
| Raté | au-delà |

Série : +1 par Parfait ou Bien ; un Raté la divise par deux (indulgence de *Beat Saber*). La figure
s'exécute toujours sur le temps, quelle que soit la note (*Hi-Fi Rush*). Pas de calibration de
latence dans cette PoC.

### Rejeu

L'état d'une partie est **une liste d'intentions horodatées** ; segments, repère du couple et notes
sont une fonction pure de cette liste et du temps. Revenir en arrière dans le temps et rejouer donne
le même résultat.

## Interface

- `?mode=pair&guidage=1` (avec `style=` et `bpm=` facultatifs) ouvre une vue dédiée ; le reste de
  l'app est inchangé.
- Touches : **W** ida e volta, **D** sortie garçon, **A** sortie fille, **Q** quart de tour,
  **Espace** lecture / pause. Boutons tactiles équivalents.
- HUD : compte (1 à 8), segment en cours et intention en attente, dernière note avec l'écart en ms
  (tôt / tard), série, message d'hésitation ou de refus.
- La caméra suit le centre du couple.

## Critères (tests)

1. **Ordonnancement** (pur) : frontières, préparation, mémoire tampon, ambiguïté, refus trop tôt,
   rejeu identique, accès direct à un temps identique à l'accès séquentiel.
2. **Notes** : fenêtres et série conformes au tableau, à 72 et 120 bpm.
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

## Hors périmètre

Transferts guidés et ginga par transfert (#42, PR #59), hésitation visible dans le corps, guidage
continu, interruption de figure, contraintes de distance des bassins (#67), calibration de latence,
son dédié. Ces tests ne valident pas la chorégraphie.
