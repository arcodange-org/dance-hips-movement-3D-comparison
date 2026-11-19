Feature: Sortie fille en paire
  Le leader amorce la sortie dans le cadre. Le suiveur sort à gauche puis croise pour rentrer.

  Scenario: Crochet du droit du leader et sortie latérale du suiveur
    When on échantillonne la sortie fille au deuxième pas en variante "hook"
    Then le droit du leader prend un crochet et le gauche du suiveur sort latéralement

  Scenario: Recul du droit du leader et sortie diagonale du suiveur
    When on échantillonne la sortie fille au deuxième pas en variante "back"
    Then le droit du leader recule et le gauche du suiveur avance en diagonale
