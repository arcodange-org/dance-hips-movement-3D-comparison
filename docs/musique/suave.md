# Suave : musique

Fil d'Ariane : [docs](../) › [musique](README.md) › **suave**

## 1. Origine et filiation

- **Le « suave » n'est pas un genre musical.** Aucune source consultée ne le présente comme un
  sous-genre nommé de la kizomba. Le mot sert à qualifier la manière de danser la kizomba : une
  étudiante angolaise de 22 ans, interrogée par Paris Match Belgique (2017), dit
  « C'est un style très calme, très suave », où l'on bouge peu et calmement.
- Dans l'app, le suave désigne une variante lente de la kizomba, centrée sur la ginga (le « 8 »
  au sol) et la vague du tronc (voir [`styles-de-danse.md`](../styles-de-danse.md) et
  [`ginga-angolana.md`](../ginga-angolana.md)).
- Les musiques sur lesquelles se danse cette variante lente sont la **kizomba lente**, le
  **ghetto zouk** et le **zouk love** :
  - ghetto zouk : nom donné vers 2000 par Quatro Plus, groupe néerlandais d'origine
    cap-verdienne ; mélange de coladeira et de zouk (cola zouk, cabo zouk) ; une voix dominante,
    très peu d'instruments, boîte à rythmes au battement nu, quasi-silences entre les coups,
    influence R&B (Discovering Kizomba) ;
  - Discovering Kizomba juge le ghetto zouk trop peu énergique pour la marche de la kizomba, mais
    adapté aux styles plus proches et « flottants » comme la tarraxinha ;
  - zouk love : version lente et romantique du zouk antillais, issue du compas enrichi en MIDI
    (voir [zouk-bresilien.md](zouk-bresilien.md)).

## 2. Tempo

| Source | Valeur | Niveau |
|---|---|---|
| Spec du handoff (`styles-de-danse.md`) | lent, ≈ 60 bpm, souvent 2 temps par cycle | interne |
| BeatKey (ghetto zouk / urban kiz) | 90–108 bpm | faible |
| BeatKey (zouk love) | 75–90 bpm | faible |
| Discovering Kizomba (ghetto zouk) | lent, sans chiffre | blog de pédagogue |

Les chiffres disponibles sont faibles et ne concernent pas le « suave » en tant que tel. La
valeur de 60 bpm de la spec n'a pas de source externe. Proposition : **72 bpm** par défaut,
plage 60–85.

## 3. Mesure et métrique

- 4/4. Sensation lente, beaucoup d'espace entre les coups (ghetto zouk, Discovering Kizomba).
- Proposition : temps 1 marqué, claquement léger sur le temps 3 (demi-tempo de type R&B).

## 4. Motif rythmique de base

Aucun motif propre. La grille ci-dessous est une **proposition** : la grille kizomba
(voir [kizomba.md](kizomba.md)) allégée selon la description du ghetto zouk (battement nu,
quasi-silences).

## 5. Instrumentation

- Une voix, très peu d'instruments, boîte à rythmes (Discovering Kizomba, ghetto zouk).
- Couleur R&B : nappes, piano électrique (proposition, d'après l'influence R&B mentionnée).

Timbres à imiter : `KICK_SOFT`, `RIM` doux, `CLAP` très léger, `PAD` chaud, `BASS` ronde.

## 6. Ligne de basse

- Non documentée pour le suave. Proposition : fondamentale tenue sur le temps 1, quinte sur le
  temps 3, sans levée (plus calme que la kizomba).

## 7. Harmonie et mode

- Non documentée. Proposition : accords de septième et de neuvième (couleur R&B), mineur :
  Am9 – Fmaj7 – Dm9 – E7sus4 puis E7.

## 8. Nuances et dynamique

- Très calme, intime (Paris Match). Aucune montée d'intensité ; les variations sont des
  retraits (on enlève des pistes).

## 9. Lien musique → mouvement

- Spec du handoff : balancement lent sur place, transferts partiels 60/40, souvent 2 temps par
  cycle ; vague séquentielle L5 → dorsales → tête.
