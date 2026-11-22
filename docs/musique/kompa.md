# Kompa (konpa, compas) : musique

Fil d'Ariane : [docs](../) › [musique](README.md) › **kompa**

## 1. Origine et filiation

- Créé par le saxophoniste **Nemours Jean-Baptiste** à Port-au-Prince. WXPN date le premier
  concert de son Conjunto International au 26 juillet 1955, date retenue comme anniversaire du
  konpa ; Wikipédia EN parle de l'Ensemble aux Callebasses (1955), devenu Ensemble Nemours
  Jean-Baptiste en 1957 ; Wikipédia FR (citant France Info, 2014) décrit une invention graduelle
  du compas direct vers 1957. Les dates divergent selon les sources.
- Filiation : une **méringue ralentie** mêlée aux percussions d'héritage africain (le
  producteur Fabrice Rouzier, cité par WXPN) ; méringue modernisée avec des éléments latins et
  jazz (Wikipédia EN).
- « Konpa dirèk » : selon Nemours lui-même (dernier entretien télévisé, rapporté par WXPN),
  « direct » renvoie à l'harmonie, deux accords seulement.
- Milieu des années 1960 : les *mini-jazz* (lancés par Shleu-Shleu) jouent avec deux guitares
  électriques, basse électrique, batterie, congas, timbales et **deux cloches** (Wikipédia EN).
- Années 1980 : la boîte à rythmes remplace les percussionnistes, le synthétiseur remplace les
  cuivres ; un motif de guitare répétitif avec effets devient la signature, appelé
  *kite'l maché* (Wikipédia FR, citant Plume-Evasion).
- Le zouk antillais en dérive en partie ; le zouk love est décrit comme un compas enrichi en MIDI
  (Wikipédia EN « Zouk », citant Occo 2019 et Ellingham 1999).
- Inscrit par l'UNESCO au patrimoine culturel immatériel le 10 décembre 2025 (résultat de
  recherche, non vérifié sur le site de l'UNESCO).

## 2. Tempo

| Source | Valeur | Niveau |
|---|---|---|
| Haitian Music Zone, « How to Dance Kompa » (2025) | 110–130 bpm, tempo moyen constant | faible (anonyme) |
| `docs/styles-de-danse.md` (spec du handoff) | 110–130 | interne |
| SongBPM, dix titres de Nemours Jean-Baptiste | 91 à 129 bpm (médiane ≈ 106) | estimation algorithmique |
| SongBPM, Tabou Combo « New York City » | 120 bpm, 4/4 | estimation algorithmique |

Aucune source académique consultée ne chiffre le tempo. Les titres anciens de Nemours paraissent
plus lents que la plage des pédagogues. Proposition : **120 bpm** par défaut, plage 100–130.

## 3. Mesure et métrique

- 4/4 régulier, qui ne change pas au cours d'un morceau (Haitian Music Zone ; Wikipédia EN parle
  d'un battement de tanbou constant et pulsé).
- Haitian Music Zone : grosse caisse sur 1 et 3, caisse claire ou tanbou sur 2 et 4, cloche ou
  güira en croches régulières, basse calée sur la grosse caisse. Le même site affirme que
  « dancers can predict every beat before it happens ». Source faible : à prendre comme une
  description d'ensemble, pas comme une transcription.
- Héritage de la méringue : figure syncopée de cinq coups, dite
  « dak-ta-dak-ta-dak », empruntée à la *kata* (ligne de temps) du rythme vodou kongo et du
  rabòday (Wikipédia EN « Méringue », citant Averill 1997, p. 33–34). C'est le **cinquillo**
  (long-court-long-court-long).

## 4. Motif rythmique de base

Documenté : 1 et 3 grave, 2 et 4 claqué, croches de cloche (source faible) ; héritage du
cinquillo (source sérieuse, mais pour la méringue, pas pour le konpa lui-même) ; congas,
timbales, deux cloches, *floor tom* ajouté par Nemours (Wikipédia FR, citant Jean Jean-Pierre,
*Le Nouvelliste*, 2020).

**Le « gong » demandé n'a été trouvé dans aucune source consultée.** Le *floor tom* est attesté ;
la partie exacte qu'il joue ne l'est pas. Les motifs de congas et de cloches ne sont pas
transcrits dans les sources accessibles. La méthode de Fanfant (2007), chapitres « Konpa
classic » et « Kompa Mamba », est la référence à consulter pour valider ou corriger la grille.

## 5. Instrumentation

