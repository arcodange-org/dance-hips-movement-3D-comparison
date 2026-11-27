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
- **Le bassin ne s'arrête jamais** : pas de pose tenue sur les temps ; son trajet est continu en vitesse sur tout le
  cycle. Voir [Bassin continu](#bassin-continu-pas-de-pose-tenue-sur-les-temps).
- **Contraposition** : pas de contraposition ajoutée. Le buste reste à 18° au plus du bassin dans toute figure en paire
  (règle « danseurs, pas lutteurs », `scripts/test_plexus.mjs`), décision du 25 novembre. Voir
  [Contraposition](#contraposition-le-plafond-de-18-reste).

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
| 75 %, ginga continu, pied qui plie le genou | 0,7 / 2,9 cm | 1,1 / 3,0 cm |
| **par défaut : en plus, le bassin ne s'arrête jamais** | **1,0 / 2,0 cm** | **1,2 / 2,4 cm** |

Mesures (`scripts/mesure_ida_ginga.mjs`, vue de l'app : quinconce, contact des plexus, contraposition 1 ; « hanches
immobiles » : le bassin va de côté à moins de 1 cm par temps) :

| | Hanches immobiles, part du cycle | au plus, d'affilée |
|---|---|---|
| avant (`?idaGinga=tenu`) | 77 à 81 % | 1,6 à 1,7 temps |
| par défaut, six styles | 20 à 38 % (kompa 58 %) | 0,4 à 0,6 temps |

Ce qui reste immobile est le haut de chaque balancement, là où la hanche change de sens.

### Bassin continu (pas de pose tenue sur les temps)

Le ginga continu ne suffisait pas : sur les films, le couple marquait encore un arrêt entre chaque pas. Mesuré sur le
GLB (`scripts/mesure_vitesse_bassin_ida.mjs`, vue en paire de l'app, tous les 1/50 de temps, centre du bassin et sa
rotation) : à chaque temps pair, le bassin était **à l'arrêt complet, 0 cm et 0° par temps**, de 1,85 à 2,1 de chaque
créneau, et sous 0,6 cm par temps à chaque temps impair. Trois mouvements s'arrêtaient ensemble : l'avancée du bassin
avec le poids (aller jusqu'au temps, retour à 1,5, tenue jusqu'au créneau suivant), le pivot sur la hanche d'appui (#84,
calé sur le pied, tenu tant que les deux pieds sont posés) et le ginga (qui change de sens sur le temps).

Maintenant l'avancée et le pivot suivent des courbes périodiques sur tout le cycle (`src/idaPaire.ts`, `IDA_FLOW`) :
l'avancée va et vient comme les pas du guideur (avant, arrière, avant, arrière : 4 temps), le pivot tourne vers le pied
qui bouge (G puis D : 8 temps). Elles repassent par la position neutre aux frontières des créneaux sans s'y arrêter,
et atteignent leur plus loin environ un tiers de temps après le poids (`idaFlowBeat`, `lag` 0,4) : la hanche finit le
transfert pendant que le ginga change de sens sur le temps, si bien que les trois ne s'arrêtent plus ensemble. Vu de
dessus, le bassin dessine des boucles qui se croisent au centre au lieu d'aller-retours en ligne
([tracé](elections/ida-poids/chemin-du-bassin.png), `scripts/tracer_bassin_ida.mjs`).

Un aller-retour inséré dans une autre figure (#144) garde le trajet de son propre créneau, qui part et revient à la
position neutre (`sampleIdaPaire(…, slot)`). Dans le créneau de la virgula (#128), le pivot revient à celui du créneau :
la virgula ouvre elle-même le bassin, et le buste, qui regarde la partenaire, doit garder sa direction à 1° près.

Vitesse du centre du bassin, au plus bas sur le cycle (cm par temps ; entre parenthèses, la rotation au plus bas, en
degrés par temps) :

| | kizomba | semba | kompa | tarraxinha | suave | zouk |
|---|---|---|---|---|---|---|
| ginga tenu (avant #210) | 0 (0) | 0 (0) | 0 (0,8) | 0 (0) | 0,5 (0) | 0 (0) |
| ginga continu, films du 25 novembre | 0 (0), temps 2 | 0 (0), temps 2 | 0 (0,8) | 0 (0), temps 2 | 0,6 (0), temps 1 | 0,05 (0), temps 2 |
| **par défaut** | **3,9 (3,2)** | **2,4 (3,2)** | **1,4 (0,1)** | **1,5 (1,7)** | **5,3 (3,5)** | **3,1 (0,6)** |

Garde dans `npm test` (`scripts/test_ida_paire.mjs`) : dans cette vue, six styles, les deux danseurs, deux cycles depuis
le début, tous les 1/50 de temps, le centre du bassin va à **1 cm par temps au moins**. En dessous, un film à
12 images par seconde (90 bpm : 8 images par temps) déplace le bassin d'à peu près un millimètre par image : à l'œil,
une pose tenue. La garde échoue sur la version filmée le 25 novembre (0,00 cm par temps, semba, guideur, temps 2) et
passe maintenant (1,5 cm par temps au plus bas).

### Contraposition : le plafond de 18° reste

En couple, avec le contact des plexus, le buste regarde le partenaire et le bassin suit les pieds ; le bassin pivote
sur la hanche d'appui (#84) d'environ **10°** au bout du pas. En quinconce le partenaire est décalé de côté : au repos
le buste est déjà tourné de **12,7°** contre le bassin pour le regarder, et il atteint 17,3° pendant l'ida. Une
contraposition de 20° (bassin tourné de 20°, essai filmé le 25 novembre) le mettait à 32,8° du bassin en quinconce et
croisait les os des jambes en kompa. Décision du 25 novembre : le plafond de 18° de `test_plexus` reste, aucune
contraposition n'est ajoutée ; l'essai est retiré.

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

## Le bassin sans arrêt ni accélération subite (27 novembre)

Demande du 27 novembre : l'ida e volta sans interruption du mouvement des hanches et sans accélération subite. Mesuré
dans le mode jeu (`scripts/bassin_mesure.mjs` : ida commandé depuis le pas de base, kizomba, ginga par défaut,
quinconce, amplitude 1, 48 échantillons par temps ; repère, le pas de base : 30 cm/temps²).

- **Jonctions** (#219, branche fusionnée ici) : le résidu part avec sa vitesse. Entrée 1 115 et 1 334 → 66 et 78
  cm/temps² (le bassin sautait de 9,9 à 17,2 cm par temps) ; sortie : 60 à 68 cm/temps², lacet 550 et 712 → 96 et 47
  °/temps² (jusqu'à 493 pour l'ida commencé en arrière : son pivot rend sa vitesse en un dixième de temps, pour ne pas
  emporter les genoux plus de 0,5° dans ceux du partenaire).
- **Roulis** (#221) : le plafond de rotation (`rotationCap`, 2°) est atteint en douceur. Suiveuse : 506 → 213 °/temps².
- **Intérieur** : continu depuis le ginga continu (25 novembre) ; jamais immobile (au moins 2,4 cm par temps).

**Reste** : 414 à 548 cm/temps² en hauteur là où un pied commence son retour (temps 3,2 et 5,2 du cycle) : le roulis
réduit du pas (`backRoll`, `forwardRoll` 0,3) raccourcit aussi la poussée (`src/gait.ts`), et le talon monte sur la
pointe en un trentième de temps ; la cheville recule d'autant et la jambe qui borne la hauteur la suit. Allonger la
poussée change le moment où le pied quitte le sol, calibré avec celui du partenaire (#88) : à reprendre avec ses tests.
Garde dans `scripts/test_ida_paire.mjs` (kizomba, semba, suave ; hauteur et roulis du semba : le rebond du style lui-même).

## Hors périmètre

- La virgula du quart de tour (#208) et le « 1 2 » (#209), chantiers distincts.
- La virgula de la sortie fille (#127) : le guideur y avance et la suiveuse recule, c'est un pas, pas un aller-retour.
