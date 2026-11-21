# Musique des six styles : recherche et spécification de synthèse

Fil d'Ariane : [docs](../) › **musique**

Recherche documentaire du 2026-11-19 pour la prochaine étape du propriétaire : **activer le son**
afin de voir les mouvements en rythme avec la musique propre à chaque danse. Le son sera
**synthétisé dans le navigateur (Web Audio)** : motifs rythmiques et timbres génériques recréés,
**sans enregistrement ni œuvre protégée**. Aucune parole, aucune mélodie d'œuvre existante n'est
reprise ici.

Depuis le 21 novembre 2026 (#142), le bouton « Son » joue d'abord une **boucle enregistrée générée
par IA** quand le style en a une ([enregistrements](enregistrements.md),
[spec](../spec-musique-elevenlabs.md)) ; la synthèse décrite ici reste le repli et une source au choix.

## Pages

| Page | Contenu |
|---|---|
| [kizomba.md](kizomba.md) | Kizomba (Angola, années 1980) : semba + zouk/kompa, boîte à rythmes |
| [semba.md](semba.md) | Semba (Luanda, années 1950) : 2/4, dikanza, ngomas, deux guitares |
| [kompa.md](kompa.md) | Konpa dirèk (Haïti, 1955) : méringue ralentie, deux accords V–I |
| [tarraxinha.md](tarraxinha.md) | Tarraxinha (Benguela, années 2000) : lente, minimale, électronique |
| [suave.md](suave.md) | « Suave » : manière de danser lente, sans genre musical propre |
| [zouk-bresilien.md](zouk-bresilien.md) | Zouk brésilien (danse) et zouk antillais (musique) |
| [confrontation-moteur.md](confrontation-moteur.md) | Tempos et phases de `src/styles.ts` comparés à la recherche |

## Méthode

1. Lecture du dépôt : `AGENTS.md`, [`docs/styles-de-danse.md`](../styles-de-danse.md),
   [`docs/ginga-angolana.md`](../ginga-angolana.md), `src/styles.ts`, `src/anatomy.ts`
   (`S1` = période 1 temps, `S2` = 2 temps, `S4` = 4 temps), `src/clock.ts`,
   `src/components/Controls.tsx` (curseur tempo 24–140 bpm, 32 bpm par défaut).
2. Recherche web en français, anglais et portugais : encyclopédies (Wikipédia, Britannica),
   un article d'ethnomusicologie (Baratti 2020), une communication ANPPOM (Kuschick et Zattera
   2013), presse musicale (The Fader, Red Bull Music Academy, WXPN), pédagogues de danse
   (Bath Zouk, Discovering Kizomba, Kizomba Seattle, Kizombalove), et faute de mieux quelques
   guides de production et bases de tempo, signalés comme tels.
3. Chaque affirmation porte son niveau de preuve :
   - **documenté** : lu dans une source, référencée en bas de page ;
   - **faible** : lu, mais dans une source commerciale, anonyme ou sans référence ;
   - **proposition** : choix de l'auteur de cette recherche pour rendre le motif programmable,
     à valider à l'oreille par le propriétaire.
4. Citations : une au plus par source, moins de 15 mots ; le reste est paraphrasé.

### Ce que les sources donnent, et ce qu'elles ne donnent pas

Les sources sérieuses décrivent bien l'histoire, l'instrumentation, la métrique et parfois
l'harmonie. **Aucune source consultée ne donne une transcription complète, instrument par
instrument, sur une grille de 16 pas.** Les grilles de ce dossier sont donc des
**simplifications pédagogiques** construites à partir des éléments documentés (temps forts,
cellules signatures, rôle de chaque instrument). La méthode de batterie de Jean-Philippe Fanfant,
*Afro-Caribbean Grooves for Drumset* (Sher Music, 2007), contient des chapitres « Zouk »,
« Zouk love », « Konpa classic » et « Kompa Mamba » ; seul son sommaire a pu être consulté.
C'est la référence la plus directe pour valider les grilles zouk et kompa.

## Conventions communes à toutes les pages

### Grille

- Une mesure de 4/4 = 16 pas de double-croche. Le pas `i` (0 à 15) tombe au temps moteur
  `b = 4·m + i/4`, où `m` est l'indice de mesure. Les temps 1, 2, 3, 4 sont les pas 0, 4, 8, 12.
