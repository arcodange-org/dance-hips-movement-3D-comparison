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

## Constat mesuré, après #157

Chemin de chaque hanche (articulation), en couple, pendant deux pas de marche, kizomba, réglage `marque`.
Mesure : la **surface entourée** par le chemin dans chaque vue. Un aller-retour par le même chemin n'entoure
rien ; une boucle ou un « 8 » entoure une surface.

| | Largeur | Hauteur | Profondeur | Entouré vu de dessus | de face | de profil |
|---|---|---|---|---|---|---|
| Marche, hanche du leader | 2,9 cm | 1,9 cm | 0,4 cm | **0,0 cm²** | 1,1 cm² | 0,1 cm² |
| Marche, hanche du suiveur | 4,2 cm | 1,6 cm | 0,4 cm | **0,0 cm²** | 1,3 cm² | 0,1 cm² |
| Pas de base (suave), pour comparer | 6,0 cm | 1,1 cm | 4,4 cm | 17,6 cm² (un « 8 ») | 0,7 cm² | 0,9 à 2,2 cm² |

- Vu de dessus, la hanche va et vient sur une ligne. Vu de face, elle fait une boucle mince. De profil,
  presque rien.
- **Pourquoi** : le roulis et le lacet du bassin sont en phase avec son déplacement latéral. Quand le
  bassin est à gauche, il est aussi incliné et tourné au maximum ; quand il revient, tout revient ensemble.
- **Le temps** : le bassin reste sur l'appui une demi-temps, puis traverse en une demi-temps. Pendant
  l'arrêt, rien ne bouge : c'est l'à-coup que le propriétaire décrit.

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

Mesures sur la suiveuse, marche en kizomba dansée après une marche (régime établi). « Entouré » : surface
que le chemin d'une hanche entoure dans chaque vue. « Arrêt » : plus longue durée où le bassin bouge de
moins de 1 mm par seizième de temps.

| | `ginga=` | Balancement | Avance-recul | Entouré dessus | de face | de profil | Arrêt |
|---|---|---|---|---|---|---|---|
| A — aller-retour (aujourd'hui) | `marque` | 4,2 cm | 0 cm | 0,0 cm² | 1,3 cm² | 0,1 cm² | 0,22 temps |
| B — « 8 » anguleux | `huit` | 4,2 cm | 2,0 cm | 4,5 cm² | 1,8 à 4,0 cm² | 1,1 à 1,4 cm² | 0,06 temps |
| C — « 8 » arrondi | `huitRond` | 4,2 cm | 2,0 cm | 5,7 cm² | 1,8 à 3,0 cm² | 1,5 à 1,6 cm² | aucun |
| D — « 8 » arrondi, autre sens | `huitInverse` | 4,2 cm | 2,0 cm | 5,7 cm² | 1,3 à 2,4 cm² | 1,5 à 1,8 cm² | aucun |
| E — « 8 » arrondi, ample | `huitAmple` | 6,3 cm | 4,0 cm | 16,8 cm² | 4,7 à 5,5 cm² | 3,9 à 4,5 cm² | aucun |

Pour le leader : balancement de 2,9 cm (4,4 cm en E), 3,1 à 4,0 cm² entourés vu de dessus (11,8 en E).

- **B** : le roulis et le lacet décalés, l'avance-recul du bassin, le rebond retardé. Le déplacement latéral
  garde le rythme de #157 : le bassin attend sur l'appui, puis traverse. Vu de dessus, un nœud papillon.
- **C** : comme B, et le déplacement latéral suit aussi la phase qui avance tout le long du temps. Le
  bassin ne s'arrête plus ; vu de dessus, un « 8 » couché.
- **C et D, le sens.** En C le bassin part vers le pied d'appui en avançant et en revient en reculant ; en
  D c'est l'inverse. Lequel est celui de la danse n'est pas connu : c'est une question de l'élection.
- **E** : C en plus grand (balancement et rebond d'`ample`, avance-recul doublé, rotations × 1,5). Il
  approche le « 8 » du pas de base (17,6 cm²).

La phase continue d'une figure à la suivante (`gingaFrom`) : en #157 elle repartait posée sur l'appui à
chaque figure, donc toutes les deux temps dans la marche. Seuls les prototypes l'utilisent.

### Ce que les prototypes ne font pas

- **Les genoux ne sont pas le moteur, et ils s'éloignent de la règle élue.** Voir la section suivante.
- **Vu de face, le chemin est irrégulier.** La hauteur du bassin vient de la portée des jambes de la
  figure : dans la marche elle a un à-coup d'environ 7 mm, qui n'est pas du ginga (R3, #67).
- **Les contrôles sur le GLB ne sont pas passés.** Un premier comptage (3 888 poses, chaque figure
  dansée seule, les styles qui la proposent, amplitude 1) relève des croisements d'os : 4 en B (sortie
  fille et son enchaînement), 2 en C, 2 en D, 13 en E (dont 10 dans le quart de tour, 1 dans le pas de
  base). Les enchaînements de figures, où la phase se poursuit, ne sont pas comptés. La variante élue
  devra déclarer ses marges (`gingaRoom`), comme #157.
- L'ida e volta et le pas de base gardent leur chemin actuel.

Elles se voient dans l'app avec `?mode=pair&guidage=1&demo=ginga&ginga=huitRond` (branche de cette PR, non
fusionnée). Les tracés viennent de `scripts/tracer_hanches.mjs`, les GIF de danse de
`scripts/capture_session_gif.mjs`.

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
| A — aller-retour (aujourd'hui) | 22 % | 25° et 26° |
| B — « 8 » anguleux | 6 % | 20° et 25° |
| C — « 8 » arrondi | 6 % | 20° et 25° |
| D — « 8 » arrondi, autre sens | 11 % | 20° et 23° |
| E — « 8 » arrondi, ample | 6 % | 20° et 25° |

- Dans le modèle, les genoux sont calculés à partir du bassin et des pieds : ils suivent, ils ne mènent pas.
- **Les prototypes du « 8 » s'éloignent de la règle élue** : les genoux y bougent moins souvent en sens
  inverse (6 % contre 22 % aujourd'hui), et ils sont moins égaux au centre (5° d'écart contre 1°).
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
