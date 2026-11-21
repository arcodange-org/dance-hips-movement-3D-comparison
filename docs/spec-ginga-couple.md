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

### Précision du propriétaire, le même jour : le ginga « fait un 8 »

> le ginga c'est en lien avec les genoux en relais ou qui se chevauchent de la session atlas anatomique.
> Sauf que dans le sujet de l'atlas anatomique on a un allez retour pour le moment alors que dans la danse
> le chemin est différent. on dit souvent que l'"on fait un 8".
>
> C'est important cet aspect car ça va corriger le soucis de timing / changement de position brusque, qui
> font que les déplacements sont "robotiques" et non "organiques".

**Ce que cette spec couvre, et ce qu'elle ne couvre pas.**

| | Couvert ici (#157) | Reste à faire (#159) |
|---|---|---|
| Quand | le déhanché suit les transferts d'appui dans toutes les figures | |
| Combien | balancement latéral et petit rebond, quatre réglages | la taille se choisira avec la forme du « 8 » |
| Sans à-coup | la phase est moyennée : le bassin ne claque plus d'un côté à l'autre | |
| **Le chemin** | le bassin va et vient par le même chemin : vu de face, il descend au milieu et remonte aux extrémités | le « 8 », lié au relais des genoux ; sa forme et sa taille sont à élire en GIF |

Sur le plan du « 8 », il a répondu : « le 8 se lit dans les deux plans » (vu de dessus, une hanche avance
pendant que l'autre recule ; vu de face, une hanche monte pendant que l'autre descend). Un contrôle ou une
image du ginga se juge donc dans les deux vues.

Le « 8 » est le chantier [#159](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/159).
Il s'appuie sur la phase et les marges posées ici.

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

En suave et en tarraxinha, le style déplace déjà le bassin lui-même (isolation, 3 cm) et les figures le
gardaient : le ginga le cale sur les transferts et ajoute le rebond, sans l'agrandir.

### Un balancement de pendule

Les figures transfèrent le poids en un cinquième de temps. Suivie telle quelle, la phase ferait claquer
les hanches d'un côté à l'autre. Elle est donc moyennée sur un quart de temps de part et d'autre
(`GINGA_SWING`) : les hanches se balancent autour de chaque transfert, comme un pendule, et sont sur
l'appui dès que le poids y est resté une demi-temps.

**Une jonction garde son passé.** La moyenne regarde un quart de temps en avant. Or une sortie fille peut
être enchaînée à sa position 3 (#90) : la suite n'est pas la même. Mesuré avant correction : la sortie
enchaînée différait de la sortie fille de 8 mm (genou du suiveur) juste avant la jonction, et le plan
réécrivait son passé. La figure déclare donc ses jonctions (`gingaJunctions`) : avant une jonction, la
moyenne ne regarde pas au-delà ; après, elle regarde de nouveau en avant, progressivement. La phase reste
continue, et identique dans les deux formes jusqu'à la jonction.

Une moyenne tournée seulement vers le passé a été essayée et écartée : les hanches arrivent alors 0,2
temps après le poids, et trois poses croisent des os (quart de tour, une séance en semba, un aller-retour
en suave).

### Là où le ginga s'efface

Les figures en couple serré sont calibrées au centimètre. Le ginga ne s'ajoute que là où elles lui
laissent de la place ; ailleurs la pose redevient exactement celle de la figure, déjà contrôlée.

| Où | Ce qui s'efface | Mesure sur le GLB |
|---|---|---|
| Quart de tour, pendant que les jambes se croisent (temps 0,6 à 1,6) | le rebond | la figure n'y laisse aucune marge verticale (`dip` 0) : baisser le bassin plie un tibia du leader dans une rotule du suiveur |
| Sortie fille, premier tiers de temps | le rebond | les rotules se touchent quand le G du leader part |
| Sortie fille, autour du temps 1,25 | le balancement, et la phase revient au temps de la figure | le fémur droit du leader touche la jambe gauche du suiveur (semba) |
| Pendant un aller-retour (#144) | tout le ginga, en un quart de temps à chaque bout | la jambe gauche et la jambe droite d'un même danseur se croisent au G5 de la sortie fille |
| Sorties garçon et fille, enchaînement | le réglage est plafonné à `marque` | au-delà, les fémurs droits se touchent en quinconce, au début et à la fin |

### Amplitude

Le mode jeu danse à l'amplitude 1 : le ginga y est calibré et contrôlé. Aux amplitudes 0,5 et 2 (que le
mode jeu n'utilise pas), quelques poses des sorties croisent des os avec le ginga : il n'y est pas
garanti. Au-delà de l'amplitude 1, la part du déhanché diminue pour que le balancement reste le même.

## Réglages

L'amplitude est un choix d'œil. Trois réglages, plus l'absence, visibles dans l'app avec
`?mode=pair&guidage=1&auto=1&graine=7&ginga=…` et montrés en GIF ([aperçu](elections/ginga-couple.md)). Le
vote se fera avec la forme du « 8 » (#159), pour ne pas demander deux fois :

| Réglage | `sway` | `bounce` | Balancement du bassin en kizomba (leader, suiveur) | Rebond |
|---|---|---|---|---|
| `sans` | 0 | 0 | 0 cm hors pas de base et ida | celui du style (0 à 8 mm) |
| `discret` | 0,2 | 5 mm | 2,0 cm, 2,8 cm | 5 mm |
| `marque` (par défaut proposé) | 0,3 | 9 mm | 2,9 cm, 4,2 cm | 9 mm |
| `ample` | 0,45 | 14 mm | 4,4 cm, 6,3 cm (2,9 et 4,2 dans les sorties) | 14 mm (9 dans les sorties) |

Chaque réglage passe les contrôles sur le GLB dans toutes les figures et tous les styles. `marque` est
la valeur par défaut en attendant.

## Critères (tests)

1. Phase : continue et croissante dans chaque figure ; après chaque transfert, l'appui du style est
   l'appui de la figure ; le suiveur a la phase du leader.
2. Balancement mesuré sur le GLB : plus de 0 dans la marche, le quart de tour et les sorties ; vers le
   pied d'appui.
3. Rebond mesuré sur le GLB : le bassin est plus bas sur le temps qu'entre deux temps, de la valeur du
   réglage, dans toutes les figures et tous les styles ; identique pour les deux danseurs.
4. Continuité du squelette aux frontières et aux allers-retours (contrôles existants du mode jeu).
5. GLB, à l'amplitude du mode jeu : aucun croisement d'os des jambes ni semelle sous le sol, dans chaque
   figure dansée en entier avec chacun des réglages (`scripts/test_ginga_couple.mjs`), dans les
   allers-retours (`scripts/test_touches.mjs`) et dans les séances (`scripts/test_guidage.mjs`).
6. Sans le mode jeu, aucune pose ne change (empreintes et tests des figures inchangés).

## Rapport (21 novembre 2026)

Mesures sur le GLB, en couple, à l'amplitude du mode jeu, réglage `marque`.

**Balancement du bassin** (largeur du trajet, en cm, leader puis suiveur) :

| Figure | Kizomba avant | Kizomba après | Semba après |
|---|---|---|---|
| Pas de base | 6,0 / 6,0 | 6,0 / 6,0 | 6,0 / 6,0 |
| Ida e volta | 2,5 / 3,5 | 2,5 / 3,5 | |
| Avancer, reculer, double | 0 / 0 | **2,9 / 4,2** | 2,1 / 3,0 |
| Quart de tour | 0 / 0 | **2,9 / 4,2** | 2,1 / 3,0 |
| Sorties garçon, fille, enchaînement | 0 / 0 | **2,9 / 4,2** | 2,1 / 3,0 |

- En suave et en tarraxinha le bassin bougeait déjà de 6 cm dans les figures (isolation du style) : il
  garde cette largeur pour le suiveur, 4,2 cm pour le leader (70 %, R14), et suit maintenant les appuis.
- **Rebond** : 9 mm, au plus bas sur le temps, identique pour les deux danseurs, dans les six styles
  (`scripts/test_ginga_couple.mjs`, 159 poses).
- **Forme du balancement** (marche, leader) : le bassin reste sur l'appui environ une demi-temps, puis
  traverse en une demi-temps. Vu de face il descend au milieu du trajet et remonte aux extrémités, par le même chemin dans
  les deux sens : c'est un aller-retour, pas un « 8 » (#159).

**Contrôles** :

- `scripts/test_ginga_couple.mjs` (nouveau, dans `npm test`) : phase lue sur les charges du leader dans
  11 figures (sans saut, sur l'appui après chaque transfert) ; la sortie fille enchaînée garde la phase de
  la sortie fille jusqu'à la jonction ; **3 840 poses de couple** avec les réglages `discret`, `marque` et
  `ample` (toutes les figures, tous les styles qui les proposent) : os au-dessus du sol, semelles
  disjointes, aucun croisement des os des jambes.
- `scripts/test_touches.mjs` : 4 482 poses de couple avec un aller-retour, ginga actif à l'amplitude 1.
- `scripts/test_guidage.mjs` : une figure modifiée à une jonction garde ses poses (654 poses, écart nul) ;
  squelette continu aux frontières ; 2 181 poses des séances commandées et 1 094 poses de la danse
  automatique sans croisement d'os (six styles).
- Gherkin : `docs/features/ginga-couple.feature` (2 scénarios).

**Ce qui a été écarté, avec sa mesure** :

- Phase suivie sans moyenne : les hanches claquent d'un côté à l'autre en un cinquième de temps.
- Rebond dans le croisement du quart de tour : un tibia du leader traverse une rotule du suiveur.
- Moyenne tournée seulement vers le passé (hanches 0,2 temps après le poids) : trois poses croisent des
  os (quart de tour au temps 0,875 ; une séance en semba ; un aller-retour en suave).
- Réglage `ample` dans les sorties : les fémurs droits se touchent en quinconce.
- Amplitudes 0,5 et 2 : quelques poses des sorties croisent des os avec le ginga ; le mode jeu ne les
  utilise pas.

Ces tests ne valident pas la chorégraphie.

## Hors périmètre

- **Le chemin en « 8 » du bassin**, lié au relais des genoux (précision du propriétaire, #159).
- Le ginga propre à chaque rôle (le suiveur sur sa propre phase).
- Le rythme du kompa (#62).
- La hauteur des bassins dans les sorties (R3, #67).