- Le semba, écrit en 2/4, occupe deux mesures de 2/4 par grille de 16 pas.
- Notation par pas : `X` accent (vélocité 1,0), `x` normal (0,7), `o` note fantôme (0,35),
  `.` silence. Pour la basse : `R` fondamentale, `3` tierce, `5` quinte, `6` sixte, `7`
  septième, `-` tenue.
- Humanisation conseillée (proposition) : décalage aléatoire de ±4 ms et vélocité ±8 %.
- `swing` (proposition) : retard des doubles-croches paires (pas 1, 3, 5…) en fraction de
  double-croche ; 0 = droit.

### Timbres de base (Web Audio, valeurs indicatives, proposition)

Ces recettes sont des points de départ de synthèse, pas des données de la recherche.

| Nom | Recette |
|---|---|
| `KICK` | Oscillateur sinus, fréquence 150 → 50 Hz (exponentielle, 60 ms) ; gain 1 → 0 en 350 ms |
| `KICK_SOFT` | Sinus 110 → 48 Hz (80 ms) ; décroissance 450 ms ; passe-bas 200 Hz |
| `SUB` | Sinus 45–60 Hz accordé sur la fondamentale ; décroissance 0,8–1,2 s ; légère saturation (`WaveShaperNode`) |
| `RIM` | Triangle 1,7 kHz + sinus 800 Hz + bruit filtré passe-bande 2,5 kHz (Q 3) ; décroissance 40 ms |
| `SNARE` | Bruit passe-haut 900 Hz (180 ms) + triangle 190 Hz (80 ms) |
| `CLAP` | Trois salves de bruit passe-bande 1,2 kHz espacées de 10 ms, puis queue de 150 ms |
| `HAT_C` / `HAT_O` | Bruit passe-haut 7 kHz ; décroissance 40 ms (fermé) ou 250 ms (ouvert) |
| `SHAKER` | Bruit passe-bande 6 kHz (Q 1) ; attaque 8 ms ; décroissance 70 ms |
| `SCRAPER` | Racleur (dikanza, graj, güira, reco-reco) : bruit passe-bande 3,5 kHz (Q 2) modulé en amplitude par un carré à 35 Hz ; durée d'un pas |
| `COWBELL` | Deux carrés 540 Hz et 800 Hz, passe-bande 2,6 kHz ; décroissance 250 ms |
| `CONGA_L` / `CONGA_H` | Sinus 220 Hz / 330 Hz, chute de hauteur de 10 % en 30 ms, décroissance 180 ms ; claqué : ajouter 30 ms de bruit passe-bande 1,5 kHz |
| `NGOMA_L` / `NGOMA_H` | Sinus 120 Hz (250 ms) / 260 Hz (120 ms), attaque bruitée de 5 ms |
| `FLOOR_TOM` | Sinus 95 Hz, chute de hauteur de 15 % en 60 ms, décroissance 350 ms |
| `BASS` | Triangle + dent de scie à −12 dB, passe-bas 600 Hz ; ADSR 5 ms / 250 ms / 0,6 / 100 ms |
| `PLUCK` | Guitare : Karplus-Strong (`AudioWorklet`) ou dent de scie avec passe-bas 3 kHz → 800 Hz en 150 ms, décroissance 300 ms |
| `PAD` | Deux ou trois dents de scie désaccordées de ±7 cents, passe-bas 1,2 kHz ; attaque 400 ms, relâchement 1 s |
| `BRASS` | Deux dents de scie désaccordées, enveloppe de filtre 600 → 3000 → 1200 Hz en 80 ms ; décroissance 300 ms |
| `ACCORDION` | Carré + dent de scie à l'octave, passe-bas 2,5 kHz, vibrato 5,5 Hz ±6 cents |

### Horloge

L'horloge du moteur (`advanceClock`) intègre le delta de chaque image, borné à 0,1 s. Pour que le
son et l'image restent alignés, il est préférable que **l'horloge audio soit maîtresse** :
`b = (ctx.currentTime − t0) · bpm / 60`, les notes étant planifiées un peu à l'avance sur
`AudioContext`. Voir [confrontation-moteur.md](confrontation-moteur.md).

## Tableau de synthèse