- Guitares électriques centrales, en jeu rythmique ; saxophones et cuivres brillants ; claviers
  ou accordéon chez certains groupes (Wikipédia EN).
- Batterie, congas, timbales, tanbou (Wikipédia EN) ; graj (racleur), tcha-tcha (maracas),
  cloche, petites cymbales (Haitian Art Studio, site commercial, faible).
- Saxophone à la mélodie, trompette et trombone en réponses brèves, synthétiseurs dans le konpa
  moderne (Haitian Music Zone, faible).

Timbres à imiter : `KICK`, `SNARE` ou `CONGA_H` claqué (tanbou), `COWBELL`, `SCRAPER` (graj),
`FLOOR_TOM`, `PLUCK` étouffé (guitare *kite'l maché*), `BASS`, `BRASS` ou `PAD` cuivré.

## 6. Ligne de basse

- Nemours décrit une **basse en marche** constante sous deux accords (WXPN :
  « A simple 5-1 progression with the same basic walking bass pattern »).
- Basse calée sur la grosse caisse (Haitian Music Zone, faible).
- Proposition : noires en marche, notes d'accord sur les temps 1 et 3 avec la grosse caisse,
  notes de passage sur 2 et 4.

## 7. Harmonie et mode

- Deux accords, **V–I**, sans troisième accord ni altération, dans le konpa dirèk d'origine
  (Nemours, rapporté par WXPN).
- Le mode n'est pas précisé. Les estimations SongBPM des titres de Nemours sont toutes majeures
  ou sans mode. Proposition : fa majeur, C7 – F.

## 8. Nuances et dynamique

- Régulier, fluide, mélodies douces et énergie constante (Wikipédia EN).
- Morceaux longs, six à sept minutes au minimum traditionnellement (WXPN) : le groove dure, les
  variations viennent des cuivres et de la guitare plutôt que de la batterie.
- Danse de couple serrée, hanches qui roulent (*gouyad*, terme lié à la méringue par Averill,
  via Wikipédia EN « Méringue »).

## 9. Lien musique → mouvement

> Complément du 22 novembre 2026 : cette section ne s'appuyait que sur une source pédagogique faible. Ce que
> d'autres sources disent du pas et du bassin, dont le « 8 » et le gouyad, est dans
> [la recherche sur la danse kompa](../recherche-danse/kompa.md) (#161).

- Haitian Music Zone, « How to Dance Kompa » : temps 1 pas à gauche avec transfert complet,
  temps 2 pied droit qui touche sans poids, temps 3 pas à droite avec transfert complet, temps 4
  pied gauche qui touche sans poids ; hanches accentuées sur 2 et 4. Pas de pause décrite.
- Wikipédia EN : deux-pas *carré* introduit par Nemours.
- Spec du handoff (`styles-de-danse.md`) : « pas, rassembler, pas, pause », hip check sur le
  temps 4. Ce temps 4 n'a pas été retrouvé dans une source externe.

**Confrontation avec `src/styles.ts`.** `support = −tanh(2,2·S1(b))` a une **période d'un
temps** : plein appui gauche vers `b = 0,25`, droit vers `b = 0,75`, soit deux transferts par
temps. La source pédagogique décrit un transfert tous les deux temps : à tempo égal, le moteur va
**quatre fois trop vite**. La documentation du dépôt dit « un transfert de poids par temps » en
citant Haitian Music Zone, ce que la page pédagogique du même site ne confirme pas. Le hip check
(`b % 4 ≥ 3`) ajoute un petit décalage sans suspendre l'oscillation. Voir
[confrontation-moteur.md](confrontation-moteur.md).

## Spécification de synthèse

### Tempo

- Défaut : **120 bpm**. Plage : 100–130. Swing : 0.
- Tonalité : fa majeur.

### Grilles (1 mesure de 4/4, 16 pas)

```
pas          1 . . . 2 . . . 3 . . . 4 . . .
KICK         X . . . . . . . X . . . . . . .   1 et 3 (HMZ, faible)
SNARE/tanbou . . . . X . . . . . . . X . . .   2 et 4 (HMZ, faible) ; timbre CONGA_H claqué conseillé
COWBELL      X . x . X . x . X . x . X . x .   croches régulières (HMZ, faible) ; accents sur les temps (proposition)
SCRAPER graj x o x o x o x o x o x o x o x o   doubles-croches légères (proposition ; graj attesté, motif non)
FLOOR_TOM    . . . . . . . x . . . . . . . x   (proposition pure, le « gong » n'est pas documenté)
BASS         R - - - 3 - - - 5 - - - 6 - - -   basse en marche (WXPN) ; notes exactes : proposition
PLUCK guit.  o x o x o x o x o x o x o x o x   guitare répétitive étouffée, accent sur les contretemps (proposition)
```

Variante « héritage méringue » (cinquillo, Averill via Wikipédia) à essayer sur la guitare ou une
seconde cloche, à la place de la ligne `PLUCK` :

```
CINQUILLO    x . x x . x x . x . x x . x x .
```

### Instruments et harmonie

| Piste | Timbre | Réglages | Rôle |
|---|---|---|---|
| Guitare | `PLUCK`, décroissance 90 ms, chorus léger | note répétée sur la quinte de l'accord, −16 dB | groove *kite'l maché* |
| Cuivres | `BRASS` (ou `PAD` cuivré) | accords tenus sur les mesures 2 et 4, −14 dB | réponse |
| Basse | `BASS` | marche en noires | assise |
| Cloche | `COWBELL` | −14 dB, panoramique +0,4 | pulsation |

Harmonie : C7 (mesure 1) – F (mesure 2), en boucle (V–I).

### Accents et vélocités

- `KICK` 0,9 ; `SNARE/tanbou` 0,75 sur 2 et 4 ; `COWBELL` 0,7 sur les temps, 0,45 entre.
- La régularité est le caractère du style : humanisation réduite à ±2 ms.

### Variations sur 4 mesures (proposition)

| Mesure | Accord | Changement |
|---|---|---|
| 1 | C7 | base |
| 2 | F | base, cuivres |
| 3 | C7 | base |
| 4 | F | cuivres ; `FLOOR_TOM` ajouté aux pas 13 et 14 en appel vers la mesure suivante |

### Mapping temps → mouvement

| Temps | Pas (Haitian Music Zone) | Bassin |
|---|---|---|
| 1 | pas à gauche, transfert complet | descend côté appui |
| 2 | pied droit touche, sans poids | accent de hanche |
| 3 | pas à droite, transfert complet | descend côté appui |
| 4 | pied gauche touche, sans poids | accent de hanche (hip check de la spec) |

Cycle gauche-droite : **4 temps**. Pour le moteur : `support` de période 4 temps, avec plateau
pendant les temps de touche (2 et 4), et non `S1`.

## Références

- WXPN, texte de Nathalie « Talie » Cerin (26 juillet 2021). « The birth of Konpa! ».
  https://xpn.org/birth-of-konpa/
- Wikipédia EN, « Compas », https://en.wikipedia.org/wiki/Compas, consulté le 2026-11-19
  (cite Averill 1997 et 2008, Manuel 1988 et 2006).
- Wikipédia FR, « Compas direct », https://fr.wikipedia.org/wiki/Compas_direct, consulté le
  2026-11-19 (cite Jean Jean-Pierre, *Le Nouvelliste*, 27 juillet 2020 ; Plume-Evasion).
- Wikipédia EN, « Méringue », https://en.wikipedia.org/wiki/M%C3%A9ringue, consulté le
  2026-11-19, qui cite Averill, Gage (1997). *A Day for the Hunter, a Day for the Prey: Popular
  Music and Power in Haiti*. University of Chicago Press, p. 33–34 (ouvrage non consulté
  directement).
- Haitian Music Zone (1er décembre 2025). « How To Dance Kompa: Beginner Steps, Partner Moves,
  Timing ». https://haitianmusiczone.com/how-to-dance-kompa-beginner-steps-partner-moves-timing/
  (anonyme, faible).
- Haitian Music Zone (1er décembre 2025). « What Is Kompa Music? ».
  https://haitianmusiczone.com/what-is-kompa-music-music-is-the-heartbeat-of-haiti/ (anonyme,
  faible).
- Haitian Art Studio, « Konpa: Haiti's Rhythm That Conquered the Caribbean ».
  https://haitianartstudio.com/journal/konpa-haiti-rhythm-caribbean (vu en extrait de
  recherche seulement ; commercial, faible).
- SongBPM, « Nemours Jean-Baptiste » et Tabou Combo « New York City ».
  https://songbpm.com/@nemours-jean-baptiste ; https://songbpm.com/@tabou-combo/new-york-city
  (estimations algorithmiques).
- Fanfant, Jean-Philippe (2007). *Afro-Caribbean Grooves for Drumset*. Sher Music Co.
  (chapitres « Konpa classic », « Kompa Mamba » : non consultés, sommaire seulement).
