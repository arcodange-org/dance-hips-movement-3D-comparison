# Spec — ida e volta : le pied sorti ne prend qu'une partie du poids (#210)

Issue : #210. Figures : [ida e volta en paire](spec-ida-paire.md) (#54, #107) et
[allers-retours insérés dans les autres figures](spec-ida-partout.md) (#144). Règle du propriétaire du 24 novembre
2026, à ajouter à R27 dans [`regles-proprietaire.md`](regles-proprietaire.md) une fois la part du poids élue.

## La règle

L'ida e volta est un aller-retour du pied, vers l'avant ou vers l'arrière, qui **ne permet pas de transférer
entièrement le poids** sur la jambe qui avance ou qui recule, avec ou sans virgula. Combien de poids le pied sorti
prend-il ? C'est ce que le propriétaire élit sur films.

## Le modèle aujourd'hui

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

## Les candidats (prototype, `?idaPoids=<nom>`, rien ne change sans le paramètre)

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

## Ce qui suit sans réglage propre

- **Allers-retours insérés** (#144, `sampleTouched`) : ils prennent les appuis et le trajet du bassin de l'ida ; ils
  suivent donc la part élue. Le ginga y est déjà effacé (un toucher est calibré au centimètre sans lui). La réponse du
  21 novembre est tenue : le poids est sur le pied d'appui au début et à la fin.
- **Mode jeu** : l'ida donne sa propre phase de ginga ; elle part et finit sur le même appui qu'aujourd'hui, donc les
  raccords ne changent pas de côté.

## À vérifier une fois élu

- Tests sur le GLB : `test_ida_paire` (les transferts partiels ne finissent plus « entièrement sur leur pied » ; la
  phase revient en arrière pendant le retour du poids ; trajet des bassins), `test_ida_virgula`, `test_touches`,
  `test_insertion`, `test_ginga_couple`, `test_guidage`, `test_ecarts_regles` (R21 : transferts sur le temps).
- Aucun croisement des os des jambes, pied porteur immobile, enveloppes des pieds disjointes.
- Saccades (R34, `scripts/test_saccades.mjs`, `scripts/fixtures/saccades.json`) réenregistrées si les mesures
  changent.
- R27 complétée dans [`regles-proprietaire.md`](regles-proprietaire.md).

## Hors périmètre

- La virgula du quart de tour (#208) et le « 1 2 » (#209), chantiers distincts.
- La virgula de la sortie fille (#127) : le guideur y avance et la suiveuse recule, c'est un pas, pas un aller-retour.
