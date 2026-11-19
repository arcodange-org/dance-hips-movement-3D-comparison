# Zouk brésilien (et zouk antillais) : musique

Fil d'Ariane : [docs](../) › [musique](README.md) › **zouk brésilien**

Le zouk brésilien est une **danse** ; le zouk antillais est une **musique**. Discovering Kizomba
le résume ainsi : « Brazilian Zouk is a dance without its own music. » Cette page décrit donc
d'abord la musique d'origine, puis ce que les danseurs brésiliens en ont fait.

## 1. Origine et filiation

### Zouk antillais (musique)

- Mouvement musical et danse des Antilles françaises (Guadeloupe, Martinique), lancé par le
  groupe **Kassav'** au début des années 1980 (Wikipédia EN « Zouk »). Kassav' est fondé à Paris
  en 1979 par Jacob Desvarieux, Pierre-Édouard Décimus et Freddy Marshall (Mendez, RBMA, 2015).
- Le premier zouk, rapide et carnavalesque (*zouk béton*, *zouk chiré*), est une synthèse de
  kadans, de konpa et de biguine (Wikipédia EN, citant Manuel, Bilby et Largey 2012 ; Guilbault
  1993).
- Mendez (RBMA) : Décimus et Desvarieux posent des rythmes de gwo ka sur un battement régulier
  entre compas haïtien et funk, avec tambour et ti-bois ; ils travaillent en studio avec boîtes
  à rythmes et synthés (« Décimus and Desvarieux experimented with drum machines and
  synthesizers. »). Le titre de 1984 « Zouk la sé sèl médikaman nou ni » s'appuie sur le rythme
  guadeloupéen *mendé*.
- Wikipédia EN « Music of Martinique » : éléments de gwo ka, tambour, ti bwa et biguine vidé
  très présents dans le zouk (phrase sans référence directe ; le paragraphe cite Guilbault 1993).
- **Zouk love** : version lente et romantique des années 1990. Wikipédia EN la décrit comme un
  compas enrichi en MIDI, difficile à distinguer du compas (citant Occo 2019 et Ellingham 1999).

### Zouk brésilien (danse)

- Né au Brésil au début des années 1990 de la **lambada** (Wikipédia EN « Brazilian Zouk »).
- La lambada vient du Pará (carimbó) ; après 1994, la musique lambada s'efface et
  « the dancers began to use other musical sources », dont le zouk caribéen (Wikipédia EN
  « Lambada (dance) ») ; la danse prend dans une grande partie du Brésil le nom de zouk-lambada.
- À Rio, Adílio Porto et Renata Peçanha créent le style « traditionnel » ; le *lambazouk*
  (Porto Seguro) reste plus proche de la lambada ; viennent ensuite le neozouk et le soulzouk
  (Wikipédia EN « Brazilian Zouk », article signalé comme manquant de sources).
- Musiques actuelles : zouk antillais, puis R&B, pop, hip-hop, musiques contemporaines
  (Wikipédia EN « Brazilian Zouk »). Dans les années 2010, zouk brésilien et kiz européen
  partagent le même répertoire de ghetto zouk (Discovering Kizomba).

## 2. Tempo

| Musique | Source | Valeur | Niveau |
|---|---|---|---|
| Zouk antillais d'origine | Wikipédia EN « Zouk », citant Torres 2013, p. 453 | 120–145 bpm | documenté |
| Kassav' « Zouk la sé sèl médikaman nou ni » | SongBPM | 139 bpm, do majeur | estimation algorithmique |
| Kassav' « Syé bwa » | SongBPM | 131 bpm, mi majeur | estimation algorithmique |
| Zouk love | BeatKey | 75–90 bpm | faible |
| Danse zouk brésilien | Bath Zouk | 60–90 bpm ; boucle d'exercice à 75 | pédagogue |
| Danse zouk brésilien | BeatKey | 80–100 bpm | faible |
| Moteur (`styles-de-danse.md`) | spec du handoff | ≈ 110 | interne |

Le zouk brésilien se danse nettement plus lentement que le zouk antillais d'origine. La valeur
de 110 bpm de la spec est au-dessus des deux sources de danse. Proposition : **80 bpm** par
défaut, plage 60–100.

Comptage : Bath Zouk distingue un comptage en « temps pleins » (1, 3, 4) et un comptage en
« demi-temps » (1, 2, et). Les 60–90 bpm se comprennent en temps pleins (hypothèse : c'est la
lecture qui rend la table cohérente).

## 3. Mesure et métrique

- 4/4 binaire.
- Zouk antillais : figure guide **3-3-2** (deux valeurs longues, une courte). Britannica
  (articles « Zouk » et « Mizik zouk ») dit qu'elle était surtout portée par la charleston
  (consulté seulement via les extraits du moteur de recherche : la page renvoie une erreur 403).
  Wikipédia EN « Tresillo » : dans le zouk, le rythme du tibwa est souvent réduit à un 3+3+2
  presque constant, joué en rimshots sur la caisse claire, la charleston ou le chacha jouant un
  dérivé tresillo-cinquillo (phrase sans référence directe). **Les deux sources n'attribuent pas
  le 3-3-2 au même instrument.**
