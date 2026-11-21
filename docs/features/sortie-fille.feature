Feature: Sortie fille en paire
  Le leader amorce la sortie dans le cadre. Le suiveur sort à gauche puis croise pour rentrer.

  Scenario: Crochet du droit du leader et sortie latérale du suiveur
    When on échantillonne la sortie fille au deuxième pas en variante "hook"
    Then le droit du leader prend un crochet et le gauche du suiveur sort latéralement

  Scenario: Recul du droit du leader et sortie diagonale du suiveur
    When on échantillonne la sortie fille au deuxième pas en variante "back"
    Then le droit du leader recule et le gauche du suiveur avance en diagonale

  Scenario: Virgula du leader au premier temps de la variante crochet
    When on échantillonne la sortie fille au premier pas en variante "hook"
    Then le gauche du leader se pose perpendiculaire, aussi loin en avant que le pas droit
    And le bassin du leader s'ouvre à gauche sans que son buste le suive
    And le suiveur fait les mêmes pas qu'avec le pas droit

  Scenario: Pas de virgula dans la variante recul
    When on échantillonne la sortie fille au premier pas en variante "back"
    Then le gauche du leader reste pointé vers l'avant
