# Spec — ida e volta : le pied sorti ne prend qu'une partie du poids (#210)

Issue : #210. Figures : [ida e volta en paire](spec-ida-paire.md) (#54, #107) et
[allers-retours insérés dans les autres figures](spec-ida-partout.md) (#144). Règle du propriétaire du 24 novembre
2026, ajoutée à R27 dans [`regles-proprietaire.md`](regles-proprietaire.md).

## Élu le 25 novembre 2026 (question 31 : C) et ce qui suit

- **Trois quarts du poids** sur le pied sorti, en avant comme en arrière : `IDA_WEIGHT_ELECTED` (`share` 0,75) dans
  `src/idaPaire.ts`, par défaut. Les autres candidats restent sous `?idaPoids=entier|peu|moitie` (`entier` : le modèle
  d'avant le vote).
- **Les allers-retours s'enchaînent sans que le ginga s'arrête** : les hanches chaloupent d'un aller-retour à l'autre.
  Par défaut (`IDA_GINGA_FLOW`) ; `?idaGinga=tenu` remet le modèle d'avant. Voir [Ginga continu](#ginga-continu).
- **Contraposition de 20°** entre le bassin et le buste : prototype `?idaContra=<degrés>`, pas par défaut. Le plafond
  de 18° du buste contre le bassin (règle « danseurs, pas lutteurs », `scripts/test_plexus.mjs`) l'interdit dans toute
  figure en paire. Voir [Contraposition](#contraposition-20-prototype) : chiffres et question au propriétaire.

### Ginga continu

Avant, la phase du ginga n'avançait que pendant les transferts d'appui (un cinquième de temps chacun) et se tenait
entre eux : la hanche filait vers le pied sorti au temps, revenait aussitôt, puis restait immobile jusqu'à
l'aller-retour suivant (1,6 temps d'affilée).

Maintenant chaque transfert balance la phase sur une fenêtre qui va de la moitié de l'écart avec le transfert d'avant
à la moitié de l'écart avec le suivant (`idaGingaWindows`) : les fenêtres se suivent sur tout le cycle. La hanche
arrive au-dessus du pied sorti avec le poids, sur le temps, et repart de l'autre côté pendant que le pied revient ;
elle n'est plus jamais tenue. Les appuis (`loadR`, R21 : le poids arrive sur le temps) ne changent pas.

Les hanches chaloupent donc aussi quand un pied est en l'air. Ce pied plie le genou au lieu de soulever le bassin
(`bear` 0 sur le pied qui bouge, comme dans la marche déroulée, R34) : sans cela le bassin sautait au décollage du pied
(mode jeu, `scripts/test_saccades.mjs`, plus grand déplacement du bassin en un huitième de temps, kizomba) :

| | Guideur, vertical / horizontal | Suiveuse, vertical / horizontal |
|---|---|---|
| enregistré avant #210 (tout le poids, ginga tenu) | 1,0 / 3,5 cm | 1,2 / 4,2 cm |
| 75 %, ginga tenu | 1,3 / 2,7 cm | 1,6 / 3,5 cm |
| 75 %, ginga continu, pied qui soulève le bassin | 1,9 / 2,9 cm | 1,8 / 3,0 cm |
| **75 %, ginga continu, pied qui plie le genou (par défaut)** | **0,7 / 2,9 cm** | **1,1 / 3,0 cm** |

Mesures (`scripts/mesure_ida_ginga.mjs`, vue de l'app : quinconce, contact des plexus, contraposition 1 ; « hanches
immobiles » : le bassin va de côté à moins de 1 cm par temps) :

| | Hanches immobiles, part du cycle | au plus, d'affilée |
|---|---|---|
| avant (`?idaGinga=tenu`) | 77 à 81 % | 1,6 à 1,7 temps |
| par défaut, six styles | 20 à 38 % (kompa 58 %) | 0,4 à 0,6 temps |

Ce qui reste immobile est le haut de chaque balancement, là où la hanche change de sens.

### Contraposition (20°, prototype)

En couple, avec le contact des plexus, le buste regarde le partenaire et le bassin suit les pieds ; le bassin pivote
sur la hanche d'appui (#84) d'environ **10°** au bout du pas. En quinconce le partenaire est décalé de côté : au repos
le buste est déjà tourné de **12,7°** contre le bassin pour le regarder. Le contact des plexus laisse au buste au plus
17,2° (`PLEXUS.facing`) contre le bassin ; au-delà, le buste suit le bassin.

`?idaContra=20` fait pivoter le bassin de 20° vers le pied qui bouge au bout du pas (toujours sur la hanche d'appui),
le buste gardant le partenaire (la figure lui laisse 20° de plus, `facingRoom`). Mesures, six styles, guideur et
suiveuse (`IDA_CONTRA=20 node scripts/mesure_ida_ginga.mjs`, `PLACEMENT=reference` pour les pieds face à face) :

| | Bassin, au plus | Buste contre bassin, quinconce | Buste contre bassin, pieds face à face | Os croisés |
|---|---|---|---|---|
| par défaut | 9 à 11° | 17,2 à 17,7° | 9,2 à 9,3° | 0 |
| `idaContra=20` | 20 à 22° | 32,7 à 33,5° | 20,1° | 4 (kompa) |
| plafond de `test_plexus` | | **18°** | **18°** | |

Os croisés : `scripts/sonde_croisements_couple.mjs ida` (`IDA_CONTRA=20`), l'ida e volta et ses variantes de marche,
six styles, quinconce, référence et plexus : 0 sur 8 721 poses par défaut ; 4 avec `idaContra=20`, en kompa, au temps
3,375 (fémur G du guideur contre tibia D de la suiveuse, quinconce, amplitudes 0,5 et 1) : à régler si les 20° sont
retenus.

Le plafond de 18° vaut pour toutes les figures en paire. En quinconce le buste en est déjà à 17,3° : aucune
contraposition de plus n'y tient. Les 20° demandent que le propriétaire tranche : relever le plafond pour l'ida e volta
(33° en quinconce), ou garder 18° (pas de contraposition en plus). Films : [dossier](elections/ida-poids/README.md).

## Avant le vote

### La règle

L'ida e volta est un aller-retour du pied, vers l'avant ou vers l'arrière, qui **ne permet pas de transférer
entièrement le poids** sur la jambe qui avance ou qui recule, avec ou sans virgula. Combien de poids le pied sorti
prend-il ? C'est ce que le propriétaire élit sur films.

### Le modèle avant le vote

Mesuré sur le GLB, kizomba, quinconce, amplitude 1, `scripts/mesure_ida_poids.mjs` :

- **Poids** : un pas balancé. Le pied sorti prend **tout** le poids sur le temps (0,8 → 1,0), le rend à l'autre pied
  (1,0 → 1,2) et revient sans poids. Après un créneau vers l'arrière, le pied revenu reprend le poids (1,85 → 2,0) :
  c'est un changement de pied, pieds côte à côte, qui libère l'autre jambe pour le créneau suivant.
- **Bassin** : il avance de **10,5 cm** vers le pied sorti (9 cm de `carry`, plus la moitié de l'avance de la hanche
  qui pivote, #84) et revient au temps 1,5. Au temps, il est à mi-chemin entre les chevilles : à 0,49 à 0,69 du chemin
  qui va de la cheville porteuse à la cheville sortie.
- **Ginga** : la phase du style avance d'un demi-cycle à chaque transfert (dix par cycle, `idaGingaBeat`) : la hanche
  passe entièrement du côté du pied sorti (2,4 cm de côté pour le guideur, 3,5 cm pour la suiveuse, 4° de roulis),
  puis revient par l'autre moitié de son dessin.

Le bassin dit donc déjà « la moitié du chemin » ; ce sont les appuis et le ginga qui disent « tout le poids ».

### Les candidats (`?idaPoids=<nom>`)

Un seul réglage, `share` dans `src/idaPaire.ts` (`IDA_WEIGHT_CANDIDATES`) : la part du poids que prend le pied sorti.
Le reste en découle :

- **appuis** (`idaTransfers`) : le pied sorti prend `share` du poids sur le temps et le rend avant son retour ; le
  changement de pied après un créneau vers l'arrière reste entier ;
- **bassin** : il va vers le pied sorti `share` fois le chemin d'aujourd'hui (`carry`) ; le pivot de la hanche (#84)
  ne change pas ;
- **ginga** (`idaGingaBeat`) : la phase avance jusqu'à ce que l'appui du style soit celui de la figure
  (`acos(1 − 2·share) / π` de demi-cycle), puis revient par le même chemin : la hanche va vers le pied et revient.
  La phase avance de 2 demi-cycles par cycle au lieu de 10 (seuls les changements de pied comptent).

Mesures (kizomba, quinconce, amplitude 1 ; guideur et suiveuse, les quatre allers-retours du cycle) :

| Candidat | Poids sur le pied sorti | Bassin vers le pied | Bassin entre les chevilles, au temps | Hanche de côté (guideur / suiveuse) | Roulis du bassin |
|---|---|---|---|---|---|
| aujourd'hui | 100 % | 10,5 cm | 0,49 à 0,69 | 2,4 / 3,5 cm | 4° |
| `peu` | 20 % | 3,0 cm | 0,21 à 0,39 | 0,5 / 0,7 cm | 0,3 à 0,8° |
| `moitie` | 50 % | 5,8 cm | 0,33 à 0,49 | 1,2 / 1,8 cm | 2° |
| `troisQuarts` | 75 % | 8,2 cm | 0,41 à 0,59 | 1,8 / 2,6 cm | 3 à 3,4° |

Os des jambes (`scripts/sonde_croisements_couple.mjs`, `IDA_POIDS=<nom>`, ida e volta et ses variantes de marche, six
styles, quinconce, référence, plexus) : **aucun croisement** pour les trois candidats, comme aujourd'hui (1 152 poses de
l'ida e volta et 585 de chacune de ses trois variantes, par configuration). Le bassin reculant moins, les genoux du couple
se rapprochent moins qu'aujourd'hui.

### Ce qui suit sans réglage propre

- **Allers-retours insérés** (#144, `sampleTouched`) : ils prennent les appuis et le trajet du bassin de l'ida ; ils
  suivent donc la part élue. Le ginga y est déjà effacé (un toucher est calibré au centimètre sans lui). La réponse du
  21 novembre est tenue : le poids est sur le pied d'appui au début et à la fin.
- **Mode jeu** : l'ida donne sa propre phase de ginga ; elle part et finit sur le même appui qu'aujourd'hui, donc les
  raccords ne changent pas de côté.

### Vérifié une fois élu

- Tests sur le GLB : `test_ida_paire` (les transferts partiels ne finissent plus « entièrement sur leur pied » ; la
  phase revient en arrière pendant le retour du poids ; trajet des bassins), `test_ida_virgula`, `test_touches`,
  `test_insertion`, `test_ginga_couple`, `test_guidage`, `test_ecarts_regles` (R21 : transferts sur le temps).
- Aucun croisement des os des jambes, pied porteur immobile, enveloppes des pieds disjointes.
- Saccades (R34, `scripts/test_saccades.mjs`, `scripts/fixtures/saccades.json`) réenregistrées si les mesures
  changent.
- R27 complétée dans [`regles-proprietaire.md`](regles-proprietaire.md).

Fait le 25 novembre : `npm test` repris avec 75 % et le ginga continu par défaut (`test_ida_paire` réécrit : trois
quarts du poids, fenêtres du ginga qui se suivent, phase jamais tenue ; la phase du ginga lue sur les appuis
(`test_ginga_couple`, `ginga-couple.feature`) ne concerne plus l'ida, qui donne la sienne) ; saccades réenregistrées
(meilleures qu'avant).

## Hors périmètre

- La virgula du quart de tour (#208) et le « 1 2 » (#209), chantiers distincts.
- La virgula de la sortie fille (#127) : le guideur y avance et la suiveuse recule, c'est un pas, pas un aller-retour.
