Feature: Oracle de poses évaluées et cibles, repère extérieur du danseur
  La continuité évalue les limites et les atterrissages, pas l'égalité de deux appels au même instant.
  Les consignes locales ne sont pas présentées comme des orientations mondiales.

  Scenario: Quarts de tour — continuité des poses et raccord de cycle
    Given le mouvement "quarts" sur 16 temps
    When on calcule les poses oracle des demi-pas k de 0 à 7
    Then les poses évaluées sont continues autour des frontières et des atterrissages
    And la pose au temps 16 est égale à la pose au temps 0 (raccord de cycle)

  Scenario: Quarts de tour — repères indépendants et distinction pose/cible
    Given le mouvement "quarts" sur 16 temps
    When on calcule les poses oracle des demi-pas k de 0 à 7
    Then les poses et cibles respectent les repères géométriques indépendants

  Scenario: Quarts de tour — les huit demi-pas reverse sont évalués
    Given le mouvement "quarts" sur 16 temps
    When on calcule les poses oracle des demi-pas k de 0 à 7 en reverse
    Then chaque pose reverse est le miroir dans le repère extérieur sur tous les demi-pas
    And les poses évaluées sont continues autour des frontières et des atterrissages

  Scenario: Quarts de tour — angle droit après atterrissage
    Given le mouvement "quarts" sur 16 temps
    When on calcule les poses oracle aux temps 1.2, 5.2, 9.2, 13.2
    Then l'écart des lacets des pieds posés vaut pi/2

  Scenario: Ida e volta — continuité des quatre pas et raccord de cycle
    Given le mouvement "ida" sur 8 temps
    When on calcule les poses oracle des demi-pas k de 0 à 3
    Then les poses évaluées sont continues autour des frontières et des atterrissages
    And la pose au temps 8 est égale à la pose au temps 0 (raccord de cycle)

  Scenario: Ida e volta — contraposition nominale locale
    Given le mouvement "ida" sur 8 temps
    When on calcule les poses oracle aux temps 1, 3, 5, 7
    Then les consignes nominales haut et bas sont opposées et nulles aux frontières
