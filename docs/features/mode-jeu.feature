Feature: Mode jeu : file de commandes, écoute par défaut, danse automatique
  Demande du propriétaire (#140) : pas de défi de synchronisation, les commandes s'empilent dans une file ;
  le simulateur écoute dès l'ouverture ; Espace laisse le couple danser seul (docs/spec-jeu-file-auto.md).

  Scenario: Les commandes s'empilent dans une file et se dansent dans l'ordre
    When le joueur commande "ida, quart, sortieG, quart" aux temps "1, 1.5, 2, 2.2"
    Then les segments du mode jeu sont "base@0 ida@4 quart@12 sortieG@16 quart@22 base@26"
    And aucune commande n'est refusée ni perdue

  Scenario: Une commande pressée juste après une position neutre attend la suivante
    When le joueur commande "ida" aux temps "4.05"
    Then les segments du mode jeu sont "base@0 ida@8 base@16"

  Scenario: À l'écoute et sans commande, le couple danse le pas de base
    When le joueur commande "" aux temps ""
    Then les segments du mode jeu sont "base@0"

  Scenario: La touche de l'ida pendant une figure transforme son prochain pas en aller-retour
    Règle R27 (#144) : « chaque pied qui avance ou qui recule peut devenir un "ida e volta" (un simple
    aller retour du pied, en virgula ou non) ». La figure dure deux temps de plus.
    When le joueur commande "sortieG, ida" aux temps "3.9, 5.5"
    Then les segments du mode jeu sont "base@0 sortieG+2@4 base@12"

  Scenario: Le premier pas d'une figure qui attend peut devenir un aller-retour
    « Une sortie garçon (G1) peut être remplacée par une ida volta et reprendre ensuite. »
    When le joueur commande "sortieG, ida" aux temps "1, 2"
    Then les segments du mode jeu sont "base@0 sortieG+0@4 base@12"

  Scenario: Un retour de sortie fille (D4) peut être un aller-retour
    When le joueur commande "sortieF, ida" aux temps "3.9, 6.5"
    Then les segments du mode jeu sont "base@0 sortieF+3@4 base@12"

  Scenario: Sans figure en cours ni en attente, la touche de l'ida commande l'ida e volta de 8 temps
    When le joueur commande "ida, ida" aux temps "1, 2"
    Then les segments du mode jeu sont "base@0 ida@4 ida@12 base@20"

  Scenario: Pendant un aller-retour le poids reste sur l'autre pied
    « Si c'est le pied gauche qui sort et revient le poids reste à droite au début et à la fin et c'est
    encore au pied gauche de bouger ensuite. »
    When on échantillonne chaque aller-retour proposé par le mode jeu
    Then le pied part dans le sens de son pas et revient où il était
    And le poids est sur l'autre pied au début et à la fin, et la figure reprend avec le même pied

  Scenario: En danse automatique, une figure du style commence à chaque position neutre
    When le couple danse seul pendant 320 temps avec la graine 7
    Then chaque segment après le pas de base du début est une figure choisie par le simulateur
    And la même graine redonne la même danse, une autre graine une autre danse

  Scenario: La danse automatique cherche une position neutre toutes les 32 temps sans se l'imposer
    When le couple danse seul pendant 320 temps avec les graines 1 à 40
    Then une position neutre tombe sur plus de 70 % des fins de phrase, et pas sur toutes

  Scenario: Les commandes en file passent avant le tirage de la danse automatique
    When le couple danse seul avec la graine 7 et le joueur commande "quart" au temps 20.5
    Then la commande est dansée à la position neutre qui suit, puis le simulateur reprend