- cours-kizomba.com (cité dans `styles-de-danse.md`) : talon levé, les fesses montent, on
  redescend et on change de pied ; base « 8 temps » selon Emove thérapie.

**Confrontation avec `src/styles.ts`.** Balancement latéral `S2` (2 temps), avant-arrière `S4`,
vague du tronc sur 4 temps, `support = −0,2·S2(b)` : cohérent avec « 2 temps par cycle ». Les
talons (`extraL/extraR`) suivent `S1`, un soulèvement par pied et par temps, plus vite que les
transferts : à vérifier. Voir [confrontation-moteur.md](confrontation-moteur.md).

## Spécification de synthèse

### Tempo

- Défaut : **72 bpm**. Plage : 60–85. Swing : 0,05 (proposition, détente légère).
- Tonalité : la mineur.

### Grilles (1 mesure de 4/4, 16 pas)

```
pas         1 . . . 2 . . . 3 . . . 4 . . .
KICK_SOFT   X . . . . . . . . . x . . . . .   (proposition)
RIM         . . . x . . x . . . . . . . . .   3-3-2 tronqué, doux (proposition)
CLAP        . . . . . . . . x . . . . . . .   demi-tempo très léger (proposition)
SHAKER      . . o . . . o . . . o . . . o .   rare (proposition)
BASS        R - - - - - - - 5 - - - - - - -   tenues (proposition)
```

### Instruments et harmonie

| Piste | Timbre | Réglages | Rôle |
|---|---|---|---|
| Nappe | `PAD`, attaque 600 ms | accords de 4 sons, −14 dB | couleur R&B |
| Piano électrique | sinus + sinus à l'octave avec trémolo 4 Hz | accords sur les pas 0 et 10, −18 dB | chaleur (proposition) |
| Basse | `BASS`, passe-bas 350 Hz | tenues | assise |

Harmonie : Am9 – Fmaj7 – Dm9 – E7sus4 (deux temps) puis E7 (deux temps).

### Accents et vélocités

- `KICK_SOFT` 0,8 ; `RIM` 0,35 ; `CLAP` 0,3 ; `SHAKER` 0,25.

### Variations sur 4 mesures (proposition)

| Mesure | Accord | Changement |
|---|---|---|
| 1 | Am9 | base |
| 2 | Fmaj7 | base |
| 3 | Dm9 | supprimer `RIM` |
| 4 | E7sus4 → E7 | supprimer `KICK_SOFT` au pas 10 ; seul le `PAD` tient la fin |

### Mapping temps → mouvement

| Temps | Mouvement (spec et cours-kizomba.com) |
|---|---|
| 1 | poids 60 % sur un pied, bassin vers ce côté |
| 2 | talon levé, les fesses montent (proposition de placement) |
| 3 | on redescend, poids 60 % sur l'autre pied |
| 4 | talon levé de l'autre côté |

Un « 2 temps » complet (gauche puis droite) dure 4 temps dans ce placement, ou 2 temps si l'on
garde la période actuelle `S2` du moteur. À valider.

## Références

- Paris Match Belgique, la rédaction (6 octobre 2017). « Kizomba : aux racines de la danse
  sensuelle de la joie angolaise ».
  https://www.parismatch.be/culture/scene/2017/10/06/kizomba-aux-racines-de-la-danse-sensuelle-de-la-joie-angolaise-FCHLOXIXIJASBBAL2OTT62BRQA/
- Discovering Kizomba (2024, d'après un post de 2021). « What is Ghetto Zouk? What is the
  connection to Kizomba and Zouk? ». https://discoveringkizomba.com/?p=92 (auteur non nommé).
- BeatKey, « How to Make Kizomba Music » et « How to Make Zouk Music ».
  https://beatkey.pages.dev/how-to-make-kizomba-music ;
  https://beatkey.pages.dev/how-to-make-zouk-music (commerciaux, faibles).
- Sources de pas déjà citées dans [`docs/styles-de-danse.md`](../styles-de-danse.md)
  (cours-kizomba.com, Emove thérapie) et spec biomécanique du handoff.
