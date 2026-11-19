# Tarraxinha : musique

Fil d'Ariane : [docs](../) › [musique](README.md) › **tarraxinha**

## 1. Origine et filiation

- Genre de musique et de danse d'Angola, né dans la province de **Benguela** (Wikipédia EN,
  qui s'appuie sur Discovering Kizomba). Le mot signifie « petite vis » (de *tarraxa*, vis).
- Deux filiations **divergentes** :
  - Discovering Kizomba (2024) : « Tarraxinha (the music) started as slowed-down Kuduro. » ;
    pionniers cités : DJ Madabaya et DJ Znobia, début des années 2000 ou avant ; aucun lien
    direct avec la kizomba hormis l'origine angolaise.
  - Benjamin Lebrave, *The Fader* (2013) : des producteurs angolais ont pris la kizomba, l'ont
    ralentie et dépouillée pour faire ressortir le balancement des hanches ; il situe l'apogée de
    la production vers 2006 et sa quasi-fin en 2007.
- Dérivés européens : *tarraxa* (nom européen de la danse) et *tarraxo* (musique apparue à
  Lisbonne au début des années 2010, plus âpre et plus percussive, presque sans mélodie dans la
  variante « fodencia ») (Discovering Kizomba ; Wikipédia EN).
- La tarraxinha a influencé l'urban kiz, avec la kizomba (Wikipédia EN).

## 2. Tempo

| Source | Valeur | Niveau |
|---|---|---|
| The Fader (2013) | lente ; sert à redescendre d'un set à plus de 120 bpm | presse, sans chiffre |
| BeatKey | 60–80 bpm | faible |
| Kizomba Seattle (2014–2016) | 80–100 bpm | faible |
| Spec du handoff (`styles-de-danse.md`) | « lent » | interne |

Les deux seules sources chiffrées ne se recouvrent pas. Kizomba Seattle prévient que le tempo ne
suffit pas à distinguer ces genres. Proposition : **75 bpm** par défaut, plage 60–100.

## 3. Mesure et métrique

- 4/4 (implicite dans toutes les sources, aucune ne dit autre chose).
- Le « temps lent » : aucune source ne parle de « temps lent » au sens d'un temps précis de la
  mesure. Ce qui est documenté, c'est un **tempo lent** et un dépouillement qui met en avant le
  balancement des hanches (The Fader). Proposition : une **sensation demi-tempo** (claquement
  sur le temps 3 seulement), qui laisse deux temps entiers à chaque mouvement de bassin.

## 4. Motif rythmique de base

