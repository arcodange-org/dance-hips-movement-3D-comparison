Feature: Exercices sur la pointe des pieds, et lever-baisser les talons (#216)
  Spec : docs/spec-pointes-talons.md (suite du lot L441 de ReCoDanse). Sur la pointe des pieds, les deux talons sont
  levés toute la boucle et l'exercice est celui à plat ; l'exercice des talons les lève et les baisse ensemble, aux trois
  vitesses des autres exercices. La hauteur des talons et le rythme de l'exercice des talons sont à élire. Sur le vrai
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

  Scenario: Candidat : monter, tenir, redescendre
    Given l'exercice "talons"
    And le candidat "talonsTenue"
    Then les talons sont en haut sur 1, en haut sur 2, en haut sur 3, à plat sur 4, en haut sur 5

  Scenario: Candidat : les talons montent un peu
    Given l'exercice "poitrine-cercle-lie" sur la pointe des pieds
    And le candidat "talonsBas"
    Then les talons restent levés toute la boucle
    And l'exercice bouge comme à plat

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
      | poitrine-cote          |
      | bassin-cote            |
      | bassin-huit            |

  Scenario: Sans pointes, les talons restent à plat ; les candidats ne changent rien sans essai demandé
    Then sans pointes, les talons restent à plat dans tous les exercices sauf celui des talons
    And sans interrupteur d'essai, les réglages sont ceux élus
