# Page principale : la scène toujours visible, les réglages dans un panneau (#192)

La page principale (un danseur, la comparaison, la vue en couple) montre la scène dès l'ouverture et range
ses commandes dans un panneau. Interface seulement : le mouvement ne change pas.

Deuxième lot de la simplification de la page, après le jeu et la vitrine sur téléphone
([spec](spec-jeu-telephone.md), #186). Le propriétaire a choisi le 24 novembre 2026 l'organisation A du
canevas d'audit : la scène et un panneau.

## Constat

Mesuré sur `main` (cd3dc24) le 23 novembre, dans un navigateur.

| Vue | Écran | Début de la scène | Commandes | Mots |
| --- | --- | --- | --- | --- |
| Un danseur | 1280 × 800 | 640 px | 43 | 398 |
| Un danseur | téléphone, 664 px visibles | 2,3 écrans plus bas | 43 | 398 |
| Comparaison | 1280 × 800 | 712 px | 46 | 461 |
| En couple | 1280 × 800 | 910 px | 51 | 629 |
| En couple, sortie garçon | 1280 × 800 | 1 134 px | 55 | 770 |
| En couple, sortie garçon | téléphone, 664 px visibles | 3,6 écrans plus bas | 55 | 770 |

- La scène est sous les commandes : à l'ouverture on ne voit pas les hanches à l'ordinateur, et aucun
  danseur au téléphone.
- Les commandes sont à plat, dans l'ordre où elles ont été ajoutées. Les réglages de mise au point (pieds
  plantés, isolation basse, cadre de bras, contraposition, plexus) sont au même niveau que le style et le tempo.
- Les mêmes mots désignent des choses différentes : « Déplacement » (un curseur et la liste des figures),
  « Isolation » (le buste, et un seul corps affiché), « Vue » (les muscles, et la caméra du jeu), leader et
  guideur, partenaire, suiveur et suiveuse.
- Des libellés sont techniques : « (dir=-1) », « (URL) », « (WebM) », « (options exclusives) »,
  « Style B (inactif) ».
- Des commandes s'affichent où elles ne servent pas : le style B hors comparaison, le curseur de
  déplacement et des cases grisées pendant une sortie, la boussole sans son repère.
- « Observation hanche » est un préréglage (tempo 32, buste masqué, appuis) rangé parmi les modes ; il ne
  remet rien en place quand on le quitte.
- Au téléphone, un doigt posé sur la scène la fait tourner et ne fait pas défiler la page ; la scène
  prenait 538 des 664 px visibles : il restait peu de place où poser le doigt pour faire défiler.

## Décisions

### Trois dispositions

La disposition suit la taille de la fenêtre, par la même règle que le jeu (`hudLayout`, `src/jeuHud.ts`).

| Disposition | Condition | La page |
| --- | --- | --- |
| `large` | tablette, ordinateur | Un bandeau (titre, onglets, « Partager », « À propos »). Dessous, la scène à gauche avec sa barre de lecture, le panneau à droite (360 px). La page tient dans la fenêtre ; seul le panneau défile. |
| `couche` | téléphone couché | Pas de bandeau. La scène à gauche sur toute la hauteur, sa barre de lecture réduite à une rangée ; le panneau à droite, qui défile et commence par les onglets et le tempo. |
| `droit` | téléphone tenu droit | Le bandeau, les onglets, puis la scène (300 px au plus, 45 % de la hauteur visible), la barre de lecture et les réglages. La page défile ; la scène reste collée en haut de l'écran. |

- La scène est un seul et même élément dans les trois dispositions : tourner le téléphone ne recharge pas
  les corps et garde la caméra.
- Sur un écran tactile, quelle que soit la disposition, chaque commande fait au moins 44 px (`TOUCH_MIN`).
  À la souris, la disposition `large` est plus serrée (32 à 40 px).
- Téléphone tenu droit : le doigt sur la scène la fait tourner ; partout ailleurs, il fait défiler les
  réglages, et la scène reste visible pendant qu'on règle.

### Onglets

« Seul · Comparer · En couple · Jeu ».

