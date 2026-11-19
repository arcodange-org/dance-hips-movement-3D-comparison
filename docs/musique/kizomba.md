# Kizomba : musique

Fil d'Ariane : [docs](../) › [musique](README.md) › **kizomba**

## 1. Origine et filiation

- Angola, fin des années 1970 et années 1980. Wikipédia EN place les origines à la fin des
  années 1970 (infobox : 1984) ; Wikipédia FR la fait naître en 1980 d'une fusion du zouk
  antillais et du semba, avec un tempo plus lent (**documenté**, encyclopédique).
- Eduardo Paim est présenté comme le « père » de la musique kizomba (Wikipédia EN, qui cite ses
  entretiens de 2012–2013). Selon Discovering Kizomba, Paim date le début vers 1979, avant
  l'arrivée du zouk, et cite comme influences les styles haïtiens **konpa et kadans**
  (**documenté**, mais blog de pédagogue).
- L'explication la plus courante, zouk de Kassav' plus semba, est donc **discutée** : la
  tournée de Kassav' en Afrique arrive après les débuts décrits par Paim. Wikipédia FR attribue
  l'arrivée du zouk en Angola à cette tournée.
- Le chanteur Waldemar Bastos, cité par Baratti (2020), voit la kizomba comme le produit de
  l'hégémonie des musiques antillaises après 1977, une musique de danse sans message politique.
- Instrumentation électronique : Wikipédia EN décrit un rythme
  « slow, insistent, somewhat harsh yet sensuous » dû aux percussions électroniques, et une
  ligne de basse plus forte que dans le semba.

## 2. Tempo

| Source | Plage | Niveau |
|---|---|---|
| Kizomba Seattle (2014, corrigé 2016) | 80–120 bpm | faible (blog de pédagogue) |
| Melodigging, fiche « kizomba » | 86–100, environ 90 courant | faible (anonyme) |
| BeatKey, guide de production | 80–100 ; « traditionnelle » 82–95 | faible (commercial) |
| Angola Travel Guide (2026) | 60–80 | faible (anonyme) |
| `docs/styles-de-danse.md` (spec du handoff) | ≈ 90 | interne |

Les sources se recouvrent autour de **85–95 bpm** ; seul Angola Travel Guide descend à 60–80,
peut-être en comptant à la blanche (hypothèse). Les estimations algorithmiques de SongBPM pour
des titres d'Eduardo Paim vont de 102 à 173 bpm : elles sont incohérentes avec les sources de
danse et trahissent probablement des erreurs de double tempo. Elles ne sont pas retenues.

## 3. Mesure et métrique

- 4/4 binaire (Wikipédia FR : les pas comptent 3 ou 5 temps sur une musique à 4 temps ;
  Melodigging).
- Wikipédia FR : la musique « ressemble par sa rythmique à la musique zouk ».
- Accent : divergence. Angola Travel Guide décrit une batterie posée qui s'appuie sur le
  deuxième temps ; Melodigging place une caisse claire ou un clap détendu sur le temps 3
  (sensation demi-tempo) ; BeatKey met la caisse sur 2 et 4. Ces trois sources sont faibles.

## 4. Motif rythmique de base

Éléments documentés :
- héritage zouk : figure 3-3-2 (voir [zouk-bresilien.md](zouk-bresilien.md), § zouk antillais) ;
- percussions électroniques, peu denses ; Melodigging conseille de privilégier l'espace ;
- grosse caisse douce sur les temps forts (Melodigging) ; BeatKey ne la met que sur le temps 1.

La grille ci-dessous est une **simplification pédagogique** (proposition) qui combine ces
éléments.

## 5. Instrumentation

- Wikipédia FR (infobox) : guitares, percussions, batterie, synthétiseur.
- Kizomba Seattle : instruments réels (batterie, percussions, guitare, cuivres) dans la kizomba
  « old school », par opposition à la tarraxinha entièrement synthétique.
- Angola Travel Guide : synthétiseurs, boîtes à rythmes, groove plus lisse et plus lent que le
  semba.
