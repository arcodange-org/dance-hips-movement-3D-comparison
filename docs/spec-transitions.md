# Expliquer chaque transition : ce que le leader engage, ce que le suiveur reçoit (#94)

[Accueil](../README.md) · [Cadre](cadre/README.md) · [Figures du dépôt](cadre/figures-du-depot.md) · [Règles du propriétaire](regles-proprietaire.md)

## Demande du propriétaire (20 novembre 2026)

> « Ce qui est utile c'est entre chaque transition de position pouvoir expliquer la raison du
> mouvement : ce que le leader a engagé et ce que le suiveur a reçu. »
>
> « Le fait de pouvoir relier les figures entre elles doit aider à comprendre les distances et points
> de contact. »

## Modèle

Un module de données pur, `src/transitions.ts`, décrit chaque passage d'une position à la suivante :

| Champ | Contenu |
| --- | --- |
| `from`, `to` | temps local de la figure où commence et finit la transition |
| `title` | la position d'arrivée, en quelques mots |
| `leader` | ce que le leader engage : partie du corps, direction, point de contact |
| `follower` | ce que le suiveur reçoit et ce qu'il fait |
| `contacts` | la distance et les contacts qui changent |
| `sources` | d'où vient chaque affirmation : règle du propriétaire (`R…`), demande datée (`Pr`), référence du [cadre](cadre/figures-du-depot.md#références) (`S7`, `S8`, `S16`), ou issue du dépôt (`#…`) |

`transitionsOf(clé)` rend la liste ordonnée d'une figure ; `transitionAt(clé, temps)` rend celle en
cours. Les clés sont celles du mode jeu (`GuideKind` hors pas de base) : sorties et leurs variantes
(crochet, recul), sortie fille enchaînée sur la fin de la sortie garçon (#90), sorties avec ida
inséré (#91), quart de tour, les quatre ida e volta (#89) et les trois marches.

Les figures composées réutilisent les entrées des figures simples. La sortie fille enchaînée reprend
les actions 1 à 3 de la sortie fille, ajoute le pont de 2 temps, puis reprend les actions 3 à 5 de la
sortie garçon, décalées. Les sorties avec ida reprennent l'ida au bon temps.

## Source des textes

Les tableaux de [figures du dépôt](cadre/figures-du-depot.md) (Garcia [S8], West [S16], précisions
du propriétaire) sont repris et mis à jour avec les décisions postérieures :

- sortie garçon : le suiveur ne fait que reculer, droit ; le leader gère seul son décalage (#110).
  En position 2, les pieds D sont tout près (4 cm) et les genoux D proches, le bassin du leader reste
  légèrement en arrière de son D (#130), et la moitié droite des bustes se fait face (#104) ;
- sortie fille : pas aux unités du propriétaire, un pied en longueur et une demi-hanche à une hanche
  et demie en largeur (#105) ;
- quarts : départs simultanés (#82), bassin et buste en diagonale au premier pied (R25, #106) ;
- ida e volta : un aller-retour par 2 temps, même longueur de pas (R22), suiveur jamais en avance
  (R24), contraposition (R4) (#107) ;
- marches du mode jeu (#89), enchaînement (#90), insertion (#91).

Aucun texte n'invente une sensation. Quand la réception n'est pas sourcée, la phrase décrit seulement
ce que le suiveur fait. Ces textes ne constituent pas une validation chorégraphique.

## Affichage

- Application : sous le sélecteur de pose des sorties, à la place de la ligne fixe. Le panneau donne
  la transition en cours : leader, suiveur, contacts.
- Mode jeu : sous le compte, la transition en cours de la figure dansée. Rien n'est affiché pendant
  le pas de base.

## Critères d'acceptation (`scripts/test_transitions.mjs`, dans `npm test`)

1. Chaque figure du mode jeu (hors pas de base) a des transitions qui couvrent son temps sans trou ni
   chevauchement, de 0 à la fin de la figure.
2. Chaque transition a un titre, des textes leader, suiveur et contacts non vides, et au moins une
   source. Chaque règle citée existe dans [les règles du propriétaire](regles-proprietaire.md).
3. `transitionAt` rend la transition en cours. À un temps entier, elle rend celle qui vient d'atteindre la
   position affichée : la pose 2 est expliquée par la transition 1 → 2. Au départ, elle rend la première ;
   après la fin, la dernière.
4. Cohérence avec les décisions : dans la sortie garçon, le texte du suiveur aux actions 1 et 2 dit
   qu'il recule (#110). Une marka dit « sans transfert ». Une transition du suiveur ne le fait jamais
   partir avant le leader (pas de « avant le leader » ni de « anticipe »).
5. Les figures composées réutilisent mot pour mot les entrées des figures simples.
