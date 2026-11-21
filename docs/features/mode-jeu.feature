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

  Scenario: La touche de l'ida pressée pendant une sortie y insère l'ida e volta
    When le joueur commande "sortieG, ida" aux temps "3.9, 4.1"
    Then les segments du mode jeu sont "base@0 sortieGI@4 base@12"

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
