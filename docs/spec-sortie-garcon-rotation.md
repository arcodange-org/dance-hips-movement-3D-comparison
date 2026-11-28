# Spec — Sortie garçon : la suiveuse recule droit au « 1 », le couple tourne à partir du « 2 » (#220)

Issue : #220. Empilée sur #218 (sorties, la hanche porte le pas, #213), même fichier (`src/sortieGarcon.ts`).

## La règle (27 novembre)

- Au « 1 », la suiveuse recule tout droit : son D part vers l'arrière, dans l'axe, en réponse à l'avancée du G du
  guideur. Le guideur peut s'aider d'une contraposition (buste tourné contre son bassin) pour la mener.
- La rotation du couple commence quand le D du guideur quitte le sol pour poser le « 2 », pas avant.

## Le modèle aujourd'hui

Mesuré dans le mode jeu (pas de base → sortie garçon → pas de base ; kizomba, quinconce, amplitude 1, ginga par défaut,
contraposition 1) : son D recule de 16,8 cm et glisse de 2,7 cm vers sa droite (9° hors de l'axe), son bassin de 13 cm
et 5,7 cm ; le D du guideur quitte le sol à 1,02 ; le couple ne tourne pas (bassins à moins de 2° de leur direction de
départ) : le guideur contourne la suiveuse en se déplaçant.

## Prototypes (`?sortieTour=<nom>`, rien ne change sans le paramètre)

Module `src/sortieGarcon.ts` (`SORTIE_TOURS`, `SORTIE_TOUR`, `setSortieTour`), lu par le comparateur (`App.tsx`) et le
mode jeu (`GuidageApp.tsx`).

- **Le « 1 » droit** (tous les candidats) : son D1 recule depuis là où il est (il glissait vers le couloir de référence),
  son bassin aussi ; le D2 du guideur se pose d'autant plus à sa droite, pour que les pieds D restent aussi proches à la
  position 2 (contact D/D, #130).
- **La rotation** : de `from` à `until` (temps de la figure), d'un angle `angle`, autour d'un centre (`couple` : le
  milieu des deux bassins à la position 2 ; `suiveuse` : son bassin là). Chaque pied se pose là où la figure le met dans
  le couple tourné d'autant qu'à sa pose ; le pied qui porte pivote sur son avant-pied pendant ce temps (il ne glisse
  pas) ; le bassin tourne avec le couple. Tous les pieds se reposent après `until` (D4 du guideur à 3,65, G4 de la
  suiveuse à 3,55, les markas) : la figure finit rigidement tournée et le mode jeu enchaîne dans le couple tourné.
- **Le chemin d'un pied en vol** est dessiné dans le couple tourné d'autant que le pied le demande (`SORTIE_TOUR_PATH`) :
  pour la suiveuse, de l'angle où il est parti à celui où il se pose (son D3, qui recule le long de son G2) ; pour le
  guideur, l'angle du moment (son D4, qui revient autour de son G3 posé tard dans la rotation). L'inverse fait se toucher
  les semelles.
- L'enchaînement sortie fille → sortie garçon (#90) et l'ida inséré (#91) gardent la sortie sans rotation.

## Les candidats

Rotation dans le sens des aiguilles d'une montre vu de dessus (vers la droite du guideur) : la suiveuse se tourne vers
lui, qui est sorti vers sa gauche ; il n'a plus à revenir sur la ligne d'avant, la ligne vient à lui. Tous partent au
décollage de son D (temps 1) et montent sans à-coup (`ease5`).

| `?sortieTour=` | angle | centre | jusqu'à |
| --- | --- | --- | --- |
| `sansTour` | aucun (le « 1 » droit seul) | | |
| `tour45` | 45° | milieu du couple à la position 2 | la rentrée du « 4 » (3,5) |
| `tour45Suiveuse` | 45° | la suiveuse | 3,5 |
| `tour45Trois` | 45° | milieu du couple | le croisé du « 3 » (3) |
| `tour60` | 60° | milieu du couple | 3,5 |
| `gauche45` | 45° vers la gauche du guideur | milieu du couple | 3,5 |

Mesures (GLB réel ; mode jeu : pas de base → sortie garçon → pas de base, kizomba, quinconce, amplitude 1) :

| | aujourd'hui (#218) | `sansTour` | `tour45` | `tour45Suiveuse` | `tour45Trois` | `tour60` | `gauche45` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| son D au « 1 » | 16,8 cm en arrière, 2,7 de côté | **16,8 cm, 0 de côté** | pareil | pareil | pareil | pareil | pareil |
| son bassin au « 1 » | 13 cm, 5,7 de côté | 13 cm, 2,2 de côté | pareil | pareil | pareil | pareil | pareil |
| le couple a tourné | jamais | jamais | 2° à 1,42 à 1,54 ; 15° au « 2 » ; 45° | pareil | pareil (plus vite) | 60° | 45° vers la gauche |
| os croisés (`sonde_croisements_couple`, 8 configurations de 513 poses) | 0 | 0 | **0** | 0 | 0 | 0 | 4 par configuration |
| os et pieds avec le ginga du mode jeu (`test_ginga_couple`, trois réglages) | rien | rien | **rien** | rien | `ample` : 4 os, 3 pieds | 9 à 39 pieds, 4 os | |
| semelles, quinconce amplitude 1 (le mode jeu) | disjointes | disjointes | **disjointes** | disjointes | ses pieds, 1 échantillon | 38 échantillons | son G et son D, 1 échantillon |
| semelles, autres placements (amplitudes 0,5 et 1) | disjointes | disjointes | face à face disjointes ; référence, 1 échantillon à 3,36 | disjointes | 5 échantillons | 36 | 34 à 36 |
| semelles, amplitude 2 | disjointes | disjointes | 40 échantillons | 13 (ses propres pieds) | 92 | 84 | 1 |
| bassin en hauteur, guideur / suiveuse (cm/temps²) | 3 736 / 6 070 | 3 736 / 6 070 | 4 191 / 3 735 | 4 297 / 6 689 | | | |
| lacet du bassin, accélération au plus | 356 / 259 | 356 / 259 | 366 / 294 | 366 / 294 | | | |
| vitesse du bassin au plus (cm/temps) | 37 / 71 | 37 / 71 | 39 / 64 | 46 / 70 | | | 33 / 112 |

Le pied qui porte ne glisse jamais (son avant-pied reste où il s'est posé) et la fin est rigide (0,0 cm) pour tous les
candidats. Les à-coups en hauteur du bassin (3 700 à 6 000) sont ceux de la sortie de #218, vers la rentrée du D4 :
hors du périmètre de cette issue.

Écartés : 90° (118 à 164 croisements d'os dans ce sens, 129 à 141 dans l'autre) ; 75° (59 à 76) ; vers la gauche autour
de la suiveuse (212 à 286). Vers la gauche, le D3 de la suiveuse part en arrière vers sa droite, loin de son G ; vers
la droite, il passe derrière son G2 : c'est ce qui borne l'angle (60° : ses pieds se touchent).

## Proposition

**`tour45`** : le couple tourne de 45° vers la droite du guideur, autour du milieu du couple à la position 2, du
décollage de son D pour le « 2 » jusqu'à la rentrée du « 4 ». C'est à peu près l'angle dont il est sorti de la ligne à
la position 2 (39°) : il finit face à elle sans revenir sur la ligne d'avant. Rien ne se croise, avec ou sans ginga, et
les semelles restent disjointes dans le quinconce du mode jeu. `tour45Suiveuse` (elle est l'axe) est l'autre lecture
propre ; `tour45Trois` et `tour60` montrent ce que coûtent un tour plus court ou plus grand.

## Limites

- Le « 1 » droit écarte les pieds D de 2,7 cm à la position 2 (3,8 cm avant, #130) : le D2 du guideur qui la suivait
  amenait les cuisses droites l'une dans l'autre en suave avec le ginga.
- Amplitude 2 et placement de référence : quelques contacts de semelles (tableau).
- L'enchaînement sortie fille → sortie garçon (#90) et l'ida inséré (#91) ne tournent pas ; les allers-retours du mode
  jeu (#144) sur une sortie tournée ne sont pas encore mesurés.
- Une fois élu : R22 (le pas du guideur égale le recul qu'il provoque) et les tests de la sortie garçon (hachages
  historiques) à reprendre.
