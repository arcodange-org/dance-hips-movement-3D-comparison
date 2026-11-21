# Spec #91 — un ida e volta inséré en milieu de sortie

[Accueil](../README.md) · [Mode guidage](spec-mode-guidage-poc.md) · [Ida en paire](spec-ida-paire.md) (#107) ·
[Enchaînements](spec-enchainements.md) (#90) · [Ontologie](spec-ontologie-figures.md), [ADR 004](adr/004-ontologie-source-des-figures.md)

## Demande du propriétaire (20 novembre 2026)

« Le leader peut guider un ida e volta en milieu de figure : par exemple un ida e volta jambe gauche
arrière en premier entre les temps/positions 3 et 4 de la sortie fille, ou entre les positions 2 et 3 de
la sortie garçon faire un ida e volta jambe gauche en avant en premier. »

## Mesure : où l'insérer

Aux fins d'action, sur les échantillonneurs :

| Position | Leader | Suiveur | Pas suivant du leader |
|---|---|---|---|
| Sortie fille, position 2 | sur son D (son G libre) | sur son G | son G **recule** (−31 cm) |
| Sortie garçon, position 2 | sur son D (son G libre) | sur son G | son G **avance** (+34 cm) |

Dans les deux sorties, la position 2 est la seule où la jambe gauche du leader est libre et où son pas
suivant va dans le sens demandé (en arrière dans la sortie fille, en avant dans la sortie garçon). C'est
le point d'insertion retenu. *Hypothèse à valider* : la numérotation du propriétaire (« temps/positions
3 et 4 » pour la sortie fille) compte autrement les positions.

## Modèle

- L'ida inséré est **un aller-retour du G du leader**, un créneau de 2 temps du cycle de l'ida e volta
  (#107) : en arrière dans la sortie fille, en avant dans la sortie garçon. Le suiveur fait le miroir avec
  son D.
- Les déplacements de l'ida (pieds, bassin, contraposition) s'ajoutent à la position 2 tenue. Puis la
  sortie reprend à son action 3 : la figure dure 2 temps de plus (7 temps, marka tenue comprise).
- **Touche** (« c'est un touch ») : le poids passe sur le pied sorti au temps, revient, et le retour se fait
  sans poids. Le leader reste sur son D, le suiveur sur son G : la sortie reprend comme elle s'était
  arrêtée.
- Dans la sortie garçon, le D du suiveur arrive tout près de celui du leader, à 4 cm environ depuis #130
  (12 cm entre #110 et #130). Pendant l'insertion, il s'ouvre de 3 cm vers sa gauche
  (`INSERTION_OPEN`), marge gardée pour qu'il ne frotte pas en allant et venant, puis revient.

> **Suite (#144, 21 novembre 2026)** : le propriétaire étend ce principe à tout pas qui avance ou recule
> (R27). Voir [la spec](spec-ida-partout.md), en attente de ses réponses.

## Mode jeu

La touche de l'ida (n'importe quelle variante) pendant une sortie, de son début à sa position 2, insère
l'ida adapté en position 2. Le segment change de nature sans changer de début : les poses jusqu'à la
position 2 sont celles de la sortie, donc sans saut. À partir de la position 2, ou pressée avant que la
sortie commence, la touche est une commande ordinaire de la file : l'ida e volta se danse après la
sortie (#140, [spec](spec-jeu-file-auto.md)). Une sortie avec ida inséré ne s'enchaîne pas (#90) : la
pression ↑ y est une commande ordinaire. La danse automatique tire le même choix à la position 2. Démo : `?mode=pair&guidage=1&demo=insertion`.

## Tests

- `scripts/test_insertion.mjs` (dans `npm test`) :
  - sortie inchangée avant la position 2, reprise après l'ida, continuité aux deux jonctions ;
  - G du leader dans le sens de son pas suivant, retour sans poids, suiveur jamais en avance (R24) ;
  - GLB ; semelles disjointes ; aucun croisement d'os des jambes (styles qui proposent les sorties,
    amplitudes 0,5 à 2, placements, plexus).
- `scripts/test_guidage.mjs` : fenêtre de l'insertion, variantes, continuité du squelette aux
  196 enchaînements.
