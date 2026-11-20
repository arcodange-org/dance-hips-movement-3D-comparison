# Spec #42 — ginga déclenché par les transferts d'appui (ida e volta en paire)

Fil d'Ariane : [docs](./) › spec #42. Dépend de [l'ida e volta en paire #54](spec-ida-paire.md),
[marche naturelle et plexus #48–#51](spec-marche-naturelle.md), [ginga angolana](ginga-angolana.md).

## Demandes du propriétaire (19 novembre 2026)

- « Le ginga se déclenche dans le fait de stabiliser la hauteur du danseur entre les flexions du genou
  (la hanche et le bassin bougent, et cela est différent en fonction des styles de danse). »
- « On pourra commencer par le ida e volta pour l'intégration du ginga dans le mouvement. »
- « On n'oublie pas les transferts de poids avec le ginga déclenché à chaque alternance droite/gauche,
  gauche/droite. »
- Le suiveur peut le prononcer davantage ; le leader le fait tout de même, pour transmettre (#42).

## Constat sur le code

- Chaque style décrit déjà un déhanché synchronisé sur **un transfert d'appui par temps** : `S2(b)`
  (période 2 temps), appui `support = −S2` (D quand `S2 = −1`), avec sa forme propre (roulis, lacet,
  translation latérale, flexions alternées des genoux).
- Dans l'ida e volta en paire, ce déhanché tourne **sur l'horloge**, sans lien avec les six transferts
  de la figure (`idaTransfers`) ; la translation latérale du style est écrasée par la racine de la
  figure et la rotation du bassin est plafonnée à 0,06 rad : le ginga est à peine visible.

## Modèle

- **Phase du ginga pilotée par les transferts** : chaque transfert G→D fait passer la phase du style de
  0,5 à 1,5 (appui G plein → appui D plein), chaque transfert D→G de 1,5 à 2,5, au rythme de la
  progression du transfert ; entre deux transferts, la phase reste sur l'appui. Le style garde sa forme
  (cercle, 8, roulis…) et la déclenche à chaque alternance.
- **Hauteur stable** : les flexions alternées des genoux du style (genou d'appui fléchi) sont prises
  par l'IK sous la contrainte de hauteur ; la hanche et le bassin bougent pour garder le buste à niveau
  (`lockUpperTrunk`, isolation).
- **Déhanché latéral** : la translation latérale du style (vers l'appui) s'ajoute à la racine de la
  figure, avec une part `sway` calibrée pour le couple rapproché.
- **Rôles** : le suiveur à 100 %, le leader à 70 % (il transmet sans prononcer).

## Critères (GLB réel)

1. Le déhanché suit les transferts : appui du style = appui de la figure aux pieds posés, phase
   continue et croissante, un demi-cycle par transfert (dix par cycle de 8 temps depuis le cycle à quatre
   allers-retours de #107 ; six avant).
2. Amplitude du leader ≈ 70 % de celle du suiveur.
3. Invariants : aucun croisement d'os de jambe (six styles, trois amplitudes, placements, avec et sans
   plexus), semelles au-dessus du sol, cibles IK atteintes, pied d'appui immobile.
4. Valeurs (`sway`, plafond de rotation) mesurées et rapportées ; validation à l'œil par le propriétaire.

## Calibrage (20 novembre 2026, GLB réel)

- **Phase du suiveur** : le bassin du suiveur est couplé en miroir à celui du leader (quinconce). Avec sa
  propre phase de transferts, les deux styles se déphasent : 53 poses croisées. Il danse donc la phase
  du leader en miroir, c'est-à-dire sur ses propres appuis miroirs (`mode: "leaderPhase"`).
- **Couple rapproché** : `sway` 0,25 (part du déhanché latéral du style ajoutée à la racine), plafond de
  rotation du bassin 0,035 rad, flexion de genou 0,22.

  | sway | genou | rotation | Poses croisées (6 styles × 3 amplitudes × 3 configurations, pas 0,125 temps) |
  |---|---|---|---|
  | 0,4 | 0,3 | 0,05 | 5 |
  | 0,3 | 0,25 | 0,04 | 1 (suave) |
  | 0,3 | 0,22 | 0,04 | 2 (kompa) |
  | **0,25** | **0,22** | **0,035** | **0** |
  | 0,3 (suiveur 85 %) | 0,22 | 0,04 | 0 |

  Le suiveur garde son ginga entier (R14), d'où le choix de la ligne en gras.
- **Kompa** : son appui (`−tanh(2,2·S1)`) a une période d'un temps (deux transferts par temps), pas le
  motif de période 2 que la phase du ginga suppose : le ginga ne le pilote pas (il reste sur l'horloge,
  comme avant). Son rythme est revu avec les temps de la musique (#62).

Tests (`scripts/test_ida_paire.mjs`) : phase continue et croissante, six demi-cycles par cycle, appui du
style = appui de la figure après chaque transfert (cinq styles), leader à 70 % ; aucun croisement d'os
sur 3 456 poses de couple.

Mode jeu (#69) : au passage pas de base → ida e volta, la phase du style saute (horloge → transferts).
Le mode jeu efface cet écart de la colonne, du buste et de la tête sur son temps d'inertie
([mode guidage](spec-mode-guidage-poc.md)) ; les vagues lentes du suave et du zouk restent sur l'horloge.

## Hors périmètre (suite)

Sorties et quarts en paire (même principe une fois l'ida validée), transmission par le cadre (#40).