- Drumeo (2019) : la plupart des enregistrements de zouk utilisent une boîte à rythmes ; grosse
  caisse sur chaque noire, cross-stick afro-caribéen proche du calypso, charleston en
  doubles-croches syncopées.
- Zouk brésilien : rythme de danse **lent-vite-vite**, « boom-chick-chick » (Bath Zouk :
  « Zouk is danced in a slow-quick-quick rhythm. ») ; variante tresillo (lent-lent-vite).

## 4. Motif rythmique de base

| Motif | Positions sur 16 pas | Source |
|---|---|---|
| Boom-chick-chick (temps pleins) | boom 0 ; chick 8 et 12 | Bath Zouk |
| Variante tresillo | boom 0 ; chick 6 et 12 (3+3+2 en croches) | Bath Zouk |
| 3-3-2 en doubles-croches (zouk antillais) | 0, 3, 6, puis 8, 11, 14 | Britannica, Wikipédia (voir ci-dessus) |
| Grosse caisse en noires (zouk antillais) | 0, 4, 8, 12 | Drumeo |

## 5. Instrumentation

- Zouk antillais : gwo ka, tibwa, shak-shak, cuivres, synthétiseur, guitare, basse, boîte à
  rythmes (Wikipédia EN, infobox) ; tempo rapide, rythme mené par les percussions, section de
  cuivres puissante (Torres, via Wikipédia : « fast tempo (120–145 bpm), a percussion-driven
  rhythm, and a loud horn section »).
- Kassav' : basse de Georges Décimus, piano de Jean-Claude Naimro, arrangements de cuivres
  (Mendez, RBMA).
- Zouk brésilien : la musique est empruntée (zouk love, R&B, pop) ; BeatKey (faible) conseille
  shaker et cordes pour le « zouk brésilien », güiro et cuivres pour le zouk antillais.

Timbres à imiter : `KICK`, `RIM`, `HAT_C`, `SHAKER` (shak-shak), `CONGA_L` (gwo ka), `BASS`,
`PAD` et nappes de cordes, `BRASS` pour la version antillaise rapide.

## 6. Ligne de basse

- Basses de Georges Décimus décrites comme redoutables, sans transcription (Mendez, RBMA).
- BeatKey (faible) : basse lisse et chromatique, qui suit la grosse caisse.
- Proposition pour le zouk brésilien : fondamentale sur le « boom », notes sur les deux « chick »
  en version tresillo (pas 0, 6, 12).

## 7. Harmonie et mode

- Les titres de Kassav' estimés par SongBPM sont en majeur (do, mi).
- BeatKey (faible) : zouk love souvent en mineur, cadence i–iv–V7–i ; zouk de carnaval en majeur.
- Proposition pour le zouk brésilien : mi mineur, Em – C – Am – B7.

## 8. Nuances et dynamique

- Zouk antillais d'origine : festif, rapide, cuivres forts (Torres).
- Zouk love et zouk brésilien : lent, romantique, lyrique ; la danse vit de la fluidité, des
  cambrés et des vagues du tronc (spec du handoff).
- Lambazouk : mouvement continu, sans arrêt (Wikipédia EN « Brazilian Zouk »).

## 9. Lien musique → mouvement

- Bath Zouk : pas lent sur le temps 1 (il dure 2 temps), pas rapides sur 3 et 4 ; puis l'autre
  côté sur 5, 7, 8.
- Spec du handoff : catch tardif du temps, élasticité, variations de niveau.

**Confrontation avec `src/styles.ts`.** `support = −S2(b)` fait un transfert régulier par temps,
plein appui à `b = 0,5 ; 1,5`. Le basic lent-vite-vite demande des transferts sur 0, 2 et 3, puis
4, 6 et 7, donc un cycle de **8 temps** ; le moteur limite les styles à des périodes qui divisent
4. Le niveau (`S4`, 4 temps) et le cambré ne posent pas de problème de tempo. Voir
[confrontation-moteur.md](confrontation-moteur.md).

## Spécification de synthèse

### Tempo

