# Semba : musique

Fil d'Ariane : [docs](../) › [musique](README.md) › **semba**

## 1. Origine et filiation

- Musique et danse de Luanda devenues très populaires dans les années 1950 (Wikipédia PT ;
  Kizombalove). Le mot signifie « umbigada » (coup de nombril) en kimbundu.
- Racines : la *massemba*, danse de couple à umbigada (le chanteur Carlos Burity, cité par
  Kuschick et Zattera 2013 et par Wikipédia PT) ; les rythmes de carnaval *kazukuta* et
  *kabetula* (Kizombalove, qui fait du semba une transformation du kazukuta ; Baratti 2020 parle
  de « semba kazukuta »).
- Passage à la guitare : le groupe N'gola Ritmos (fondé en 1947 ; Liceu Vieira Dias, José Maria,
  Nino Ndongo, Amadeu Amorim) a porté la massemba sur les guitares, d'où le semba (Wikipédia EN,
  « Ngola Ritmos », sans référence directe). Le groupe utilisait guitare, dikanza, ngomas,
  accordéon.
- Le semba porte une charge politique : musique de revendication avant l'indépendance de 1975
  (témoignages d'Amadeu Amorim et de Carlos Lamartine recueillis par Kuschick et Zattera 2013).
- Il est le prédécesseur direct de la kizomba et du kuduro (Wikipédia PT). Dans les années 1970,
  la rumba congolaise associée au semba donne la rumba angolaise.
- Point de méthode important : Amadeu Amorim y regrette que le genre ne soit pas écrit ni
  structuré ; même ses grands interprètes (Bonga, Os Kiezos) jouent de façons très
  singulières. **Il n'existe donc pas un motif canonique du semba.**

## 2. Tempo

| Source | Plage | Niveau |
|---|---|---|
| Kizomba Seattle (2014–2016) | 90–150 bpm | faible |
| BeatKey | 100–125 | faible |
| Angola Travel Guide (2026) | « mid-tempo », sans chiffre | faible |
| `src/styles.ts` et `docs/styles-de-danse.md` | ≈ 130 | interne |
| SongBPM, Bonga « Mona Ki Ngi Xica » | 95 (ou 190 en double tempo) | estimation algorithmique |

Les sources ne s'accordent pas. Une partie de l'écart vient du comptage : en 2/4 rapide, on peut
compter à la noire ou à la blanche. Proposition : **120 bpm à la noire** par défaut, plage
100–135, qui contient la valeur de 130 du moteur.

## 3. Mesure et métrique

- **2/4**, premier temps appuyé, second plus discret (African Music Library :
  « based on a 2/4 time signature »).
- Rythme syncopé, sur le contretemps, à caractère rebondissant, qualifié de « shuffle »
  (African Music Library) ; Kizomba Seattle parle d'une syncope « galopante » et précise qu'il
  n'y a pas de rythme zouk dans le semba.
- Angola Travel Guide : sensation nette de contretemps.

## 4. Motif rythmique de base

La source la plus précise est l'analyse de « João Domingu » (N'gola Ritmos, 1965) par Baratti
(2020), présentée comme typique du semba ancien et des années 1970 :
- deux ngomas, une grave et une aiguë ; la ngoma aiguë renforce la cellule de la dikanza,
  « occupying all sixteenth notes within a duple metre » ;
