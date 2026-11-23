# Spec #159 — le ginga « fait un 8 » : le chemin des hanches, lié au relais des genoux

[Accueil](../README.md) · [Ginga du couple](spec-ginga-couple.md) (#157) · [Ginga](spec-ginga.md) (#42) ·
[Règles du propriétaire](regles-proprietaire.md) ·
[Issue #159](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/159) ·
[Élection](elections/ginga-huit.md)

**Statut : prototypes à élire.** Rien n'est figé : les variantes ci-dessous n'ont pas passé les contrôles
sur le GLB. La variante élue sera ensuite codée et contrôlée.

## Demande du propriétaire (21 novembre 2026)

> le ginga c'est en lien avec les genoux en relais ou qui se chevauchent de la session atlas anatomique.
> Sauf que dans le sujet de l'atlas anatomique on a un allez retour pour le moment alors que dans la danse
> le chemin est différent. on dit souvent que l'"on fait un 8".
>
> C'est important cet aspect car ça va corriger le soucis de timing / changement de position brusque, qui
> font que les déplacements sont "robotiques" et non "organiques".

Sur le plan où se lit le « 8 » (vu de dessus : une hanche avance pendant que l'autre recule ; vu de face :
une hanche monte pendant que l'autre descend) :

> le 8 se lit dans les deux plans

> (j'ai envie de dire les 3 plans même)

### Paroles du 22 novembre 2026, après avoir vu le film refilmé avec le ginga de #157

À la question « Le ginga du couple se voit-il assez dans le final ? » (réglage `marque`, couple en pied) :

> Trop discret.

Sur le kompa :

> Le konpa est complètement faux actuellement: c'est le 8 le plus prononcé justement. Complémente les
> connaissances sur ce style.

Sur le semba :

> En semba le 2e rebond est fait comme un chacha en refaisant rapidement un petit rond du "8" de ginga avant
> de reprendre le mouvement de "8" plus grand.

Ce que ces paroles changent ici :

| Parole | Conséquence | Où |
|---|---|---|
| « Trop discret. » | La taille de `marque` (A, B, C, D) ne suffit pas. Une variante plus grande est ajoutée à l'élection (F). Le réglage par défaut de `main` est passé au plus grand réglage calibré, `ample` (#163, PR #164 fusionnée). | ici, et #163 |
| Kompa : « c'est le 8 le plus prononcé » | La recherche de sources est faite (#161). Prototypes du « 8 » du kompa, danseur seul, ajoutés à l'élection (question 4). Dans le mode jeu, le kompa ne reçoit aujourd'hui que le rebond : ni phase, ni « 8 ». | #161, plus bas |
| Semba : le 2e rebond « comme un chacha » | Le « 8 » du semba n'est pas régulier : un petit rond rapide au deuxième rebond, puis le grand. À prototyper sur le « 8 » élu. | #162 |

### Règles du 22 novembre 2026 (suite), après la quatrième version de la vidéo

La vidéo montrait chaque style de profil ; les prototypes de cette spec étaient à l'élection. Trois règles
(R33, R34 et R39) : le buste est au-dessus des genoux, légèrement devant ; le plus important est de n'avoir ni
saccade, ni téléportation, ni relais soudain entre la gauche et la droite, la transition (le transfert de
poids) étant la source du déhanché et de la trajectoire « en 8 » ; le double rebond du semba est un transfert
doublé vers le même côté, commencé vers le côté opposé puis repris vers le côté de départ.

| Règle | Conséquence | Où |
|---|---|---|
| Le buste au-dessus des genoux | Mesuré : le buste est 10 à 19 cm derrière les genoux dans tous les styles. Chantier à part. | #166, R33 |
| Ni saccade, ni téléportation, ni relais soudain | Le « 8 » est la trace d'un transfert de poids continu : un prototype se juge d'abord au passage d'un côté à l'autre (mesure `soudain`, plus bas). Les à-coups des figures, eux, ne viennent pas du ginga : chantier à part. | ici, #167, R34 |
| Semba : deux transferts de suite vers le même côté | Précise le « petit rond rapide » du matin : le poids part vers l'autre côté, n'y arrive pas, revient. Prototypes à élire, d'après le kompa élu ([élection](elections/ginga-huit.md)). | #162, R39 |

## Constat mesuré, après #157

Chemin de chaque hanche (articulation), en couple, pendant deux pas de marche, kizomba, réglage `marque`.
Depuis le 22 novembre la mesure est prise dans une séance du mode jeu (la marche commandée cinq fois de
suite, la troisième mesurée), avec ce que le jeu ajoute aux frontières entre figures ; la première mesure
prenait la figure seule, bouclée sur elle-même (4,2 cm de large pour le suiveur au lieu de 4,0).
Mesure : la **surface entourée** par le chemin dans chaque vue. Un aller-retour par le même chemin n'entoure
rien ; une boucle ou un « 8 » entoure une surface.

| | Largeur | Hauteur | Profondeur | Entouré vu de dessus | de face | de profil |
|---|---|---|---|---|---|---|
| Marche, hanche du leader | 2,8 cm | 1,9 cm | 0,3 cm | **0,0 cm²** | 1,3 cm² | 0,2 cm² |
| Marche, hanche du suiveur | 4,0 cm | 1,8 cm | 0,4 cm | **0,0 cm²** | 1,6 cm² | 0,1 cm² |
| Marche, leader, réglage `ample` (par défaut depuis #163) | 4,2 cm | 2,2 cm | 0,3 cm | **0,0 cm²** | 2,2 cm² | 0,2 cm² |
| Marche, suiveur, réglage `ample` | 6,0 cm | 2,3 cm | 0,4 cm | **0,0 cm²** | 2,8 cm² | 0,1 cm² |
| Pas de base (suave), pour comparer | 6,0 cm | 1,1 cm | 4,4 cm | 17,6 cm² (un « 8 ») | 0,7 cm² | 0,9 à 2,2 cm² |

- Vu de dessus, la hanche va et vient sur une ligne. Vu de face, elle fait une boucle mince. De profil,
  presque rien.
- **Pourquoi** : le roulis et le lacet du bassin sont en phase avec son déplacement latéral. Quand le
  bassin est à gauche, il est aussi incliné et tourné au maximum ; quand il revient, tout revient ensemble.
- **Le temps** : le bassin reste sur l'appui une demi-temps, puis traverse en une demi-temps. Pendant
  l'arrêt, rien ne bouge : c'est l'à-coup que le propriétaire décrit.
- **Le réglage `ample`**, par défaut depuis #163, agrandit la ligne sans en changer la forme : vu de dessus
  la hanche n'entoure toujours rien, et le bassin s'arrête encore (0,13 temps au lieu de 0,22).

### Le passage d'un côté à l'autre : brusque ou progressif

Mesure ajoutée après la règle du 22 novembre (pas de relais soudain entre la gauche et la droite).
`soudain` : la vitesse de pointe du bassin d'un côté à l'autre, divisée par celle d'un balancier
de même largeur et de même période. 1 = aussi progressif qu'un balancier ; 2 = deux fois plus brusque.
« Passage » : le temps que met le bassin à traverser la moitié centrale de son trajet.

| | `soudain` | Passage |
|---|---|---|
| Couple, marche, `marque` (A) ou `ample` (par défaut), avant #172 | **2,0** | 0,19 temps |
| Les mêmes depuis #172 (fusionnée) | **1,0** | 0,34 temps |
| B — « 8 » anguleux, avant #172 | 1,9 | 0,16 temps |
| C, D, E, F — « 8 » arrondis | 1,0 | 0,34 temps |
| Danseur seul : kizomba, semba, suave, tarraxinha, zouk | 1,0 | 0,34 temps |
| Danseur seul, kompa aujourd'hui (K0) | 4,6 | 0,16 temps (sur un cycle de 4 temps) |
| Danseur seul, kompa, prototypes (K1, K2, K3) | 1,0 | 0,66 temps |

- En couple, le ginga de #157 fait attendre le bassin sur l'appui, puis le fait passer de l'autre côté deux
  fois plus brusquement qu'un balancier : c'est le relais soudain que la règle écarte.
- Dans une marche, les deux passages ne se ressemblent pas. Le premier se fait en une demi-temps, puis le
  bassin attend une demi-temps. Le second est coupé par la frontière entre deux figures : la phase repart
  « posée » à chaque figure, le jeu efface l'écart en un temps, et ce passage finit lentement.
- Une première mesure donnait 6,0 : elle bouclait la figure sur elle-même et comptait le saut du bouclage,
  que le jeu ne montre pas. La mesure est maintenant prise dans une séance du jeu.
- Les prototypes arrondis ont le passage progressif des pas de base des styles. Ce qui les rend
  progressifs est le déplacement latéral qui suit la phase large (`round`), pas l'avance-recul ni les
  rotations : un aller-retour progressif, sans « 8 », est possible aussi.
- Les à-coups des figures elles-mêmes (hauteur du bassin dans les sorties, trajet du bassin dans la marche
  et le quart de tour) existent avec et sans ginga : ils sont mesurés et traités dans #167.

### Depuis #172 : la variante B rejoint C

#172 (transfert de poids continu, #167) moyenne la phase du déhanché sur une demi-temps de chaque côté et la
poursuit d'une figure à la suivante, dans tous les réglages. Mesuré ensuite dans une séance du jeu :

| | Passage | Entouré dessus (suiveuse) | Arrêt le plus long |
|---|---|---|---|
| A — aller-retour, `marque` | 0,98 | 0,0 cm² | 0,13 temps |
| Aller-retour, `ample` (par défaut) | 0,98 | 0,0 cm² | 0,09 temps |
| B — « 8 » anguleux | 0,98 | 5,7 cm² | aucun |
| C — « 8 » arrondi | 0,98 | 5,7 cm² | aucun |
| D, E, F | 0,98 | 5,7 ; 16,8 ; 33,5 cm² | aucun |

B ne différait de C que par la phase étroite de son déplacement latéral ; elle est maintenant aussi large que
celle de C, et B trace exactement le chemin de C. B est retirée de l'élection ; `ginga=huit` reste dans le code.
Les mesures de la suite de cette spec, sauf indication, datent d'avant #172.

## Idée : dans un « 8 », le bassin ne s'arrête jamais

Un aller-retour s'arrête à chaque bout. Dans un « 8 », un second mouvement, décalé dans le cycle, occupe
l'arrêt du premier : quand le bassin a fini d'aller sur l'appui, la hanche continue de tourner et de
monter. Le poids arrive, puis le genou d'appui se tend et pousse la hanche, pendant que l'autre genou se
plie et prépare le pas : les genoux se relaient.

Deux façons de le faire, qui s'ajoutent :

1. **Par les hanches.** Le roulis (une hanche monte, l'autre descend) et le lacet (une hanche avance,
   l'autre recule) gardent leur taille mais se décalent dans le cycle : le roulis d'un quart de temps, le
   lacet d'une demi-temps. Ils suivent une phase qui avance tout le long du temps (`GINGA_WIDE`), pas
   seulement pendant le transfert. Chaque hanche fait alors une boucle dans les trois vues.
2. **Par le centre.** Le bassin entier avance quand le poids arrive et recule avant qu'il reparte (une
   fois par appui), et le rebond est retardé d'un quart de temps (le genou cède après l'arrivée du poids).
   Le centre du bassin trace alors un « 8 » vu de dessus et vu de face, une boucle de profil — comme le
   pas de base en suave.

## Variantes à élire (prototypes)

Mesures sur la suiveuse, marche en kizomba dansée après une marche (régime établi, dans une séance du mode jeu). « Entouré » : surface
que le chemin d'une hanche entoure dans chaque vue. « Arrêt » : plus longue durée où le bassin bouge de
moins de 1 mm par seizième de temps.

| | `ginga=` | Balancement | Avance-recul | Entouré dessus | de face | de profil | Arrêt |
|---|---|---|---|---|---|---|---|
| A — aller-retour (le chemin d'aujourd'hui, à la taille du film) | `marque` | 4,0 cm | 0 cm | 0,0 cm² | 1,6 cm² | 0,1 cm² | 0,22 temps |
| Le même aller-retour, réglage par défaut depuis #163 (hors élection) | `ample` | 6,0 cm | 0 cm | 0,0 cm² | 2,8 cm² | 0,1 cm² | 0,13 temps |
| B — « 8 » anguleux | `huit` | 4,2 cm | 2,0 cm | 4,5 cm² | 1,8 à 4,0 cm² | 1,1 à 1,4 cm² | 0,06 temps |
| C — « 8 » arrondi | `huitRond` | 4,2 cm | 2,0 cm | 5,7 cm² | 1,8 à 3,0 cm² | 1,5 à 1,6 cm² | aucun |
| D — « 8 » arrondi, autre sens | `huitInverse` | 4,2 cm | 2,0 cm | 5,7 cm² | 1,3 à 2,4 cm² | 1,5 à 1,8 cm² | aucun |
| E — « 8 » arrondi, ample | `huitAmple` | 6,3 cm | 4,0 cm | 16,8 cm² | 4,7 à 5,5 cm² | 3,9 à 4,5 cm² | aucun |
| F — « 8 » arrondi, très ample | `huitGrand` | 8,4 cm | 6,0 cm | 33,5 cm² | 6,8 à 7,8 cm² | 5,7 à 7,0 cm² | aucun |

Pour le leader : balancement de 2,9 cm (4,4 cm en E, 5,9 cm en F), 3,1 à 4,0 cm² entourés vu de dessus
(11,8 en E, 23,5 en F).

- **B** : le roulis et le lacet décalés, l'avance-recul du bassin, le rebond retardé. Le déplacement latéral
  garde le rythme de #157 : le bassin attend sur l'appui, puis traverse. Vu de dessus, un nœud papillon.
- **C** : comme B, et le déplacement latéral suit aussi la phase qui avance tout le long du temps. Le
  bassin ne s'arrête plus ; vu de dessus, un « 8 » couché.
- **C et D, le sens.** En C le bassin part vers le pied d'appui en avançant et en revient en reculant ; en
  D c'est l'inverse. Lequel est celui de la danse n'est pas connu : c'est une question de l'élection.
- **E** : C en plus grand (balancement et rebond d'`ample`, avance-recul doublé, rotations × 1,5). Il
  approche le « 8 » du pas de base (17,6 cm²).
- **F** : ajoutée après « Trop discret. » : le double de C (balancement, rotations), avance-recul triplé.
  Deux fois la surface du « 8 » du pas de base. Son rebond reste celui d'`ample` (14 mm) : essayé à 20 mm,
  il faisait se croiser les genoux dans le pas de base et l'ida e volta (67 croisements relevés).
- Dans les sorties, le balancement et le rebond des variantes sont plafonnés à ceux de `marque`
  (`SORTIE_GINGA_CAP`, #157) au début et à la fin de la figure : les fémurs des deux danseurs se touchent
  au-delà. Entre les deux, depuis #163, les sorties lèvent ce plafond (`gingaCapRoom`) : E y prend la taille
  d'`ample`, F monte au-delà de ce qui a été calibré. L'avance-recul et les rotations ne sont pas plafonnés.

La phase continue d'une figure à la suivante (`gingaFrom`) : en #157 elle repartait posée sur l'appui à
chaque figure, donc toutes les deux temps dans la marche. Seuls les prototypes l'utilisent.

### Ce que les prototypes ne font pas

- **Les genoux ne sont pas le moteur, et ils s'éloignent de la règle élue.** Voir la section suivante.
- **Vu de face, le chemin est irrégulier.** La hauteur du bassin vient de la portée des jambes de la
  figure : dans la marche elle a un à-coup d'environ 7 mm, qui n'est pas du ginga (R3, #67).
- **Les contrôles sur le GLB ne sont pas passés.** Comptage des croisements d'os, refait après la fusion
  de #163 : 3 168 poses par variante, chaque figure dansée seule, les styles qui la proposent, amplitude 1,
  au seizième de temps dans les sorties et l'ida e volta, au huitième ailleurs.

  | | Quart de tour | Sortie fille et son enchaînement | Ida e volta (semba) | Pas de base (kompa) | Total |
  |---|---|---|---|---|---|
  | B | 5 | 8 | 0 | 0 | 13 |
  | C | 5 | 6 | 0 | 0 | 11 |
  | D | 2 | 6 | 0 | 0 | 8 |
  | E | 18 | 4 | 4 | 1 | 27 |
  | F | 26 | 6 | 4 | 1 | 37 |

  Aucun croisement dans la marche ni dans la sortie garçon, où le plafond est pourtant levé. Le premier
  comptage, avant #163 et à un pas plus large, en relevait moins (4, 2, 2, 13, et 31 pour F) : le pas plus
  fin en trouve entre deux échantillons. Les enchaînements de figures, où la phase se poursuit, ne sont pas
  comptés. La variante élue devra déclarer ses marges (`gingaRoom`), comme #157.
- L'ida e volta et le pas de base gardent leur chemin actuel.

Elles se voient dans l'app avec `?mode=pair&guidage=1&demo=ginga&ginga=huitRond` (branche de cette PR, non
fusionnée). Les tracés viennent de `scripts/tracer_hanches.mjs`, les GIF de danse de
`scripts/capture_session_gif.mjs`.

## Le kompa : « c'est le 8 le plus prononcé » (#161)

La recherche de sources est sur la branche de la vidéo (`docs/recherche-danse/kompa.md`, #161). Ce qu'elle
apporte ici :

- au kompa lent, près de deux temps par pied, « on dessine un demi 8 avec le bassin sur chaque appui », la
  hanche allant « de l'avant vers l'arrière en passant par le côté » (manuel de Cliford et Gaëlle Jasmin,
  cité par *Le Nouvelliste*) ; hanches en huit dans la danse collée (Averill 1997, McAlister 2002) ;
- les genoux balancent les hanches, pieds au sol ;
- aucune source ne dit que ce « 8 » est le plus prononcé des styles : il n'y a là que la parole du
  propriétaire.

Le modèle (`src/styles.ts`) a le rythme du kompa lent, mais son bassin trace une ligne. Mesures, danseur
seul sur place, sur quatre temps :

| | `?style=kompa&kompa=` | Largeur | Avant-arrière | Entouré vu de dessus | Arrêt |
|---|---|---|---|---|---|
| K0 — aujourd'hui | (rien) | 20,6 cm | 0,3 cm | 1,0 cm² | 0,56 temps |
| K1 — « 8 » | `huit` | 20,1 cm | 6,0 cm | 76 à 82 cm² | aucun |
| K2 — « 8 » plus grand | `huitGrand` | 20,1 cm | 10,0 cm | 129 à 135 cm² | aucun |
| K3 — « 8 », autre sens | `huitInverse` | 20,1 cm | 6,0 cm | 77 à 82 cm² | aucun |

Pour comparer : le « 8 » du suave entoure 17,6 cm².

- **Le prototype** (`KOMPA_EIGHTS`, éteint par défaut) : le déplacement latéral ne s'arrête plus sur l'appui
  (il garde ses passages au centre, donc l'instant du transfert de poids) ; le bassin avance en partant vers
  l'appui et recule en revenant : c'est le sens du manuel. K3 fait l'inverse.
- **Ce qu'il ne change pas**, et que les sources contredisent : les genoux restent pliés du même angle (53°
  à 60°, sans mouvement en sens inverse : ils ne sont pas le moteur) ; le relâché du bassin sur le
  demi-temps avant chaque appui n'est pas montré ; le rythme reste celui du kompa lent.
- En couple, le pas de base du kompa et ses marches ne reçoivent pas encore ce prototype.
- **Les genoux et le roulis du bassin** (mesuré le 23 novembre, sixième tour) : pieds à plat, la flexion d'un genou
  est fixée par la hauteur de sa hanche. Pour qu'une jambe fléchisse pendant que l'autre se tend, la hanche de la
  jambe fléchie doit descendre (`tilt` négatif), ou son talon se lever (`knees.heel`). Les variantes `genoux` à
  `profilFort` inclinaient le bassin de l'autre côté : la jambe d'appui y est la plus fléchie et les deux genoux
  dépassent 45°. Les variantes `alterne*` corrigent cela ([élection](elections/ginga-huit.md)).

## Le semba : d'après le kompa élu, avec son double rebond (#162)

Le kompa élu le 23 novembre (`assisBuste`) donne la mécanique : la hanche s'assoit quand le poids arrive, le buste
suit le bassin et se penche. Le semba la reprend à son rythme, un transfert par temps, et y ajoute son double rebond
(règles R32 et R39) : `SEMBA_SITS`, éteint par défaut (`?style=semba&semba=pause|parCote|simple`).

- **Un rebond par temps** : chaque arrivée du poids est une assise, le bassin au plus bas sur le temps (2,4 cm). Le
  semba d'aujourd'hui fait deux rebonds par temps en « V » (10,3 cm, 140 m/s² à 130 bpm).
- **Le double rebond** (`pattern`, « D ») : le même pied reçoit le poids deux fois de suite. Entre les deux, sur un
  temps, le bassin va au bout de son côté, revient jusqu'au centre et repart (`smallRound`) ; l'autre
  genou plie un peu, c'est le transfert qui n'a pas lieu (`short`) ; la jambe du rebond ne se tend qu'en partie
  (`rise`). Chaque signal quitte et retrouve le balancement simple avec la même valeur et la même vitesse : pas
  d'à-coup à la jonction.
- **Où il tombe** : `pause` suit les sources (« un, deux, trois, pause », huit temps) ; `parCote` le met un temps sur
  deux. C'est la question posée au propriétaire.
- Pour un motif de huit temps, le décalage qui garde positif le temps du mouvement sur place passe de 12 à 24 temps
  (`src/pose.ts`) ; les poses des autres styles ne changent pas.
- En couple, le semba ne reçoit pas ces prototypes.

## Les genoux : le propriétaire a élu « genoux chevauchés »

Vote de l'atlas (#132, PR #139), le 21 novembre 2026, mot pour mot : « B, genoux chevauchés » ; « c'est bien
de montrer les 2, mais pour la danse on veut B ».

Les deux règles de l'atlas, pieds plantés, bassin incliné de −10° à +10° :

| | Ce que font les genoux | Au centre | Hauteur du bassin |
|---|---|---|---|
| A — genoux en relais (non retenue) | un genou fléchit après l'autre | les deux presque tendus (7°) | remonte de 14,6 mm |
| **B — genoux chevauchés (élue)** | le genou opposé commence à fléchir avant que le premier ait fini de se tendre ; ils bougent en sens inverse sur toute l'amplitude, sans palier | les deux fléchis du même angle (22,7°) | constante |

Ce que font les variantes de cette spec, mesuré en couple sur la suiveuse (marche, kizomba) :

| | Genoux en sens inverse (part du cycle) | Flexions quand le bassin passe au centre |
|---|---|---|
| Sans ginga | 44 % | — |
| A — aller-retour, `marque` | 27 % | 24° et 27° |
| Aller-retour, `ample` (par défaut depuis #163) | 23 % | 27° et 30° |
| B — « 8 » anguleux | 6 % | 20° et 25° |
| C — « 8 » arrondi | 6 % | 20° et 25° |
| D — « 8 » arrondi, autre sens | 11 % | 20° et 23° |
| E — « 8 » arrondi, ample | 6 % | 20° et 25° |

- Dans le modèle, les genoux sont calculés à partir du bassin et des pieds : ils suivent, ils ne mènent pas.
- **Les prototypes du « 8 » s'éloignent de la règle élue** : les genoux y bougent moins souvent en sens
  inverse (6 % contre 23 à 27 % avec l'aller-retour), et ils sont moins égaux au centre (5° d'écart contre 2° à 3°).
- Le « 8 » de ces prototypes vient donc du bassin. Le « 8 » que décrit le propriétaire vient des genoux
  chevauchés. La suite est de faire mener le bassin par cette règle (`applyAtlasPose`, règle B, sur la
  branche de l'atlas) et de vérifier que le chemin obtenu est bien le « 8 » élu ici.
- Mot à ne pas confondre : cette spec appelait « relais » le fait que les genoux bougent en sens inverse.
  Dans l'atlas, « relais » est la règle A, celle qui n'est pas retenue pour la danse.

## Critères, une fois la variante élue

1. Dans chaque figure du mode jeu, chaque hanche entoure une surface dans les vues confirmées par le
   propriétaire (seuils à fixer sur la variante élue).
2. Le bassin ne reste jamais immobile plus d'un quart de temps tant que les appuis s'enchaînent.
3. Les contrôles de #157 restent verts : aucun croisement d'os, semelles au-dessus du sol, une figure
   modifiée à une jonction garde son passé.
4. Les genoux suivent la règle élue, « genoux chevauchés » : ils bougent en sens inverse sur tout le
   cycle, sans palier ; quand le bassin passe au centre ils sont fléchis du même angle ; le bassin ne
   remonte pas au centre.

## Hors périmètre

- Le « 8 » du danseur seul (app de comparaison des styles) : les styles gardent leur chemin.
- L'ida e volta, qui garde son calibrage de #42 tant que la variante n'est pas élue.
- L'atlas anatomique (#132) : ses planches d'obliquité restent celles de sa PR.
