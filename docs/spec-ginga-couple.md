# Spec #157 — le ginga visible en danse de couple : balancement et petit rebond

[Accueil](../README.md) · [Ginga](spec-ginga.md) (#42) · [Mode jeu](spec-jeu-file-auto.md) (#140) ·
[Ida à tout pas](spec-ida-partout.md) (#144) · [Règles du propriétaire](regles-proprietaire.md) ·
[Issue #157](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/157)

## Demande du propriétaire (21 novembre 2026)

En regardant la danse automatique de la vitrine (`?vitrine=1`) :

> J'aimerai aussi que le "sway" des hanches et le petit effet de "bounce" , le ginga en fait, soit présent
> pour montrer que les danseurs se balancent au rythme de la musique

C'est la suite de sa demande de #42 : « On pourra commencer par le ida e volta pour l'intégration du
ginga dans le mouvement. »

## Constat mesuré (GLB, mode jeu, kizomba, amplitude 1)

| Figure | Balancement latéral du bassin | Roulis du bassin |
|---|---|---|
| Pas de base | 6,0 cm | 3,4° |
| Ida e volta | 2,5 cm (leader), 3,5 cm (suiveur) | 4,0° |
| Avancer, reculer, double | **0 cm** | 4,0° |
| Quart de tour | **0 cm** | 5,7° |
| Sorties garçon, fille, enchaînement | **0 cm** | 5,7° |

- Le balancement n'existe que là où il a été branché : le pas de base (`PLACE_PAIR.styleSway`) et l'ida e
  volta (`IDA_GINGA`, #42). Ailleurs la position latérale du bassin est celle de la figure.
- Dans les sorties, le quart de tour et la marche, le déhanché du style suit le temps de la figure, pas
  les transferts d'appui (R13 : « le ginga déclenché à chaque alternance droite/gauche »).
- **Rebond** : en couple, le mouvement vertical du style est réduit au quart et borné à 8 mm
  (`src/pose.ts`), pour que les genoux ne se croisent pas. Il reste 5 mm en kizomba, 8 mm en semba, et
  **rien** en suave, tarraxinha et kompa, dont le style n'a pas de pulsation verticale.

## Modèle

Trois ajouts, en danse de couple du mode jeu (écoute, danse seule, vitrine). L'app de comparaison des
styles ne change pas.

1. **Phase du ginga sur les transferts, dans toutes les figures** (R13). Comme dans l'ida e volta : chaque
   transfert d'appui du leader fait avancer la phase du style d'un temps ; entre deux transferts elle
   reste sur l'appui. La phase est lue sur les charges de la figure elle-même (`loadR`). Le suiveur danse
   la phase du leader en miroir (calibrage de #42 : avec sa propre phase, les bassins se déphasent et les
   cuisses se croisent).
2. **Balancement** : une part `sway` du déhanché latéral du style, vers l'appui, s'ajoute au bassin dans
   toutes les figures. Le suiveur à 100 %, le leader à 70 % (R14).
3. **Petit rebond** : une pulsation verticale de `bounce` millimètres, **une par temps de la musique** :
   le bassin est au plus bas sur le temps (le poids arrive, le genou cède, R21) et remonte entre deux
   temps. Elle suit l'horloge, pas la figure : elle ne s'arrête ni pendant une tenue ni pendant un
   aller-retour, et elle est la même pour les deux danseurs. Tous les styles l'ont, y compris ceux dont
   le style n'a pas de pulsation verticale.

Ce que le rebond respecte :

- **R3** (« ne pas monter-descendre ») : il est petit devant les variations de hauteur des figures, et
  borné par le réglage.
- **R12** (hauteur du buste stable entre les flexions du genou) : la pulsation est commune aux deux
  danseurs et régulière ; le buste ne change pas de niveau d'une figure à l'autre.

Le pas de base garde son déhanché actuel (il est déjà visible) et reçoit le rebond. L'ida e volta garde
son calibrage de #42 et reçoit le rebond. Le kompa garde son rythme propre (un transfert tous les deux
temps, #62) : il reçoit le rebond, pas la phase.

## Réglages (à élire)

L'amplitude est un choix d'œil. Trois réglages, plus l'absence, visibles dans l'app avec
`?mode=pair&guidage=1&auto=1&ginga=…` et présentés en GIF :

| Réglage | `sway` | `bounce` |
|---|---|---|
| `sans` | 0 | 0 |
| `discret` | à calibrer | à calibrer |
| `marque` (par défaut proposé) | à calibrer | à calibrer |
| `ample` | à calibrer | à calibrer |

Les valeurs sont fixées par le calibrage sur le GLB : un réglage n'est proposé que s'il passe les
contrôles (aucun croisement d'os des jambes, semelles au-dessus du sol) dans toutes les figures, les
styles et les amplitudes.

## Critères (tests)

1. Phase : continue et croissante dans chaque figure ; après chaque transfert, l'appui du style est
   l'appui de la figure ; le suiveur a la phase du leader.
2. Balancement mesuré sur le GLB : plus de 0 dans la marche, le quart de tour et les sorties ; vers le
   pied d'appui.
3. Rebond mesuré sur le GLB : le bassin est plus bas sur le temps qu'entre deux temps, de la valeur du
   réglage, dans toutes les figures et tous les styles ; identique pour les deux danseurs.
4. Continuité du squelette aux frontières et aux allers-retours (contrôles existants du mode jeu).
5. GLB : aucun croisement d'os des jambes ni semelle sous le sol, figures, allers-retours et séances
   (contrôles existants, avec le ginga).
6. Sans le mode jeu, aucune pose ne change.

## Hors périmètre

- Le ginga propre à chaque rôle (le suiveur sur sa propre phase).
- Le rythme du kompa (#62).
- La hauteur des bassins dans les sorties (R3, #67).