Documenté : minimal, lent, âpre (The Fader, à propos d'un titre de DJ Marfox) ; son électronique
fort, basse électronique lourde, plutôt ponctuée que mélodique (Kizomba Seattle, qui évoque
« a very strong electronic sound and a heavy electronic bass »).

Non documenté : la grille. La grille ci-dessous est une **proposition** dérivée de la kizomba
(filiation The Fader) en version dépouillée.

## 5. Instrumentation

- Entièrement synthétique : boîte à rythmes, claviers, voix (Kizomba Seattle).
- Musique simple et ralentie (Discovering Kizomba) ; la variante lisboète *tarraxo* est encore
  plus centrée sur la percussion.

Timbres à imiter : `KICK` sec, `SUB` saturé, `CLAP` ou `SNARE` sec, `RIM`, `HAT_C` rare,
`PAD` sombre.

## 6. Ligne de basse

- Lourde et électronique, ponctuée plutôt que mélodique (Kizomba Seattle).
- Proposition : `SUB` sur la fondamentale, déclenché avec la grosse caisse, longue décroissance ;
  une seule autre note par mesure.

## 7. Harmonie et mode

- Non documentée. Proposition : un ou deux accords mineurs tenus (Am – Am – F – E), nappe sombre
  très discrète.

## 8. Nuances et dynamique

- Très sensuelle, controversée à ses débuts pour cette raison (Wikipédia EN ; The Fader, où DJ
  Marfox dit qu'elle a semé la confusion).
- Densité minimale, beaucoup de silence : c'est l'espace qui laisse voir l'isolation du bassin
  (proposition d'interprétation).

## 9. Lien musique → mouvement

- Sur place, pas quasi nuls, isolations du bassin, contact des hanches (Udansa et spec, cités
  dans [`styles-de-danse.md`](../styles-de-danse.md)) ; Kizomba Seattle : travail de hanches
  isolé et petits pas.
- Discovering Kizomba : pas de marche, attention portée au partenaire ; mouvements de poignet
  comparés à un tournevis.
- Aucune source consultée ne dit sur quel temps tombe chaque phase du cercle ou du « 8 ».

**Confrontation avec `src/styles.ts`.** Le bassin fait un cercle ou un « 8 » en **2 temps**
(`S2`, `sin(πb + 1,3)`, `cos(πb)`) ; `support = −0,5·S2(b)` déplace partiellement le poids avec la
même période. À 75 bpm, un cercle dure 1,6 s. Aucune source ne contredit ni ne confirme cette
période : **à faire valider**. Voir [confrontation-moteur.md](confrontation-moteur.md).

## Spécification de synthèse

### Tempo

- Défaut : **75 bpm**. Plage : 60–100. Swing : 0.
- Tonalité : la mineur ; fondamentale A1 = 55 Hz pour le `SUB`.

### Grilles (1 mesure de 4/4, 16 pas)

```
pas         1 . . . 2 . . . 3 . . . 4 . . .
KICK        X . . . . . . . . . x . . . . .   (proposition)
SUB         R - - - - - - - . . R - - - - -   suit la grosse caisse, ponctué (KS : basse lourde)
CLAP        . . . . . . . . X . . . . . . .   demi-tempo (proposition)
RIM         . . . x . . x . . . . . . . x .   reste du 3-3-2, clairsemé (proposition)
HAT_C       . . . . . . . . . . . . . . . .   vide en mesures 1-3 ; voir variations
```

### Instruments et harmonie

| Piste | Timbre | Réglages | Rôle |
|---|---|---|---|
| Basse | `SUB` + `WaveShaper` (courbe douce, drive 2) | passe-bas 180 Hz, −6 dB | lourdeur |
| Grosse caisse | `KICK` | décroissance 250 ms (plus sèche que la kizomba) | ancrage |
| Nappe | `PAD`, passe-bas 700 Hz | −20 dB, accords de 2 sons (fondamentale et quinte) | ombre harmonique |

Harmonie : Am (mesures 1–2) – F (3) – E (4).

### Accents et vélocités

- `KICK` 1,0 sur le temps 1, 0,6 sur le pas 10.
- `CLAP` 0,8 ; `RIM` 0,4.
- Humanisation faible (±2 ms) : le caractère est mécanique.

### Variations sur 4 mesures (proposition)

| Mesure | Accord | Changement |
|---|---|---|
| 1 | Am | base |
| 2 | Am | base |
| 3 | F | `HAT_C` sur les pas 2, 6, 10, 14 (vélocité 0,3) |
| 4 | E | silence total sur les pas 12–15 sauf `SUB` tenu : suspension avant la reprise |

### Mapping temps → mouvement (proposition, non sourcée)

| Temps | Bassin | Appui |
|---|---|---|
| 1 | début du cercle, côté droit | plein appui, pieds fixes |
| 2 | passage vers l'arrière | idem |
| 3 | côté gauche, sur le claquement demi-tempo | idem |
| 4 | retour par l'avant ; suspension en mesure 4 | idem |

Si le cercle dure 2 temps (moteur actuel), il y a deux cercles par mesure ; si la musique est
jouée en demi-tempo, un cercle par mesure (4 temps) colle mieux au claquement unique. Choix à
valider.

## Références

- Wikipédia EN, « Tarraxinha », https://en.wikipedia.org/wiki/Tarraxinha, consulté le
  2026-11-19.
- Discovering Kizomba (18 mars 2024, d'après un post du 13 avril 2021). « What are Tarraxinha,
  Tarraxa, Tarraxo? Are they different from Kizomba? ».
  https://discoveringkizomba.com/tarraxinha-tarraxa-difference-to-kizomba/ (auteur non nommé).
- Lebrave, Benjamin (28 mars 2013). « Lungu Lungu: DJ Marfox, Tarraxinha, and Rubbing
  Pelvises ». *The Fader*.
  https://www.thefader.com/2013/3/28/lungu-lungu-dj-marfox-tarraxinha-and-rubbing-pelvises
- Kizomba Seattle (2014, mis à jour 2016). « How to Recognize Tarraxinha, Kizomba and Semba
  Music ». https://kizombaseattle.blogspot.com/2014/10/how-to-recognize-tarraxinha-kizomba-and.html
- BeatKey, « How to Make Kizomba Music » (tempos par sous-style).
  https://beatkey.pages.dev/how-to-make-kizomba-music (commercial, faible).
- Note : la page Wikipédia PT « Tarraxinha » porte sur une chanson brésilienne de 2013
  (axé), sans rapport avec le genre angolais.
