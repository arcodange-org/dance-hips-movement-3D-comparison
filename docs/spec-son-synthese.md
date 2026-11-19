# Spec — son synthétisé synchronisé avec la danse (#44)

Fil d'Ariane : [docs](./) › **spec son synthèse** · recherche : [docs/musique/](musique/README.md)

## Objectif

Activer le son : chaque style danse en rythme avec une musique **synthétisée dans le
navigateur** (Web Audio), construite à partir des grilles de 16 pas et des recettes de timbres de
[docs/musique/](musique/README.md). Aucun enregistrement, aucune mélodie ni parole d'œuvre
existante. En mode comparaison, l'utilisateur choisit laquelle des deux musiques joue.

Inspiration (architecture et méthode seulement, aucun échantillon) : le générateur de percussions
de salsa de RecoDanse — motifs écrits comme données avec leurs sources, programmation en avance
sur l'horloge `AudioContext`, annulation de ce qui est en vol à chaque saut ou changement de
tempo, « une clave fausse est pire que pas de clave » : chaque ligne garde son niveau de preuve.

## Modules

| Fichier | Rôle | Testé sans navigateur |
|---|---|---|
| `src/music/patterns.ts` | Données : par style, tempo conseillé, grilles de 16 pas, harmonie sur 4 grilles, variations, niveau de preuve et source par ligne | oui |
| `src/music/scheduler.ts` | Fonctions pures : notes d'une fenêtre de temps `[de, à)`, humanisation déterministe ; transport audio (ancre temps ↔ temps musical) ; moteur de planification sur un port de sortie abstrait | oui (sortie factice) |
| `src/music/synth.ts` | Port Web Audio : recettes de timbres (`KICK`, `RIM`, `SHAKER`, `SCRAPER`, `CONGA`, `BASS`, `PAD`…), gain maître, annulation des notes futures | non (navigateur) |
| `src/music/useMusic.ts` | Hook React : crée l'`AudioContext` au clic, boucle de planification (25 ms, avance ~120 ms), pilote d'horloge pour `DanceTransport` | non |
| `src/components/SoundControls.tsx` | Interface « Son » | non |

### Grille

- Une grille = 16 pas de double-croche = 4 temps moteur. Le pas `i` de la grille `g` tombe au
  temps `b = 4·g + (i + swing·[i impair]) / 4`. Le temps 1 (pas 0) coïncide avec `b` entier
  multiple de 4 : la musique démarre au même `b = 0` que la danse.
- Le semba (2/4) occupe deux mesures de 2/4 par grille, comme dans `docs/musique/semba.md`.
- Jetons : `X` accent, `x` normal, `o` fantôme, `.` silence ; pour les voix accordées : `R`, `3`,
  `5`, `6`, `7` et `-` (tenue). Vélocités par défaut 1,0 / 0,7 / 0,35, surchargées par piste
  quand la page de style les précise.
- Cycle de 4 grilles (16 temps) avec l'harmonie et les variations des pages de style.
- Humanisation (proposition) : décalage temporel et vélocité dérivés d'un hachage
  `(graine, style, piste, pas absolu)` : déterministe, borné (±4 ms par défaut, ±2 ms kompa et
  tarraxinha).

### Fenêtre de planification

`eventsInWindow(style, de, à)` renvoie les notes dont le temps (swing compris) est dans
l'intervalle semi-ouvert `[de, à)`. Deux fenêtres contiguës ne dupliquent ni ne perdent aucune
note ; la boucle de 16 temps est périodique ; les temps négatifs sont acceptés (modulo).

### Horloge audio maîtresse

- Transport : ancre `(t0, b0, bpm)` ; `b(t) = b0 + (t − t0)·bpm/60` en lecture, `b0` en pause.
  `t` est le temps **audible** : `ctx.currentTime − latence de sortie`.
- Changement de tempo : ré-ancrage à `(t, b(t))`, donc `b` continu ; les notes futures déjà
  programmées sont annulées puis reprogrammées au nouveau tempo.
- Pause : le son s'éteint en fondu court ; la reprise s'ancre sur le `clock.beat` affiché.
- Saut (`seekClock`, qui incrémente `clock.revision`) : détecté par la révision, ré-ancrage sur le
  nouveau temps, coupure de ce qui sonne.
- Quand le son est actif, `DanceTransport` lit `b` depuis l'horloge audio au lieu d'intégrer le
  delta de l'image : l'image et le son ne dérivent jamais. La fin des figures en cinq actions
  (`endBeat`) est respectée de la même façon.
- **Son coupé : comportement strictement inchangé** (`advanceClock`, aucun `AudioContext` créé).
- Pendant l'export vidéo, la musique est en pause (l'export pilote lui-même `clock.beat`).

## Interface

- Bouton « Son » éteint par défaut ; l'`AudioContext` est créé dans le gestionnaire du clic.
- Volume, interrupteurs par piste (repliables).
- En comparaison : choix de la musique A ou B (demande du propriétaire). En face à face, solo et
  observation : la musique du style A.
- Indication du tempo conseillé du style dont la musique joue, avec un bouton pour régler le
  curseur sur ce tempo.
- URL de partage : `son=1` et `musique=A|B` (comparaison seulement). Un lien `son=1` ne peut pas
  démarrer l'audio sans geste : le bouton invite à cliquer.

## Choix provisoires (à valider par le propriétaire)

1. **Tempo global conservé** : le curseur reste l'unique tempo (une seule horloge pour les deux
   corps) ; activer le son ne change pas le tempo. Un bouton propose le tempo conseillé du style
   (kizomba 90, semba 120, kompa 120, tarraxinha 75, suave 72, zouk 80). Réversible : on bouge le
   curseur.
2. **Mode Observation (32 bpm)** : la musique joue au tempo du curseur, donc très ralentie ; un
   message le signale. Aucune coupure automatique.
3. **Comparaison** : musique A par défaut ; l'autre style danse au tempo de cette musique.
4. **Phases du moteur inchangées** : `src/styles.ts` n'est pas modifié (ni mouvements, ni phases,
   ni tempos). Les décalages relevés dans
   [confrontation-moteur.md](musique/confrontation-moteur.md) restent ouverts.
5. **Grilles** : simplifications pédagogiques de `docs/musique/` ; seules les variantes de base
   sont jouées (pas de version « ancienne » du semba ni de gabarit zouk antillais).
6. Humanisation déterministe ±4 ms (±2 ms kompa/tarraxinha), vélocité ±8 % (±10 % dikanza).

## Validation

- `scripts/test_music.mjs` dans `npm test` : grilles bien formées (16 pas, instruments connus,
  niveau de preuve présent, tenues précédées d'une note), accents de chaque style conformes à
  `docs/musique/` (kompa grosse caisse sur 1 et 3, caisse sur 2 et 4 ; semba ngoma grave sur
  chaque premier temps de 2/4 ; zouk « boom » sur 1, « chick » sur 3 et 4 ; etc.), fenêtres sans
  doublon ni oubli (partitions aléatoires, boucle, temps négatifs), humanisation déterministe et
  bornée, transport (lecture, pause, tempo, saut), moteur sur sortie factice (pas de note perdue
  ni doublée à travers un changement de tempo ou un saut, rattrapage après un trou).
- `docs/features/son-synthese.feature` (runner Gherkin existant).
- `npm run build` ; vérification manuelle dans le navigateur (son, choix A/B, aucune erreur
  console).

## Hors périmètre

Changement des phases d'appui, cycles de 8 temps, tempo par style automatique, enregistrement
audio de l'export vidéo.
