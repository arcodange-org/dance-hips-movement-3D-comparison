Feature: Styles sur place — valeurs finies, clamp sol, appui borné, pivot plante limité
  Spec : docs/spec-phase5-repere-fixe-appui.md §B ; sources : docs/styles-de-danse.md
  Convention : clamp sol root.position.y >= 0 ; à travel=0 les pieds sont plantés (tâche 15)

  Scenario Outline: Le style <style> reste fini et ancré au sol sur place
    Given le style "<style>"
    When on applique le style sur 800 temps à amplitude 1 sans déplacement
    Then toutes les positions et rotations sont finies
    And root.position.y est superieur ou egal à 0 après le clamp sol
    And la charge du pied droit (support) reste dans [-1, 1]
    And le pivot sur la plante (extra) reste dans [-0.05, 0.35] rad

    Examples:
      | style      |
      | kizomba    |
      | semba      |
      | kompa      |
      | tarraxinha |
      | suave      |
      | zouk       |
