Feature: Exercices sur la pointe des pieds, et lever-baisser les talons (#216)
  Spec : docs/spec-pointes-talons.md (suite du lot L441 de ReCoDanse). Sur la pointe des pieds, les deux talons sont
  levés toute la boucle et l'exercice est celui à plat ; l'exercice des talons les lève et les baisse ensemble, aux trois
  vitesses des autres exercices. Élu le 25 novembre 2026 : les talons montent à mi-hauteur ; l'exercice des talons suit
  les trois vitesses. Sur le vrai
  squelette (avant-pieds immobiles, le corps monté d'un bloc) : scripts/test_isolations.mjs.

  Scenario: L'exercice des talons, aux trois vitesses
    Given l'exercice "talons", à deux temps par mouvement
    Then les talons sont en haut sur 1, à plat sur 3, en haut sur 5, à plat sur 7
    Given l'exercice "talons", à un temps par mouvement
    Then les talons sont en haut sur 1, à plat sur 2, en haut sur 3, à plat sur 4
    Given l'exercice "talons", à un demi-temps par mouvement
    Then les talons sont en haut sur 1, en haut sur 2, en haut sur 3, en haut sur 4
    And seule la partie "pieds" bouge
    And la dernière image enchaîne sur la première

  Scenario: Les talons levés montent à mi-hauteur, dans l'exercice des talons comme sur la pointe des pieds
    Then les talons levés montent à mi-hauteur

  Scenario Outline: Sur la pointe des pieds, l'exercice est celui à plat (<exercice>)
    Given l'exercice "<exercice>" sur la pointe des pieds
    Then les talons restent levés toute la boucle
    And l'exercice bouge comme à plat
    And la dernière image enchaîne sur la première

    Examples:
      | exercice               |
      | cou-cercle             |
      | cou-demi-cercle        |
      | poitrine-cercle-marque |
      | poitrine-cercle-lie    |
      | poitrine-cote          |
      | bassin-cote            |
      | bassin-huit            |

  Scenario: Sans pointes, les talons restent à plat ; les réglages sont ceux élus
    Then sans pointes, les talons restent à plat dans tous les exercices sauf celui des talons
    And sans interrupteur d'essai, les réglages sont ceux élus