- la dikanza est plus improvisée, la ngoma aiguë plus fidèle au motif ;
- la ngoma grave marque le temps fort et souligne la basse (avant l'arrivée de la guitare basse) ;
- les percussions sont mixées dans l'aigu, en un maillage saturé.

Ce qui est documenté : la grille de doubles-croches pleine, le grave sur le temps fort. Ce qui
n'est **pas** documenté : la place exacte des accents de la dikanza. Les accents « galop »
ci-dessous sont une **proposition**.

## 5. Instrumentation

| Période | Instruments (Baratti 2020, sauf mention) |
|---|---|
| Années 1950–1960 (N'gola Ritmos) | ngomas grave et aiguë, dikanza (racleur en bambou, proche du reco-reco), deux guitares (soliste et rythmique), trois voix ; accordéon chez N'gola Ritmos (Wikipédia EN) |
| Fin des années 1960–1970 | guitare basse et congas (tumbas) à la place des ngomas, sonorité plus cubaine ; guitares électriques au jeu influencé par la guitare congolaise ; ajout du *mukindu* |
| Semba contemporain | congas avec batterie, tambourin en demi-lune à la place de la dikanza, clavier Casio imitant vents et cordes |

Kizomba Seattle ajoute batterie, reco-reco, piano, cuivres, cordes.

Timbres à imiter : `SCRAPER` (dikanza), `NGOMA_L`, `NGOMA_H` ou `CONGA_H`, `PLUCK` en deux
voix (rythmique et soliste), `BASS`, éventuellement `ACCORDION` pour une couleur ancienne.

## 6. Ligne de basse

- Années 1960 : la ngoma grave tient le rôle de basse sur le temps fort (Baratti 2020).
- Ensuite, guitare basse. Aucune source consultée ne transcrit une ligne de basse de semba.
- Proposition : fondamentale sur le temps fort de chaque mesure de 2/4, quinte sur le second
  temps, anticipation de double-croche avant le changement d'accord.

## 7. Harmonie et mode

- Harmonie simple, surtout l'alternance **tonique–dominante** ; mélodie simple, issue de la
  tradition orale ; peu de forme fixe (Baratti 2020, à propos de « João Domingu », trait qui
  persiste ensuite).
- Le mode n'est pas précisé dans les sources consultées. Proposition : majeur (do majeur,
  C – G7), à valider à l'oreille.

## 8. Nuances et dynamique

- Festif et collectif, surtout dans le semba de l'âge d'or des années 1970 (Baratti 2020).
- Rebondissant, extraverti ; plus de distance entre guideur et suiveur que dans la kizomba
  (Kizomba Seattle).
- Textes sur la vie quotidienne et la liberté, en kimbundu, umbundu, kikongo (Kizombalove) :
  sans incidence sur la synthèse, puisqu'aucune voix n'est prévue.

## 9. Lien musique → mouvement

- Angola Travel Guide (cité dans [`styles-de-danse.md`](../styles-de-danse.md)) : triple pas
  vite-vite-lent, « 1-2-3, pause », petit rebond de hanche à chaque temps, le rebond venant des
  genoux.
- O'Dance Events : rebond marqué, changements de direction nets.

**Confrontation avec `src/styles.ts`.**
- `support = −S2(b)` : un transfert régulier par temps, plein appui à `b = 0,5 ; 1,5`. Le
  « 1-2-3, pause » demanderait trois transferts puis une tenue, donc un cycle de 8 temps pour
  revenir au même pied.
- `root.y = 0,055·|S1(b)| − 0,055` a une **période d'un demi-temps** : deux rebonds par temps, au
  plus bas sur `b = 0 ; 0,5`. À 130 bpm, cela fait 4,3 rebonds par seconde. La source décrit un
  rebond par temps.
- `extraL/extraR` (bascule du pied) suivent `S1` : chaque pied se soulève une fois par temps,
  alors que les pas alternent tous les temps.
Voir [confrontation-moteur.md](confrontation-moteur.md).

## Spécification de synthèse

### Tempo

- Défaut : **120 bpm** (noire). Plage : 100–135. Swing : **0,15** (proposition, pour le
  caractère « shuffle »).
- Tonalité : do majeur.

### Grilles (deux mesures de 2/4 = 16 pas)

```
comptage 2/4  1 . . . 2 . . . 1 . . . 2 . . .
NGOMA_L       X . . . o . . . X . . . o . . .   grave sur le temps fort (Baratti) ; 2e temps discret (AML)
SCRAPER       X o o x x o o x X o o x x o o x   dikanza : toutes les doubles-croches (Baratti) ; accents « galop » (proposition)
NGOMA_H       x . . x x . . x x . . x x . . x   double les accents de la dikanza (Baratti : renforce la cellule)
PLUCK rythme  . . x . . . x . . . x . . . x .   contretemps de croche (proposition)
BASS          R - - . 5 - - . R - - . 5 - . 5   (proposition ; version années 1970+)
```

Version « ancienne » (années 1950–1960) : supprimer `BASS` et `PLUCK rythme`, garder `NGOMA_L`
comme seule basse, ajouter `ACCORDION` sur les accords en blanches.

### Instruments et harmonie

| Piste | Timbre | Réglages | Rôle |
|---|---|---|---|
| Guitare rythmique | `PLUCK`, accords de 3 sons | −16 dB, sons étouffés (décroissance 120 ms) | contretemps |
| Guitare soliste | `PLUCK` brillant (passe-bas 4 kHz) | arpèges en doubles-croches en tierces parallèles, pas 0–7 de la mesure 2 et 4, −18 dB | couleur congolaise des années 1970 (proposition) |
| Basse | `BASS` | suit la grille | assise |
| Dikanza | `SCRAPER` | panoramique +0,3, −12 dB | maillage aigu |
| Ngoma aiguë | `NGOMA_H` ou `CONGA_H` | panoramique −0,3 | double la cellule |

Harmonie : C (16 pas) puis G7 (16 pas), en boucle. Mesures 3–4 : même alternance.

### Accents et vélocités

- `NGOMA_L` : 1,0 sur les temps forts de 2/4, 0,35 sur les seconds temps.
- `SCRAPER` : 0,9 sur les accents, 0,35 sur les fantômes ; varier aléatoirement ±10 %, la
  dikanza étant décrite comme improvisée.
- `NGOMA_H` : 0,6, sans variation (plus fixe que la dikanza selon Baratti).

### Variations sur 4 grilles (proposition)

| Grille | Accord | Changement |
|---|---|---|
| 1 | C | base |
| 2 | G7 | base |
| 3 | C | dikanza : accents déplacés sur les pas 2 et 6 (improvisation) |
| 4 | G7 | break : silence de toutes les pistes sauf `NGOMA_L` sur les pas 12–15, puis reprise |

### Mapping temps → mouvement (comptage à la noire)

| Temps | Pas (Angola Travel Guide) | Rebond |
|---|---|---|
| 1 | pas pied A | genoux au plus bas sur le temps (proposition) |
| 2 | pas pied B | idem |
| 3 | pas pied A, petit pas avant ou arrière | idem |
| 4 | pause, poids sur A | rebond sans transfert |
| 5–8 | même chose en commençant par B | |

Cycle complet : **8 temps**. Le rebond a une période d'**un temps**.

## Références

- Baratti, Nina (2020). « Between Genre and Generations: Analyzing Angolan Popular Music ».
  *Etnografie Sonore / Sound Ethnographies*, III/2, p. 13 sq.
  https://www.soundethnographies.it/wp-content/uploads/2022/02/03-BARATTI.pdf (lu en entier ;
  s'appuie sur Moorman, *Intonations*, 2008).
- Kuschick, Mateus Berger ; Zattera, Vilson (2013). « O semba nos musseques de Angola: estudos
  preliminares ». *Anais do XXIII Congresso da ANPPOM*, Natal, UFRN.
  https://anppom.org.br/anais/anaiscongresso_anppom_2013/2406/public/2406-6908-1-PB.pdf
- Wikipédia PT, « Semba », https://pt.wikipedia.org/wiki/Semba, consulté le 2026-11-19.
- Wikipédia EN, « Ngola Ritmos », https://en.wikipedia.org/wiki/Ngola_Ritmos, consulté le
  2026-11-19.
- Kizombalove Academy, « Semba history: music ». https://kizombalove.com/en/semba-history/music/
  (non daté).
- African Music Library, « Semba ». https://africanmusiclibrary.org/genre/Semba (anonyme,
  faible).
- Kizomba Seattle (2014, mis à jour 2016). « How to Recognize Tarraxinha, Kizomba and Semba
  Music ». https://kizombaseattle.blogspot.com/2014/10/how-to-recognize-tarraxinha-kizomba-and.html
- Angola Travel Guide (2026). « Angola Music and Dance ».
  https://angolatravelguide.com/angola-music-dance/ (anonyme, faible).
- BeatKey, « How to Make Kizomba Music » (section semba).
  https://beatkey.pages.dev/how-to-make-kizomba-music (commercial, faible).
- SongBPM, Bonga « Mona Ki Ngi Xica ». https://songbpm.com/@bonga/mona-ki-ngi-xica (estimation
  algorithmique).
