# Spec #144 — tout pas qui avance ou recule peut devenir un ida e volta

[Accueil](../README.md) · [Ida en paire](spec-ida-paire.md) · [Ida inséré](spec-insertion-ida.md) (#91) ·
[Mode jeu](spec-jeu-file-auto.md) (#140) · [Virgula](virgula.md) · [Règles du propriétaire](regles-proprietaire.md) ·
[Issue #144](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/144)

**Statut : spec en attente des réponses du propriétaire.** Rien n'est codé. Les questions sont à la fin.

## Demande du propriétaire (21 novembre 2026)

> chaque pied qui avance ou qui recule peut devenir un "ida e volta" (un simple aller retour du pied, en
> virgula ou non)

## Ce que cela change

L'ida e volta n'est plus seulement une figure de 8 temps, ni un ajout possible en deux endroits. C'est un
**geste** : un pied part, puis revient. Tout pas d'une figure où un pied avance ou recule peut prendre
cette forme.

| Sujet | Aujourd'hui | Avec la règle |
|---|---|---|
| Ida e volta en figure | 8 temps : quatre allers-retours (G avant, G arrière, D avant, D arrière) | inchangé |
| Ida inséré (#91) | position 2 des deux sorties, G du leader seulement | à tout pas qui avance ou recule |
| Virgula (#127, #128) | sortie fille crochet ; option de l'ida en paire | option de tout aller-retour où le G du leader avance |
| Danse automatique (#140) | « début d'une figure » possible à la position neutre et aux deux jonctions des sorties | possible à chacun de ces pas |

## Mesure : les pas qui avancent ou reculent

Relevé sur les échantillonneurs (GLB, quinconce, amplitude 1), dans le repère de chaque danseur. Un pas
« avance » ou « recule » quand son déplacement est plus long en profondeur que de côté. Longueurs en cm,
profondeur puis côté.

### Leader

| Figure | Action 1 | Action 2 | Action 3 | Action 4 | Action 5 |
|---|---|---|---|---|---|
| Avancer | G avance 18 | D avance 18 | | | |
| Reculer | G recule 18 | D recule 18 | | | |
| Double | G avance 18 | D avance 18 | | | |
| Quart de tour | G avance 25 (côté 11) | D avance 37 (côté 11) | | | |
| Sortie garçon | G avance 26 (côté 23) | D avance 25 (côté 23) | **G avance 28 (côté 28)** | D avance 24 (côté 23) | G se referme (5), pas retenu |
| Sortie fille | G avance 15, en virgula | D de côté (20), pas retenu | **G recule 21** | D recule 37 | G recule 21 |

En gras : les deux points d'insertion qui existent déjà (#91). Le relevé donne **16 pas du leader** qui
avancent ou reculent, dont 2 déjà couverts. L'ida e volta de 8 temps n'est fait que de tels pas : il
n'entre pas dans le tableau. L'enchaînement (#90) reprend les pas de la sortie fille jusqu'à sa
position 3, un pont (G avance 17, côté 15), puis les actions 3 à 5 de la sortie garçon.

### Suiveur, au même moment

| Figure | Action 1 | Action 2 | Action 3 | Action 4 | Action 5 |
|---|---|---|---|---|---|
| Avancer | D recule 18 | G recule 18 | | | |
| Reculer | D avance 18 | G avance 18 | | | |
| Double | D recule 18 | G recule 18 | | | |
| Quart de tour | D de côté (20) | G de côté (41) | | | |
| Sortie garçon | D recule 17 | G recule 21 | D recule 54 | G recule 28 | D avance 22 |
| Sortie fille | D recule 32 | G de côté (50) | D de côté (45) | G de côté (41) | D de côté (41) |

Dans la marche et la sortie garçon, le suiveur fait le pas opposé du leader : le miroir de l'aller-retour
est direct. Dans le quart de tour et la sortie fille, le suiveur se déplace surtout de côté pendant que
le leader avance ou recule : son aller-retour est à définir (question 4).

## Modèle proposé (à valider)

Il prolonge l'ida inséré de #91, que le propriétaire a déjà vu.

1. **Où** : à la fin d'une action, si le pas suivant du leader avance ou recule.
2. **Quoi** : ce pied part dans le sens de son pas, sur un temps, et revient sur le temps suivant. C'est
   un créneau de 2 temps du cycle de l'ida e volta en paire (#107), ajouté à la position tenue.
3. **Poids** : touche. Le poids passe sur le pied sorti au temps, puis revient ; le retour se fait sans
   poids. Le danseur finit sur l'appui qu'il avait.
4. **Ensuite** : la figure reprend au pas qui était prévu. Elle dure 2 temps de plus par aller-retour.
5. **Suiveur** : le miroir, avec le pied qui allait faire son propre pas.
6. **Virgula** : quand c'est le G du leader qui avance, le pied peut se poser perpendiculaire (R26), avec
   la géométrie de #127. Sans effet sur le suiveur.
7. **Plusieurs fois** : chaque pas possible d'une même figure peut devenir un aller-retour.

Conséquences pour le code, à chiffrer après les réponses :

- `src/insertion.ts` : l'insertion prend un hôte, une position et un pied, au lieu des deux cas fixes.
- `src/guidage.ts` : un segment porte la liste de ses allers-retours ; sa durée en dépend.
- Chaque nouveau point d'insertion demande ses contrôles sur le GLB (continuité, semelles, aucun
  croisement d'os des jambes), comme #91 l'a demandé pour la position 2 : dans la sortie garçon il avait
  fallu ouvrir le D du suiveur de 3 cm pour qu'il ne frotte pas.

## Mode jeu et danse automatique

- **Commande** (question 6) : aujourd'hui, la touche de l'ida pressée pendant une figure met un ida e
  volta de 8 temps dans la file, sauf au début d'une sortie. Proposition : pendant une figure, elle
  transforme le prochain pas possible en aller-retour ; à la position neutre, elle garde son sens.
- **Danse automatique** : « à chaque position le choix de faire le début d'une figure si possible ou de
  terminer l'actuelle » (#140). Avec cette règle, chaque pas du tableau devient un choix : faire le pas,
  ou l'aller-retour. Le tirage de #140 (probabilité par jonction, préférence de phrase) s'y applique
  tel quel.

## Questions pour le propriétaire

1. **Durée** : l'aller-retour ajoute-t-il 2 temps à la figure (aller, retour, puis le pas prévu), comme
   l'ida inséré de #91 ? Ou remplace-t-il le pas, la figure gardant sa durée ?
2. **Poids** : touche avec le poids qui passe sur le pied sorti au temps (comme #91), ou pied sorti sans
   poids ?
3. **Quels pas** : les 16 pas du tableau du leader ? Les pas de côté (D2 de la sortie fille) et la
   fermeture (G5 de la sortie garçon) restent-ils exclus ?
4. **Suiveur** : dans la sortie fille et le quart de tour, il va de côté pendant que le leader avance ou
   recule. Fait-il alors un aller-retour de côté, reste-t-il en place, ou l'aller-retour du leader n'est-il
   pas possible à ces pas ?
5. **Virgula** : qui la choisit ? Une touche maintenue par le joueur, un réglage, ou la figure ?
6. **Commande** : la touche de l'ida pendant une figure transforme-t-elle le prochain pas possible ?

## Critères (tests, après validation du modèle)

1. Avant l'aller-retour, la figure est inchangée ; après, elle reprend à l'identique, décalée de 2 temps.
2. Le pied part dans le sens de son pas ; le retour se fait sans poids ; le suiveur n'est jamais en
   avance (R24).
3. GLB, pour chaque point d'insertion, six styles qui proposent la figure, amplitudes 0,5 à 2 :
   continuité, semelles au-dessus du sol et disjointes, aucun croisement d'os des jambes.
4. Mode jeu : fenêtre de la commande, rejeu exact, danse automatique reproductible.

## Hors périmètre

- Un aller-retour de côté pour un pas de côté (la règle parle des pieds qui avancent ou reculent).
- Les figures seul (hors paire).
