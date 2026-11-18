Feature: Contact sol — aucun os sous le sol (y >= 0)
  Convention verrouillée : clamp sol root.position.y >= 0 ; demande 2026-11-19 : dans le
  transfert de poids (pied -> membres du haut), AUCUN os ne peut passer sous le sol
  (gravité vers le bas + biomécanique qui maintient le corps). Le pied d'appui reste
  planté au sol, le pied en balancement reste au-dessus (cloche sin >= 0).

  Scenario: clampSolY remonte le root si un os dépasserait sous le sol
    Then clampSolY(-0.05, -0.02) vaut 0.02
    And clampSolY(0.1, -0.02) vaut 0.1
    And clampSolY(0, 0.05) vaut 0
    And clampSolY(-0.06, 0) vaut 0

  Scenario: La hauteur de balancement du pied ne descend jamais sous le sol
    When on évalue swingLift pour t de 0 à 1 à lift 1
    Then swingLift reste superieur ou egal à 0

  Scenario Outline: Le style <style> reste ancré au sol (clamp sol, sommet de pied à -2 cm simulé)
    Given le style "<style>"
    When on applique le style sur 800 temps à amplitude 1 sans déplacement
    Then root.position.y est superieur ou egal à 0 après le clamp sol

    Examples:
      | style      |
      | kizomba    |
      | semba      |
      | kompa      |
      | tarraxinha |
      | suave      |
      | zouk       |