| Style | bpm (plage des sources) | Défaut proposé | Mesure | Motif signature | Instruments clés | Caractère |
|---|---|---|---|---|---|---|
| Kizomba | 80–100 (80–120 ou 60–80 selon les sources) | 90 | 4/4, binaire | Rythmique proche du zouk : grosse caisse douce sur les temps, rimshot 3-3-2 | Boîte à rythmes, basse appuyée, nappes, guitare claire, voix | Lent, insistant, sensuel ; mineur fréquent (source faible) |
| Semba | 100–125 (90–150 selon les sources ; « mid-tempo ») | 120 | 2/4, premier temps appuyé, syncopé « galopant » | Dikanza sur toutes les doubles-croches, ngoma grave sur le temps | Dikanza, ngomas puis congas, deux guitares (solo et rythmique), basse | Festif, extraverti ; harmonie tonique–dominante |
| Kompa | 110–130 | 120 | 4/4 régulier | Grosse caisse 1 et 3, caisse ou tanbou 2 et 4, cloche en croches ; héritage du cinquillo de la méringue | Batterie, congas, tanbou, cloches, deux guitares, basse, saxophone, synthé | Régulier, prévisible, dansant ; deux accords V–I |
| Tarraxinha | 60–80 ou 80–100 selon les sources | 75 | 4/4, sensation demi-tempo (proposition) | Peu d'éléments, basse électronique lourde et ponctuée | Boîte à rythmes, claviers, basse de synthèse | Lent, minimal, âpre, très sensuel |
| Suave | Aucun genre propre ; kizomba lente, ghetto zouk, zouk love | 72 | 4/4 | Rythme dépouillé, quasi-silences entre les temps | Boîte à rythmes nue, une voix, nappes | Très calme, intime |
| Zouk brésilien | 60–90 (80–100 selon une source faible) | 80 | 4/4 | « boom-chick-chick » : temps 1 long, temps 3 et 4 courts | Zouk antillais, zouk love, puis R&B, pop, hip-hop | Fluide, lyrique, cambrés ; plus lent que le zouk antillais (120–145) |

## Constats principaux

1. **Le tempo est global dans l'app** (curseur 24–140 bpm, 32 par défaut), pas par style. Les
   tempos musicaux des six styles vont de 60 à 130 bpm environ : il faudra un tempo par défaut
   par style quand le son est activé, et décider ce qu'on fait en mode Observation (32 bpm).
2. **En comparaison, une seule horloge** anime les deux styles. Avec la musique d'un style,
   l'autre danse forcément à un tempo qui n'est pas le sien (par exemple kizomba à 120).
3. **Les phases du moteur placent souvent le plein appui entre les temps.** Pour kizomba,
   semba et zouk, `support = −S2(b)` atteint ±1 à `b = 0,5 ; 1,5` et passe par 0 sur les temps
   entiers. Les sources de pédagogie décrivent des pas qui arrivent sur le temps.
4. **Kompa : le moteur va quatre fois trop vite** par rapport à la source pédagogique trouvée
   (pas sur 1, touche sur 2, pas sur 3, touche sur 4 : un transfert pour deux temps), alors que
   `S1` produit deux transferts par temps.
5. **Semba : le rebond vertical a une période d'un demi-temps** (`|S1|`), soit deux rebonds
   par temps, alors que la source décrit un rebond par temps. Le motif « 1-2-3, pause » n'est
   pas représenté.
6. **Zouk brésilien : le basic lent-vite-vite** (pas sur 1, 3, 4) n'est pas représenté ; le
   moteur fait un transfert régulier par temps.
7. Les sources divergent sur la tarraxinha (kuduro ralenti ou kizomba ralentie) et sur le
   tempo de la kizomba ; le « suave » n'est pas un genre musical.

Le détail, style par style, est dans [confrontation-moteur.md](confrontation-moteur.md).

## Références générales

- Fanfant, Jean-Philippe (2007). *Afro-Caribbean Grooves for Drumset / Les plus grands rythmes
  caribéens*. Petaluma : Sher Music Co. ISBN 1-883217-56-3. Extrait de 5 pages :
  https://hudsonmusic.com/wp-content/uploads/Afro-Caribbean-Grooves-SAMPLE.pdf (sommaire
  seulement consulté).
- Wikipédia EN, « Tresillo (rhythm) », https://en.wikipedia.org/wiki/Tresillo_(rhythm),
  consulté le 2026-11-19 (définition du 3+3+2 ; mention du zouk sans référence directe).
- Toutes les autres références sont listées en bas de chaque page de style.