| Onglet | `mode=` | |
| --- | --- | --- |
| Seul | `solo`, `observe` | un danseur |
| Comparer | `compare` | deux styles côte à côte |
| En couple | `pair` | le guideur et la suiveuse |
| Jeu | lien vers `?mode=pair&guidage=1&style=…` | le mode jeu, inchangé (#186) ; son bouton de retour ramène à la vue en couple |

### Barre de lecture, contre la scène

- Lecture ou pause, et « Rejouer » (revient au début et lance la lecture), pour toute figure.
- Pour une figure en cinq actions (sortie garçon, sortie fille, en couple) : « Départ » et les pas 1 à 5.
  Un pas choisi arrête la lecture sur sa pose, comme la liste « Pose de la sortie » d'avant. Au
  téléphone : pas précédent, « Pas 4 sur 5 », pas suivant.
- Ce qui se danse : le numéro et le nom du pas pour une figure en cinq actions ; sinon le compte de 1 à 8 et
  le nom de la figure. En disposition `large`, la barre dit aussi ce que fait le guideur et ce que fait la
  suiveuse (les textes de `src/transitions.ts`) ; le détail (contacts, sources) est dans le tiroir
  « Ce pas en détail ».
- Tempo (24 à 140 bpm), et à côté « Tempo de la piste » ou « Tempo conseillé » quand il diffère.
- Son : un bouton. Ses réglages sont dans le tiroir « Son ».

### Panneau

1. **Style** : les six styles. Dans « Comparer », deux rangées : « À gauche » et « À droite ». La seconde
   rangée n'existe pas ailleurs.
2. **Figure** : Sur place, Corridinho, Quarts de tour, 3 temps, Ida e volta ; en couple s'ajoutent Sortie
   garçon et Sortie fille. Une figure qu'un style n'offre pas reste visible, grisée, avec la raison.
3. **Réglages de la figure choisie**, juste sous elle : la fin de la sortie garçon, le deuxième pas du
   guideur dans la sortie fille, la virgula du guideur dans l'ida e volta en couple, le placement du couple.
4. **Tiroirs**, fermés à l'ouverture :
   - **Corps** : Squelette ou Muscles (visible sans ouvrir le tiroir), buste, poids sur chaque pied, corps
     montrés, « Hanches au ralenti ».
   - **Mouvement** : amplitude, largeur du pas, reculer.
   - **Repères au sol** : ligne de danse, repère au centre (masqué, point, boussole), repères de proximité.
   - **Son** : source, volume, musique de gauche ou de droite en comparaison, instruments.
   - **Ce pas en détail** : pendant une figure en cinq actions.
   - **Mise au point** : pieds plantés, isolation basse, cadre de bras, contraposition de la sortie garçon,
     plexus contre plexus, sortie combinée.
   - « Exporter une vidéo ».
5. L'attribution, en bas du panneau : « Anatomie : BodyParts3D © DBCLS, licence CC BY-SA 2.1 Japan. »

« À propos » (bandeau, ou haut du panneau téléphone couché) ouvre une fiche : ce que la page montre, la
figure choisie, les styles affichés, les réserves, l'attribution complète (BodyParts3D, CC BY-SA 2.1 Japan
© DBCLS, avec son adresse), le crédit de la musique, et le fait que les réglages sont gardés dans le
navigateur.

Une commande n'apparaît que là où elle sert (`commandeVisible`, `src/page.ts`) : pas de style de droite
hors comparaison, pas de largeur du pas ni de « Reculer » pendant une sortie, pas de repères de proximité
hors couple.

### « Hanches au ralenti »

L'ancien mode « Observation hanche » devient un préréglage du tiroir « Corps », dans l'onglet « Seul ».

- L'activer : tempo 32, buste masqué, largeur du pas à zéro, poids sur chaque pied affiché (comme avant),
  et `mode=observe`.
- Le quitter remet le tempo, le buste, la largeur du pas et le poids sur chaque pied comme ils étaient
  avant de l'activer. Si la page a été ouverte déjà au ralenti (lien, visite précédente) : buste affiché,
  poids masqué, le tempo et la largeur du pas restent.

