# Spec #140 — mode jeu : file de commandes, écoute par défaut, danse automatique

[Accueil](../README.md) · [Mode guidage](spec-mode-guidage-poc.md) · [Flèches](spec-jeu-fleches.md) ·
[Enchaînement](spec-enchainements.md) · [Ida inséré](spec-insertion-ida.md) ·
[Issue #140](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/140)

## Demande du propriétaire (21 novembre 2026)

> - Dans la partie « jeu » j'aimerais ne pas avoir le défi d'être synchronisé et de voir mes mouvements
>   « rater ». Simplement ce que je « commande » s'empile dans une queue de mouvements.
> - Dans la partie jeu par défaut le simulateur « écoute » (pas besoin d'appuyer sur espace).
> - Si on désactive l'écoute active des touches (appui sur l'espace pour toggle le comportement) alors ça
>   danse tout seul : à chaque position le choix de faire le début d'une figure si possible ou de terminer
>   l'actuelle. Toutes les 4 mesures de 8 temps on essaie d'être en position neutre mais ce n'est pas
>   obligatoire.

## Ce qui change

| Sujet | Avant (#69) | Après (#140) |
|---|---|---|
| Une commande | prise seulement si elle arrive au bon moment | toujours prise, ajoutée à la file |
| Note de synchronisation | Parfait, Bien, Juste, Raté, série | supprimée |
| Refus | trop tôt, trop tard, ambigu, répété | supprimés |
| Plusieurs commandes | une seule gardée par frontière | dansées dans l'ordre, l'une après l'autre |
| À l'ouverture | à l'arrêt, Espace pour démarrer | le couple danse et les touches sont écoutées |
| Espace | lecture / pause | bascule entre l'écoute et la danse automatique |
| Pause | Espace ou bouton | bouton seulement |
| Sans commande | pas de base | écoute : pas de base ; danse automatique : le simulateur choisit |

Ce qui ne change pas : les figures, leurs durées, le passage par la quinconce, le repère du couple,
l'inertialisation du bassin, les touches (position physique, flèches, variantes de l'ida, double), et le
rejeu exact d'une partie.

## File de commandes

- Une commande est `{ beat, figure }`. Elle entre dans la **file** au moment de la pression.
- À chaque **frontière** (fin d'une figure, ou tous les 4 temps du pas de base), la première commande de
  la file commence. La file vide, le couple danse le pas de base.
- Rien n'est refusé ni noté. Deux commandes différentes ne s'annulent plus : elles se suivent. La même
  commande pressée trois fois se danse trois fois.
- La file est affichée : figure en cours, puis les figures en attente, dans l'ordre.

### Commandes prises pendant une sortie (#90, #91)

Deux commandes gardent un sens particulier quand elles arrivent **pendant** une sortie, avant sa
jonction. Elles modifient la sortie en cours au lieu d'entrer dans la file :

| Pendant | Commande | Avant | Effet |
|---|---|---|---|
| sortie fille | ↑ (avancer) | sa position 3 | enchaîne la fin de la sortie garçon (#90) |
| sortie garçon ou fille | ida e volta (toute variante) | sa position 2 | insère l'ida e volta à la position 2 (#91) |

- La fenêtre va du début de la sortie à la jonction. Elle commençait au temps 1 : cette borne servait à
  refuser les pressions « trop tôt », elle n'a plus d'objet.
- Pressée avant que la sortie commence (elle est encore dans la file), la même commande reste une
  commande ordinaire : elle se danse après la sortie.
- Une sortie ne reçoit qu'une modification : insérée, elle n'est plus enchaînée. Une seconde pression
  de ↑ ou de l'ida est alors une commande ordinaire.
- Les décisions sont prises dans l'ordre de l'horloge. La modification vaut dès la pression, mais les
  poses jusqu'à la jonction restent celles de la sortie : rien ne saute.

### Commande déjà commencée

Deux gestes réécrivent la dernière commande (#89) : ↑ ↑ en moins d'un demi-temps (double), et la touche
de l'ida dans le temps qui suit ↓ (ida en arrière d'abord). Ils ne s'appliquent qu'à une commande qui
attend encore dans la file. Une commande déjà commencée, ou qui a modifié la sortie en cours, est
définitive : l'appui suivant devient une commande à part. Sans cette règle, une marche commencée depuis
un quart de temps aurait pu se changer en double sous les yeux du joueur.

## Écoute et danse automatique

- **Écoute** (par défaut) : le couple danse dès l'ouverture, les touches et les boutons ajoutent à la file.
- **Espace** (ou le bouton « Écoute / Danse seule ») bascule vers la **danse automatique** et en revient.
- En danse automatique, les touches de figures ne sont pas écoutées. Les commandes déjà dans la file se
  dansent d'abord ; ensuite le simulateur choisit.
- Le bouton Pause arrête l'horloge. Les captures image par image (`beat=`, `sortieBeat=`) ouvrent la
  vue à l'arrêt sur le temps demandé, comme avant.
- URL : `auto=1` ouvre en danse automatique ; `graine=N` fixe la graine du tirage.

### Ce que choisit la danse automatique

« À chaque position le choix de faire le début d'une figure si possible ou de terminer l'actuelle. »
Le moteur connaît deux sortes de positions où une figure peut commencer :

1. **La position neutre** (quinconce) : à la fin d'une figure et tous les 4 temps du pas de base. Le
   simulateur y commence toujours une figure, tirée parmi celles du style.
2. **Les jonctions d'une sortie** : la position 2 (ida e volta inséré) et, dans la sortie fille, la
   position 3 (fin de la sortie garçon). Le simulateur y choisit entre commencer cette figure et
   terminer la sortie.

Les autres positions d'une figure n'ont pas de départ possible aujourd'hui : la figure se termine.
L'ontologie des figures (#95) pourra en déclarer d'autres.

### Position neutre toutes les 32 temps

« Toutes les 4 mesures de 8 temps on essaie d'être en position neutre mais ce n'est pas obligatoire. »
Une **phrase** dure 32 temps. Le simulateur préfère les choix qui amènent une position neutre sur la fin
de la phrase, sans se l'imposer. `r` = temps restants jusqu'à la fin de la phrase, `L` = durée de la
figure.

Tirage à la position neutre (`GUIDE_AUTO`) :

| Poids | Valeur |
|---|---|
| Famille : ida e volta (quatre variantes ensemble), quart de tour, sortie garçon, sortie fille | 3 chacune |
| Marche : avancer, reculer, double | 1 chacune |
| La figure finit juste sur la phrase (`L = r`) | × 4 |
| La figure dépasse la phrase (`L > r`) | × 0,25 |
| Même famille que la figure précédente | × 0,3 |
| Sortie fille quand la danse est décalée d'un temps (son enchaînement la recale) | × 3 |

Les sorties modifiées (enchaînée, avec ida inséré) ne sont pas tirées à la position neutre : elles
naissent d'une sortie, à sa jonction.

Tirage à une jonction :

| Cas | Probabilité de commencer la figure |
|---|---|
| Par défaut | 0,3 |
| La figure commencée finit juste sur la phrase | 0,8 |
| Terminer la sortie finit juste sur la phrase | 0,05 |
| Enchaînement, danse sur un temps pair | 0,15 |
| Enchaînement, danse décalée d'un temps | 0,9 |

Les trois premières lignes valent pour l'ida inséré (position 2). L'enchaînement (position 3 de la sortie
fille) n'utilise que les deux dernières : sa durée impaire décale la danse, la phrase ne peut pas le
guider autrement.

Durées : marche 2, quart 4, sorties 6, ida 8, sortie avec ida inséré 8, sortie fille enchaînée 9. Toutes
sont paires sauf l'enchaînement. Après un enchaînement, les frontières tombent sur les temps impairs et
la fin de phrase devient inatteignable ; un second enchaînement recale la danse. D'où les deux dernières
lignes : le simulateur enchaîne peu, et cherche à enchaîner de nouveau quand il est décalé.

### Tirage reproductible

Le tirage est une fonction de la graine et du temps de la décision. Une partie reste **une liste de
commandes horodatées**, à laquelle s'ajoutent la liste des bascules écoute / danse automatique et la
graine : même liste, même danse. Revenir en arrière dans le temps redonne le même résultat.

## Interface

- Titre : « Mode jeu ». Texte : chaque commande s'ajoute à la file ; Espace laisse le couple danser seul.
- HUD : compte (1 à 8), figure en cours, file d'attente, mode (écoute ou danse automatique).
- Boutons : Pause / Reprendre, Écoute / Danse seule (Espace), Recommencer, Vue, Son, bpm, Quitter.
- Les boutons de figures sont inactifs en danse automatique.

## Critères (tests, `scripts/test_guidage.mjs` ; scénarios lisibles dans `docs/features/mode-jeu.feature`)

1. File : toute commande est dansée, dans l'ordre de pression, chacune à la frontière qui suit la fin
   de la précédente ; aucune n'est perdue, quels que soient les instants de pression.
2. Deux commandes différentes pour la même frontière se suivent ; une commande répétée se danse autant
   de fois.
3. Enchaînement et insertion : pris du début de la sortie à la jonction ; après, ou avant le début de
   la sortie, la commande est ordinaire.
4. Les quatre sessions de démonstration gardent les mêmes segments qu'avant.
5. Danse automatique : même graine, même danse ; deux graines, deux danses ; seules les figures du style
   sont tirées ; toute sortie modifiée l'est à sa jonction ; les commandes en file passent d'abord ;
   revenir à l'écoute arrête le tirage à la frontière suivante.
6. Phrase : sur 40 graines et 320 temps, la part des fins de phrase en position neutre est mesurée, et
   elle est nettement plus haute avec la préférence que sans (tirage à poids égaux).
7. Rejeu : accès direct = accès séquentiel, bascules comprises.
8. GLB : continuité aux frontières et aucun croisement d'os des jambes sur des sessions automatiques
   (six styles), en plus des contrôles existants.

## Rapport (21 novembre 2026)

`scripts/test_guidage.mjs` et sept scénarios Gherkin (`docs/features/mode-jeu.feature`), dans `npm test` :

- **File** : 750 commandes tirées (30 graines, écarts de 0 à 9 temps) : toutes dansées ou prises par une
  sortie, dans l'ordre des appuis, la file vide à la fin. Les quatre démonstrations gardent leurs segments.
- **Danse automatique**, 40 graines × 320 temps en kizomba : 255 sorties fille et 324 sorties garçon
  terminées, 87 enchaînements, 135 et 140 ida insérés. Une famille est rarement dansée deux fois de
  suite (moins de 20 % des figures). Toutes les figures du style sont tirées, et seulement elles (six
  styles, 20 graines).
- **Phrase** : une position neutre tombe sur **81 %** des fins de phrase, contre **24 %** avec un tirage
  à poids égaux. Ce n'est pas une obligation : 19 % des phrases finissent en cours de figure.
- **Rejeu** : 12 séances en direct (448 appuis, 64 bascules, 32 640 instants) donnent les mêmes segments
  que le plan calculé d'un coup. Une sortie modifiée à sa jonction a les mêmes poses que la sortie
  jusqu'à la jonction (écart nul sur le GLB, 186 poses).
- **GLB** : aucun croisement des os des jambes sur 2 211 poses autour des frontières des séances
  commandées (les figures s'y suivent désormais sans pas de base) et 912 poses de la danse
  automatique, jonctions comprises (six styles).

Ces tests ne valident pas la chorégraphie : le tirage produit une danse variée et phrasée, pas une danse
jugée juste par un danseur.

## Hors périmètre

- Une file modifiable (retirer ou réordonner une commande).
- De nouveaux départs en cours de figure (ontologie #95).
- Le défi de synchronisation en option : il est retiré, pas masqué.
