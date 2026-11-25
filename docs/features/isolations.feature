Feature: Exercices d'isolation seul, pieds posés : le cou, la poitrine, le bassin (#206)
  Spec : docs/spec-isolations.md (lot L441 de ReCoDanse). Élu le 24 novembre 2026 : chaque exercice enchaîne trois
  vitesses, du plus lent au plus rapide, deux mesures chacune : deux temps par mouvement, un temps, un demi-temps ; un
  point marqué est posé puis tenu, fluide au demi-temps. Élu le 25 novembre : le huit du bassin alterne, une mesure où il
  glisse, une mesure où il tourne aussi. « Sur 1 » veut dire « arrivé sur le temps 1 » de cette vitesse ;
  gauche et droite sont ceux du danseur. Sur le vrai squelette (pieds posés et immobiles, cage droite et de face, sens
  réels) : scripts/test_isolations.mjs.

  Scenario: La poitrine glisse devant puis derrière, et rien d'autre ne bouge
    Given l'exercice "poitrine-avant", à deux temps par mouvement
    Then la poitrine est devant sur 1, au centre sur 3, derrière sur 5, au centre sur 7
    Given l'exercice "poitrine-avant", à un temps par mouvement
    Then la poitrine est devant sur 1, au centre sur 2, derrière sur 3, au centre sur 4
    Given l'exercice "poitrine-avant", à un demi-temps par mouvement
    Then la poitrine est devant sur 1, derrière sur 2, devant sur 3, derrière sur 4
    And seule la partie "poitrine" bouge
    And la dernière image enchaîne sur la première

  Scenario: Trois vitesses, du plus lent au plus rapide, deux mesures chacune
    Then l'exercice "poitrine-avant" joue deux temps, puis un temps, puis un demi-temps par mouvement, pendant 8, 8 et 8 temps
    And l'exercice "poitrine-cercle-marque" joue deux temps, puis un temps, puis un demi-temps par mouvement, pendant 16, 8 et 8 temps

  Scenario: Le cercle marqué repasse par le centre, le lié non
    Given l'exercice "poitrine-cercle-marque", à un temps par mouvement
    Then la poitrine est devant sur 1, au centre sur 2, à droite sur 3, au centre sur 4, derrière sur 5, au centre sur 6, à gauche sur 7, au centre sur 8
    Given l'exercice "poitrine-cercle-lie", à deux temps par mouvement
    Then la poitrine est devant sur 1, à droite sur 3, derrière sur 5, à gauche sur 7
    And elle ne repasse jamais par le centre

  Scenario: Les mêmes cercles de la poitrine dans l'autre sens
    Given l'exercice "poitrine-cercle-marque-inverse", à un temps par mouvement
    Then la poitrine est devant sur 1, au centre sur 2, à gauche sur 3, au centre sur 4, derrière sur 5, au centre sur 6, à droite sur 7, au centre sur 8
    Given l'exercice "poitrine-cercle-lie-inverse", à deux temps par mouvement
    Then la poitrine est devant sur 1, à gauche sur 3, derrière sur 5, à droite sur 7
    And elle ne repasse jamais par le centre

  Scenario: Les cercles du bassin, marqué puis lié
    Given l'exercice "bassin-cercle-marque", à un temps par mouvement
    Then le bassin est devant sur 1, au centre sur 2, à droite sur 3, au centre sur 4, derrière sur 5, au centre sur 6, à gauche sur 7, au centre sur 8
    Given l'exercice "bassin-cercle-lie", à deux temps par mouvement
    Then le bassin est devant sur 1, à droite sur 3, derrière sur 5, à gauche sur 7
    And il ne repasse jamais par le centre

  Scenario: Le cercle de tête change de sens ; le demi-cercle passe par devant
    Given l'exercice "cou-cercle", à deux temps par mouvement
    Then la tête est devant sur 1, à droite sur 3, derrière sur 5, à gauche sur 7
    Given l'exercice "cou-cercle-inverse", à deux temps par mouvement
    Then la tête est devant sur 1, à gauche sur 3, derrière sur 5, à droite sur 7
    Given l'exercice "cou-demi-cercle", à deux temps par mouvement
    Then la tête est à gauche sur 1, devant sur 3, à droite sur 5, devant sur 7

  Scenario: Le demi-cercle de la poitrine
    Given l'exercice "poitrine-demi-cercle", à un temps par mouvement
    Then la poitrine est à gauche sur 1, devant sur 2, à droite sur 3, devant sur 4

  Scenario: Le cou tourne et penche : deux exercices
    Given l'exercice "cou-tourne", à deux temps par mouvement
    Then la tête est à gauche sur 1, au centre sur 3, à droite sur 5, au centre sur 7
    And la tête tourne sans pencher
    Given l'exercice "cou-penche", à deux temps par mouvement
    Then la tête est à gauche sur 1, au centre sur 3, à droite sur 5, au centre sur 7
    And la tête penche sans tourner

  Scenario: Le bassin glisse de côté ; le huit passe par le centre
    Given l'exercice "bassin-cote", à un temps par mouvement
    Then le bassin est à gauche sur 1, au centre sur 2, à droite sur 3, au centre sur 4
    Given l'exercice "bassin-huit", à deux temps par mouvement
    Then le bassin est au centre sur 1, à gauche sur 3, au centre sur 5, à droite sur 7

  Scenario: Le huit alterne : une mesure il glisse, une mesure il tourne aussi
    Given l'exercice "bassin-huit", à un temps par mouvement
    Then le huit glisse dans les mesures 1, 3, 5 et tourne aussi dans les mesures 2, 4, 6
    Given l'exercice "bassin-huit-inverse", à un temps par mouvement
    Then le huit glisse dans les mesures 1, 3, 5 et tourne aussi dans les mesures 2, 4, 6

  Scenario: Plus aucun candidat à élire : les réglages sont ceux élus
    Then sans interrupteur d'essai, les réglages sont ceux élus

  Scenario Outline: Seule la partie nommée bouge, et la boucle se referme (<exercice>)
    Given l'exercice "<exercice>"
    Then seule la partie "<partie>" bouge
    And la dernière image enchaîne sur la première

    Examples:
      | exercice                       | partie   |
      | cou-tourne                     | cou      |
      | cou-penche                     | cou      |
      | cou-hoche                      | cou      |
      | cou-cercle                     | cou      |
      | cou-cercle-inverse             | cou      |
      | cou-demi-cercle                | cou      |
      | poitrine-avant                 | poitrine |
      | poitrine-cote                  | poitrine |
      | poitrine-cercle-marque         | poitrine |
      | poitrine-cercle-lie            | poitrine |
      | poitrine-cercle-marque-inverse | poitrine |
      | poitrine-cercle-lie-inverse    | poitrine |
      | poitrine-demi-cercle           | poitrine |
      | bassin-bascule                 | bassin   |
      | bassin-cote                    | bassin   |
      | bassin-cercle-marque           | bassin   |
      | bassin-cercle-lie              | bassin   |
      | bassin-cercle-marque-inverse   | bassin   |
      | bassin-cercle-lie-inverse      | bassin   |
      | bassin-huit                    | bassin   |
      | bassin-huit-inverse            | bassin   |
