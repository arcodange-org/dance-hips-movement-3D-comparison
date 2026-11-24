Feature: Exercices d'isolation seul, pieds posés : le cou, la poitrine, le bassin (#206)
  Spec : docs/spec-isolations.md (lot L441 de ReCoDanse). Un exercice dure un huit et boucle ; « sur 1 » veut dire
  « arrivé sur le temps 1 » ; gauche et droite sont ceux du danseur. Sur le vrai squelette (pieds posés et immobiles,
  cage droite et de face, sens réels) : scripts/test_isolations.mjs.

  Scenario: La poitrine glisse devant puis derrière, et rien d'autre ne bouge
    Given l'exercice "poitrine-avant"
    Then la poitrine est devant sur 1, au centre sur 2, derrière sur 3, au centre sur 4
    And seule la partie "poitrine" bouge
    And la dernière image du huit enchaîne sur la première

  Scenario: Le cercle marqué repasse par le centre, le lié non
    Given l'exercice "poitrine-cercle-marque"
    Then la poitrine est devant sur 1, au centre sur 2, à droite sur 3, au centre sur 4, derrière sur 5, au centre sur 6, à gauche sur 7, au centre sur 8
    Given l'exercice "poitrine-cercle-lie"
    Then la poitrine est devant sur 1, à droite sur 3, derrière sur 5, à gauche sur 7
    And elle ne repasse jamais par le centre

  Scenario: Les mêmes cercles de la poitrine dans l'autre sens
    Given l'exercice "poitrine-cercle-marque-inverse"
    Then la poitrine est devant sur 1, au centre sur 2, à gauche sur 3, au centre sur 4, derrière sur 5, au centre sur 6, à droite sur 7, au centre sur 8
    Given l'exercice "poitrine-cercle-lie-inverse"
    Then la poitrine est devant sur 1, à gauche sur 3, derrière sur 5, à droite sur 7
    And elle ne repasse jamais par le centre

  Scenario: Les cercles du bassin, marqué puis lié
    Given l'exercice "bassin-cercle-marque"
    Then le bassin est devant sur 1, au centre sur 2, à droite sur 3, au centre sur 4, derrière sur 5, au centre sur 6, à gauche sur 7, au centre sur 8
    Given l'exercice "bassin-cercle-lie"
    Then le bassin est devant sur 1, à droite sur 3, derrière sur 5, à gauche sur 7
    And il ne repasse jamais par le centre

  Scenario: Le cercle de tête change de sens
    Given l'exercice "cou-cercle"
    Then la tête est devant sur 1, à droite sur 3, derrière sur 5, à gauche sur 7
    Given l'exercice "cou-cercle-inverse"
    Then la tête est devant sur 1, à gauche sur 3, derrière sur 5, à droite sur 7

  Scenario: Le cou tourne et penche : deux exercices, deux temps par point
    Given l'exercice "cou-tourne"
    Then la tête est à gauche sur 1, au centre sur 3, à droite sur 5, au centre sur 7
    And la tête tourne sans pencher
    Given l'exercice "cou-penche"
    Then la tête est à gauche sur 1, au centre sur 3, à droite sur 5, au centre sur 7
    And la tête penche sans tourner

  Scenario: Le bassin glisse de côté ; le huit passe par le centre
    Given l'exercice "bassin-cote"
    Then le bassin est à gauche sur 1, au centre sur 2, à droite sur 3, au centre sur 4
    Given l'exercice "bassin-huit"
    Then le bassin est au centre sur 1, à gauche sur 3, au centre sur 5, à droite sur 7

  Scenario: Les candidats à élire ne changent rien sans essai demandé
    Then sans interrupteur d'essai, les réglages sont la proposition

  Scenario Outline: Seule la partie nommée bouge, sur un huit qui boucle (<exercice>)
    Given l'exercice "<exercice>"
    Then seule la partie "<partie>" bouge
    And la dernière image du huit enchaîne sur la première

    Examples:
      | exercice                       | partie   |
      | cou-tourne                     | cou      |
      | cou-penche                     | cou      |
      | cou-hoche                      | cou      |
      | cou-cercle                     | cou      |
      | cou-cercle-inverse             | cou      |
      | poitrine-avant                 | poitrine |
      | poitrine-cote                  | poitrine |
      | poitrine-cercle-marque         | poitrine |
      | poitrine-cercle-lie            | poitrine |
      | poitrine-cercle-marque-inverse | poitrine |
      | poitrine-cercle-lie-inverse    | poitrine |
      | bassin-bascule                 | bassin   |
      | bassin-cote                    | bassin   |
      | bassin-cercle-marque           | bassin   |
      | bassin-cercle-lie              | bassin   |
      | bassin-cercle-marque-inverse   | bassin   |
      | bassin-cercle-lie-inverse      | bassin   |
      | bassin-huit                    | bassin   |
      | bassin-huit-inverse            | bassin   |