- Défaut : **80 bpm** (zouk brésilien sur musique de type zouk love). Plage : 60–100.
- Gabarit de référence « zouk antillais » (pour comparaison, pas un style de l'app) : 130 bpm,
  plage 120–145.
- Tonalité : mi mineur.

### Grilles du zouk brésilien (1 mesure de 4/4, 16 pas)

```
pas         1 . . . 2 . . . 3 . . . 4 . . .
KICK        X . . . . . . . . . . . . . . .   « boom » (Bath Zouk)
RIM         . . . . . . . . x . . . x . . .   « chick-chick » sur 3 et 4 (Bath Zouk)
HAT_C       x . . x . . x . x . . x . . x .   3-3-2 en doubles-croches (Britannica, via extrait)
SHAKER      o o x o o o x o o o x o o o x o   continu, accent sur les contretemps (proposition)
BASS        R - - - - - - - 5 - - - R - - -   suit le boom-chick-chick (proposition)
```

Variante tresillo (Bath Zouk) : `RIM` → `. . . . . . x . . . . . x . . .` et
`BASS` → `R - - - - - 5 - - - - - R - - -`.

### Gabarit zouk antillais (référence, 130 bpm)

```
pas         1 . . . 2 . . . 3 . . . 4 . . .
KICK        X . . . x . . . X . . . x . . .   noires (Drumeo)
RIM         x . . x . . x . x . . x . . x .   tibwa réduit au 3+3+2 (Wikipédia « Tresillo »)
HAT_C       x x . x x . x x x x . x x . x x   doubles-croches syncopées (Drumeo ; placement : proposition)
CONGA_L     . . . . . . x . . . . . . . x .   gwo ka (présence documentée, placement : proposition)
BRASS       accords en stabs aux pas 14 et 15 de la mesure 4 (proposition)
```

### Instruments et harmonie (zouk brésilien)

| Piste | Timbre | Réglages | Rôle |
|---|---|---|---|
| Cordes | `PAD` avec attaque 700 ms, passe-bas 2 kHz | −14 dB, montée de +3 dB sur la mesure 4 | lyrisme |
| Guitare | `PLUCK` nylon (passe-bas 2,5 kHz) | arpèges en croches sur les contretemps, −18 dB | mouvement |
| Basse | `BASS` | suit la grille | assise |

Harmonie : Em – C – Am – B7, une mesure par accord.

### Accents et vélocités

- `KICK` 0,9 ; `RIM` 0,65 sur le pas 8, 0,55 sur le pas 12 ; `HAT_C` 0,4 ; `SHAKER` 0,3 à 0,5.

### Variations sur 4 mesures (proposition)

| Mesure | Accord | Changement |
|---|---|---|
| 1 | Em | base |
| 2 | C | base |
| 3 | Am | variante tresillo |
| 4 | B7 | `KICK` supprimé ; cordes en crescendo : moment de cambré ou de vague |

### Mapping temps → mouvement

| Temps | Pas (Bath Zouk, temps pleins) |
|---|---|
| 1 | pas lent, pied A, poids qui arrive sur le temps et reste 2 temps |
| 2 | suite du pas lent (élasticité, catch tardif de la spec) |
| 3 | pas rapide, pied B |
| 4 | pas rapide, pied A |
| 5–8 | même chose en commençant par B |

Cycle complet : **8 temps**.

## Références

- Wikipédia EN, « Zouk », https://en.wikipedia.org/wiki/Zouk, consulté le 2026-11-19 (cite
  Torres, George (2013). *Encyclopedia of Latin American Popular Music*. ABC-CLIO, p. 453 ;
  Guilbault, Jocelyne (1993). *Zouk: World Music in the West Indies*. University of Chicago
  Press ; Occo 2019 ; Ellingham 1999 ; Manuel, Bilby et Largey 2012 ; ouvrages non consultés
  directement).
- Mendez, Hugo (2 décembre 2015). « Zouk: An Introduction ». *Red Bull Music Academy Daily*.
  https://daily.redbullmusicacademy.com/2015/12/zouk-feature
- Wikipédia EN, « Music of Martinique », https://en.wikipedia.org/wiki/Music_of_Martinique,
  consulté le 2026-11-19.
- Wikipédia EN, « Tresillo (rhythm) », https://en.wikipedia.org/wiki/Tresillo_(rhythm), consulté
  le 2026-11-19.
- Britannica, « Zouk » et « Mizik zouk ». https://www.britannica.com/art/zouk ;
  https://www.britannica.com/art/mizik-zouk (accès direct refusé, 403 ; contenu lu uniquement
  dans les extraits du moteur de recherche : à vérifier).
- Drumeo (19 novembre 2019). « 5 Drumming Styles You've (Probably) Never Heard ».
  https://www.drumeo.com/beat/?p=19923
- Wikipédia EN, « Brazilian Zouk », https://en.wikipedia.org/wiki/Brazilian_Zouk, consulté le
  2026-11-19.
- Wikipédia EN, « Lambada (dance) », https://en.wikipedia.org/wiki/Lambada_(dance), consulté le
  2026-11-19.
- Discovering Kizomba (23 février 2021). « Zouk: born in the Caribbean, adopted by
  Brazilians ». https://discoveringkizomba.com/zouk-caribbean-brazilian/ (auteur non nommé).
- Bath Zouk, « Music & Rhythm ».
  https://bathzouk-astro.pages.dev/library/fundamentals/concepts/rhythm (non daté).
- BeatKey, « How to Make Zouk Music ». https://beatkey.pages.dev/how-to-make-zouk-music
  (commercial, faible).
- SongBPM, Kassav' « Zouk la sé sèl médikaman nou ni » et « Syé bwa ».
  https://songbpm.com/@kassav/zouk-la-se-sel-medikaman-nou-ni ;
  https://songbpm.com/@kassav/sye-bwa (estimations algorithmiques).
- Fanfant, Jean-Philippe (2007). *Afro-Caribbean Grooves for Drumset*. Sher Music Co.
  (chapitres « Zouk », « Zouk love » : non consultés, sommaire seulement).