- Melodigging (faible) : nappes, claviers doux, guitare électrique claire avec chorus ou délai,
  en accords ou en arpèges.

Timbres à imiter : `KICK_SOFT`, `RIM`, `CLAP` léger, `SHAKER`, `BASS` ronde, `PAD`, `PLUCK`
avec chorus.

## 6. Ligne de basse

- Basse plus forte que dans le semba (Wikipédia EN, **documenté**).
- BeatKey (faible) : fondamentale sur le temps 1, quinte sur le temps 3, levée de double-croche
  avant le temps 1, jeu lié plutôt que piqué.
- Melodigging (faible) : sub-basse chaude qui dessine les fondamentales, avec syncopes et
  anticipations.

## 7. Harmonie et mode

- Mineur ou modal, boucles de 2 à 4 accords (Melodigging : i–VI–III–VII ; BeatKey : i–iv–V7–i,
  i–V7). **Faible** : aucune source académique consultée ne traite l'harmonie de la kizomba.
- Proposition : ré mineur, Dm – Gm – A7 – Dm sur 4 mesures, une mesure par accord.

## 8. Nuances et dynamique

- Lente, romantique, sensuelle (Wikipédia EN et FR).
- Une danseuse interrogée par Paris Match Belgique (2017) la décrit comme très calme (voir
  [suave.md](suave.md)).
- Densité faible, espace entre les coups (Melodigging). Couplets et refrains d'intensité proche ;
  les breaks servent de pauses aux danseurs (proposition, non documenté).

## 9. Lien musique → mouvement

- Wikipédia FR décrit le « 2 temps » : l'homme déplace sa partenaire vers la gauche, puis vient
  marquer le sol (« marqua ») en joignant les pieds, et recommence à droite. Le « touch » se fait
  sans poids (cours-kizomba.com, cité dans [`styles-de-danse.md`](../styles-de-danse.md)).
- Angola Travel Guide : côté-ensemble-côté sur 2 temps, puis avant ou arrière sur 2 temps.
- O'Dance Events (cité dans `styles-de-danse.md`) : le guideur déplace son centre juste avant
  de poser le pied. Le poids arrive donc **sur** le temps.

**Confrontation avec `src/styles.ts`.** `support(b) = −S2(b)` fait un transfert complet par temps
(période de 2 temps pour gauche puis droite), avec le plein appui à `b = 0,5` et `1,5`, entre les
temps. Si la marqua est sans poids, le poids reste sur le même pied pendant deux temps et le cycle
gauche-droite dure 4 temps. Voir [confrontation-moteur.md](confrontation-moteur.md).

## Spécification de synthèse

### Tempo

- Défaut : **90 bpm**. Plage : 80–100. Swing : 0.
- Tonalité : ré mineur ; fondamentale D2 = 73,4 Hz.

### Grilles (1 mesure de 4/4, 16 pas)

```
pas         1 . . . 2 . . . 3 . . . 4 . . .
KICK_SOFT   X . . . . . . . x . . . . . . .   temps forts (Melodigging, faible)
RIM         x . . x . . x . x . . x . . x .   3-3-2 hérité du zouk (proposition)
CLAP        . . . . x . . . . . . . x . . .   2 et 4, léger (BeatKey, ATG ; faible)
HAT_C       . . x . . . x . . . x . . . x .   contretemps de croche (proposition)
SHAKER      o x o x o x o x o x o x o x o x   doubles-croches, accent sur les paires (BeatKey, faible)
BASS        R - - - - - . . 5 - - - . . . 5   fondamentale, quinte, levée (BeatKey, faible)
```

Variante « demi-tempo » (Melodigging) : remplacer la ligne `CLAP` par
`. . . . . . . . X . . . . . . .`.

### Instruments et harmonie

| Piste | Timbre | Réglages | Rôle |
|---|---|---|---|
| Nappe | `PAD` | accords de 4 sons (Dm7, Gm7, A7, Dm7), −14 dB | fond harmonique, une mesure par accord |
| Guitare | `PLUCK` + chorus (délai modulé 15 ms) | arpèges en croches sur les pas 2, 6, 10, 14, −18 dB | couleur, réponse entre les phrases |
| Basse | `BASS`, passe-bas 400 Hz | suit la grille, glissando de 30 ms vers la quinte | assise |

