Feature: Virgula du leader dans l'ida e volta en paire
  Effet de style en option (#128) : quand le gauche du leader avance, il se pose perpendiculaire.

  Scenario: Le gauche du leader se pose perpendiculaire, le suiveur ne change pas
    When on échantillonne l'ida e volta en paire avec la virgula du leader
    Then le gauche du leader est perpendiculaire quand il est sorti en avant, et droit le reste du cycle
    And le suiveur fait les mêmes pas que sans virgula
