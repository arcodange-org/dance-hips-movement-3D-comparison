# Spec #144 — tout pas qui avance ou recule peut devenir un ida e volta

[Accueil](../README.md) · [Ida en paire](spec-ida-paire.md) · [Ida inséré](spec-insertion-ida.md) (#91) ·
[Mode jeu](spec-jeu-file-auto.md) (#140) · [Virgula](virgula.md) · [Règles du propriétaire](regles-proprietaire.md) ·
[Issue #144](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/144)

**Statut : modèle validé par le propriétaire le 21 novembre 2026** (réponses ci-dessous), sauf le
comportement du suiveur quand il va de côté (question 4, reposée).

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

## Réponses du propriétaire (21 novembre 2026)

| Question | Réponse (ses mots) |
|---|---|
| 1. L'aller-retour ajoute 2 temps, puis le pas prévu ? | « Oui » |
| 2. Poids | « Le ida volta consiste en un "touch"/marka en aller retour donc si c'est le pied gauche qui sort et revient le poids reste à droite au début et à la fin et c'est encore au pied gauche de bouger ensuite. On peut faire ida e volta + quart de tour ensuite : le transfert de poids se fera donc au pas gauche du premier temps du quart de tour » |
| 3. Quels pas | « une sortie garçon (G1) peut être remplacée par une ida volta et reprendre ensuite, un retour de sortie fille (D4) peut être un ida volta. D2 et G5 non dans ces cas-ci » |
| 4. Suiveur quand il va de côté | « Je n'ai pas compris la question » : reposée plus bas |
| 5. Virgula par une touche maintenue, tirée en danse seule | « ok » |
| 6. La touche de l'ida pendant une figure transforme le prochain pas possible | « ok » |

## Modèle

Il prolonge l'ida inséré de #91.

1. **Où** : avant un pas du leader qui avance ou recule. On note la **position** `p` : la fin de
   l'action `p`, donc `p = 0` avant le premier pas de la figure (le G1 de la sortie garçon, exemple du
   propriétaire), `p = 3` avant le D4 de la sortie fille (son autre exemple).
2. **Quoi** : ce pied part dans le sens de son pas, sur un temps, et revient sur le temps suivant. C'est
   un créneau de 2 temps du cycle de l'ida e volta en paire (#107), ajouté à la position tenue.
3. **Poids** : touche, marka. Le poids est sur l'autre pied au début et à la fin ; le pied qui est sorti
   n'a pas pris l'appui, c'est donc encore à lui de bouger.
4. **Ensuite** : la figure reprend au pas qui était prévu, et c'est ce pas qui fait le transfert de
   poids. La figure dure 2 temps de plus par aller-retour.
5. **Suiveur** : le miroir de l'ida e volta en paire. Quand le leader avance son pied, le suiveur recule
   le sien, dans le même couloir ; quand il recule, le suiveur avance. C'est ce que fait déjà l'ida inséré
   de la sortie fille (#91). *À confirmer* pour les pas où le suiveur allait de côté (question 4).
6. **Virgula** : quand c'est le G du leader qui avance, le pied peut se poser perpendiculaire (R26), avec
   la géométrie de #127. Sans effet sur le suiveur.
7. **Plusieurs fois** : chaque pas possible d'une même figure peut devenir un aller-retour, une fois.

### Positions retenues

| Figure | Positions | Pas du leader qui devient l'aller-retour |
|---|---|---|
| Avancer, double | 0 | G en avant |
| Avancer | 1 | D en avant |
| Reculer | 0, 1 | G, puis D, en arrière |
| Quart de tour | 0, 1 | G, puis D, en avant |
| Sortie garçon | 0, 1, 2, 3 | G1, D2, G3, D4, en avant |
| Sortie fille | 0, 2, 3, 4 | G1 en avant ; G3, D4, G5 en arrière |
| Enchaînement (#90) | celles de la sortie fille jusqu'à sa position 3, puis le pont et la fin de la sortie garçon | |

Non retenus : le D2 de la sortie fille (de côté), le G5 de la sortie garçon (fermeture), le second pas
du double (il tombe à un demi-temps). Une position n'est gardée que si ses contrôles sur le GLB passent
(critère 3) ; celles qui croisent des os sont listées dans le rapport avec leur mesure.

## Mode jeu et danse automatique

- **Commande** : la touche de l'ida transforme en aller-retour le **prochain pas possible** de la danse
  en cours : celui de la figure qui se danse, sinon le premier pas possible de la figure qui attend en
  tête de file. Sans figure en cours ni en attente (pas de base), elle commande l'ida e volta de
  8 temps, comme avant. *Choix de l'agent, à essayer* : viser aussi la figure en attente est ce qui rend
  accessible le G1 d'une figure (« sortie garçon (G1) peut être remplacée par une ida volta ») ; en
  contrepartie, pour danser un ida e volta de 8 temps après une figure, il faut le commander quand elle
  n'a plus de pas possible devant elle.
- **Sens** : l'aller-retour suit le sens du pas qu'il précède. Les flèches maintenues (jambe droite,
  arrière d'abord) ne le changent pas.
- **Virgula** : une touche maintenue (Maj) avec la touche de l'ida, quand le pas visé est un G du leader
  qui avance. Sur écran tactile : un bouton à bascule « Virgula ».
- **Danse automatique** : « à chaque position le choix de faire le début d'une figure si possible ou de
  terminer l'actuelle » (#140). Chaque position retenue devient un choix : faire le pas, ou
  l'aller-retour d'abord. Le tirage de #140 s'y applique (probabilité plus forte quand l'aller-retour
  amène une position neutre sur la fin de phrase, plus faible quand il l'en éloigne). La virgula est
  tirée quand elle est possible.
- Les deux insertions de #91 (position 2 des sorties) deviennent deux cas de ce modèle. Une sortie fille
  peut désormais être à la fois ornée d'allers-retours et enchaînée (#90).

## Question reposée au propriétaire

4. Pendant l'aller-retour du leader, que fait la suiveuse ? Dans l'ida e volta en paire, elle fait le
   miroir : il avance son pied, elle recule le sien. La spec applique ce miroir partout. Mais dans la
   sortie fille et le quart de tour, au moment où le leader va faire son pas en avant ou en arrière, la
   suiveuse s'apprêtait à faire un pas **de côté**. Doit-elle quand même faire le miroir (son pied recule
   ou avance puis revient), ou rester en appui sans bouger le pied pendant que le leader fait son
   aller-retour ?

## Critères (tests)

1. Avant l'aller-retour, la figure est inchangée ; après, elle reprend à l'identique, décalée de 2 temps.
2. Le pied part dans le sens de son pas ; le retour se fait sans poids ; le suiveur n'est jamais en
   avance (R24).
3. GLB, pour chaque point d'insertion, six styles qui proposent la figure, amplitudes 0,5 à 2 :
   continuité, semelles au-dessus du sol et disjointes, aucun croisement d'os des jambes.
4. Mode jeu : fenêtre de la commande, rejeu exact, danse automatique reproductible.

## Hors périmètre

- Un aller-retour de côté pour un pas de côté (la règle parle des pieds qui avancent ou reculent).
- Les figures seul (hors paire).