### Accents et vélocités

- `KICK_SOFT` 0,9 sur le temps 1, 0,6 sur le temps 3.
- `RIM` 0,5 ; légèrement plus fort (0,6) sur les pas 6 et 14, qui closent le 3-3-2.
- `CLAP` 0,45 ; ne jamais dépasser la grosse caisse (la caisse vive sonne hip-hop selon
  BeatKey).

### Variations sur 4 mesures (proposition)

| Mesure | Accord | Changement |
|---|---|---|
| 1 | Dm | grille de base |
| 2 | Gm | grille de base |
| 3 | A7 | basse : ajouter `3` (do dièse) au pas 12 |
| 4 | Dm | supprimer `HAT_C` et `SHAKER` sur les pas 12–15 (respiration), rim au pas 15 |

### Mapping temps → mouvement

| Temps | « 2 temps » avec marqua (Wikipédia FR) | Marche (un pas par temps) |
|---|---|---|
| 1 | pas latéral gauche, poids complet | pas, poids arrive sur le temps |
| 2 | marqua : pied droit joint, sans poids | pas sur l'autre pied |
| 3 | pas latéral droit, poids complet | pas |
| 4 | marqua : pied gauche joint, sans poids | pas |

Pour le moteur : `support` devrait valoir ±1 **sur** les temps où le pas porte le poids. Avec la
marqua sans poids, la période gauche-droite est de 4 temps (forme `S4` avec plateaux). Le choix
entre les deux colonnes est à faire valider par le propriétaire.

## Références

- Wikipédia EN, « Kizomba », https://en.wikipedia.org/wiki/Kizomba, consulté le 2026-11-19
  (cite notamment « Eduardo Paim "Sou o precursor da kizomba" », *O País*, 2012).
- Wikipédia FR, « Kizomba », https://fr.wikipedia.org/wiki/Kizomba, consulté le 2026-11-19.
- Discovering Kizomba (2024, d'après un post de 2021). « What is Ghetto Zouk? What is the
  connection to Kizomba and Zouk? ». https://discoveringkizomba.com/?p=92 (auteur non nommé).
- Baratti, Nina (2020). « Between Genre and Generations: Analyzing Angolan Popular Music ».
  *Etnografie Sonore / Sound Ethnographies*, III/2, p. 13 sq.
  https://www.soundethnographies.it/wp-content/uploads/2022/02/03-BARATTI.pdf
- Kizomba Seattle (2014, mis à jour 2016). « How to Recognize Tarraxinha, Kizomba and Semba
  Music ». https://kizombaseattle.blogspot.com/2014/10/how-to-recognize-tarraxinha-kizomba-and.html
- Melodigging, fiche « Kizomba ». https://www.melodigging.com/genre/kizomba (anonyme, faible).
- BeatKey, « How to Make Kizomba Music ». https://beatkey.pages.dev/how-to-make-kizomba-music
  (guide commercial anonyme, faible ; grille et accords utilisés comme point de départ).
- Angola Travel Guide (2026). « Angola Music and Dance ».
  https://angolatravelguide.com/angola-music-dance/ (anonyme, faible).
- Paris Match Belgique, la rédaction (6 octobre 2017). « Kizomba : aux racines de la danse
  sensuelle de la joie angolaise ».
  https://www.parismatch.be/culture/scene/2017/10/06/kizomba-aux-racines-de-la-danse-sensuelle-de-la-joie-angolaise-FCHLOXIXIJASBBAL2OTT62BRQA/
- SongBPM, page « Eduardo Paim », https://songbpm.com/@eduardo-paim (estimations
  algorithmiques fournies par Spotify ; non retenues).
- Sources de pas déjà citées dans [`docs/styles-de-danse.md`](../styles-de-danse.md)
  (cours-kizomba.com, O'Dance Events).