### Les mots

Le guideur et la suiveuse, partout sur la page. Les textes des transitions (`src/transitions.ts`),
partagés avec le jeu et couverts par leurs tests, gardent leurs mots : voir « Hors périmètre ».

| Avant | Maintenant |
| --- | --- |
| Solo, Observation hanche, Comparaison côte à côte, Face à face | Seul, Comparer, En couple ; « Hanches au ralenti » |
| Style A (gauche), Style B (droite), Style B (inactif) | Style ; « À gauche », « À droite » en comparaison |
| Déplacement (options exclusives) | Figure |
| Déplacement (le curseur) | Largeur du pas |
| Marche arrière (dir=-1) | Reculer |
| Vue : Squelette / + Muscles (tissus) | Corps : Squelette / Muscles |
| Buste stylisé | Buste |
| Appuis indicatifs | Poids sur chaque pied |
| Isolation : les deux corps, A seul, B seul | Montrer : les deux, un seul |
| Repère fixe (origine), Boussole 8 directions | Repère au centre : masqué, point, boussole |
| Pose de la sortie garçon, de la sortie fille | Départ, pas 1 à 5 |
| Rejouer la sortie garçon, la sortie fille | Rejouer |
| Fin de la sortie garçon | Fin |
| Deuxième pas du leader | Deuxième pas du guideur |
| Virgula du leader | Virgula du guideur |
| Exporter un cycle (WebM) | Exporter une vidéo |
| Partager la vue (URL) | Partager |
| Essayer le mode guidage | onglet « Jeu » |
| Leader, Suiveur (fiche d'un pas) | Guideur, Suiveuse |

### Inventaire : chaque commande et sa place

Chaque commande de la page porte un nom stable (`data-commande`), le même que dans `COMMANDES`
(`src/page.ts`). La mesure dans le navigateur compare, pour chaque vue, les commandes attendues et celles
de la page.

| Commande | Dans l'adresse | Place | Affichée |
| --- | --- | --- | --- |
| `onglets` | `mode=` | bandeau | toujours |
| `jeu` | `guidage=` | bandeau | toujours |
| `partager` | écrit tous les réglages | bandeau | toujours |
| `apropos` | | bandeau | toujours |
| `lecture` | `playing=` | barre de lecture | toujours |
| `rejouer` | | barre de lecture | toujours |
| `pas` | `sortieBeat=` | barre de lecture | figure en cinq actions |
| `tempo` | `bpm=` | barre de lecture | toujours |
| `tempoConseille` | | barre de lecture | quand le tempo diffère |
| `son` | `son=` | barre de lecture | toujours |
| `style` | `style=` | panneau | toujours |
| `styleB` | `styleB=` | panneau | Comparer |
| `figure` | `corridinho=` `quarts=` `temps3=` `ida=` `sortieG=` `sortieF=` | panneau | toujours |
| `fin` | `sortieVariant=` | sous la figure | sortie garçon en couple |
| `deuxiemePas` | `sortieFilleVariant=` | sous la figure | sortie fille en couple |
| `virgula` | `virgula=` | sous la figure | ida e volta en couple |
| `placement` | `placement=` | sous la figure | en couple, sauf sortie combinée |
| `muscles` | `muscles=` | Corps | toujours |
| `buste` | `torso=` | Corps | toujours |
| `poids` | `appui=` | Corps | toujours |
| `montrer` | `ghost=` | Corps | Comparer, En couple |
| `ralenti` | `mode=observe` | Corps | Seul |
| `amplitude` | `amp=` | Mouvement | toujours |
| `largeurPas` | `travel=` | Mouvement | hors figure en cinq actions, styles qui se déplacent |
| `reculer` | `dir=` | Mouvement | hors figure en cinq actions |
| `ligne` | `ligne=` | Repères au sol | Comparer, En couple |
| `repere` | `repere=` `boussole=` | Repères au sol | toujours |
| `proximite` | `contacts=` | Repères au sol | En couple |
| `source` | `source=` | Son | styles qui ont une piste enregistrée |
| `volume` | | Son | toujours |
| `musiqueCote` | `musique=` | Son | Comparer |
| `instruments` | | Son | musique de synthèse |
| `detailPas` | | Ce pas en détail | figure en cinq actions |
| `export` | | panneau | toujours |
| `piedsPlantes` | `plant=` | Mise au point | hors figure en cinq actions |
| `isolationBasse` | `iso=` | Mise au point | toujours |
| `cadre` | `cadre=` | Mise au point | toujours |
| `contraSortie` | `sortieContra=` | Mise au point | sortie garçon en couple |
| `plexus` | `contra=` | Mise au point | en couple, sauf sortie combinée |
| `sortieCombinee` | `sortieGF=` | Mise au point | En couple |

Par l'adresse seulement, inchangé : `cam`, `angle`, `zoom`, `campos`, `camtgt`, `bare`, `demo`, `solid`,
`haut`, `essai`, `kompa`, `semba`, `sortieBeat` hors figure, et ceux du jeu et de la vitrine (`graine`,
`hasard`, `ginga`, `beat`, `vitrine`, `auto`, `vue`).

## Ce qui ne change pas

- Aucun paramètre d'URL n'est renommé ni retiré ; leur lecture (`parseShareParams`) et l'écriture du lien
  partagé (`buildShareUrl`) sont les mêmes.
- Les réglages gardés dans le navigateur gardent leurs clés.
- La vue `bare=1` des captures, le jeu, la vitrine.
- Le mouvement : aucun de `src/pose.ts`, `src/guidage.ts`, `src/styles.ts`, `src/cadre.ts`,
  `src/upperBody.ts`, `src/gait.ts` n'est modifié.
- La musique, l'export vidéo, l'horloge.

## Code

- `src/page.ts` (pur) : onglets, figures offertes par onglet, inventaire `COMMANDES` et `commandeVisible`,
  pas affiché et pas voisin, compte, repère au centre, préréglage « Hanches au ralenti ».
- `src/components/page/` : `PagePrincipale` (disposition, bandeau, scène), `BarreLecture`, `Panneau`,
  `Tiroirs`, `APropos`, `commun` (boutons, interrupteurs, curseurs).
- `src/App.tsx` : seul le rendu de la page change (un appel à `PagePrincipale`) ; l'état, la lecture de
  l'adresse, la scène et la vue `bare=1` restent.
- Retirés, remplacés par le panneau : `Controls`, `SortieGarconControls`, `SortieFilleControls`,
  `PlacementControl`, `SoundControls`.

## Vérification

- `docs/features/page-scene-panneau.feature`, dans `npm test` : onglets et modes, figures par onglet,
  commandes affichées selon la vue, pas affiché et pas voisin, repère au centre, « Hanches au ralenti »
  et son retour, chaque paramètre du lien partagé a sa commande.
- `scripts/mesure_page.mjs <adresse> [dossier]` (navigateur, hors `npm test`), à l'ordinateur et avec les
  profils de téléphone de Playwright, pour les vues « Seul », « Comparer », « En couple » et « En couple,
  sortie garçon ». Critères :
  - la scène est entière dans le premier écran, et fait au moins 40 % de sa hauteur ;
  - les commandes de la page sont exactement celles de l'inventaire pour la vue, tiroirs ouverts ;
  - aucune commande ne dépasse de l'écran en largeur ; pas de défilement horizontal ;
  - sur un profil tactile, chaque commande fait au moins 44 px ;
  - téléphone tenu droit : la page défile sous le doigt posé hors de la scène, et la scène reste à l'écran ;
  - l'attribution est dans la page.

## Hors périmètre

- Les textes des transitions (`src/transitions.ts`) disent encore « leader » et « suiveur » : ils sont
  partagés avec le jeu, sourcés et couverts par `scripts/test_transitions.mjs`. Les réécrire est un lot à part.
- Des onglets communs dans le jeu : le jeu garde son bouton de retour (#186).
- Les GIF du README ne sont pas refaits : ils viennent de la vue `bare=1`, inchangée.
