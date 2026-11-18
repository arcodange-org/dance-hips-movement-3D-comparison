Feature: Déplacements = options non combinables (radio, pas checkbox)
  Spec : docs/spec-phase14-options-pivots.md §1 (demande 2026-11-18)

  Scenario: movementOf applique la priorité d'exclusivité
    Then avec corridinho=true, quarts=true, temps3=true, ida=true, movementOf vaut "corridinho"
    And avec corridinho=false, quarts=true, temps3=true, ida=true, movementOf vaut "quarts"
    And avec corridinho=false, quarts=false, temps3=true, ida=true, movementOf vaut "temps3"
    And avec corridinho=false, quarts=false, temps3=false, ida=true, movementOf vaut "ida"
    And avec corridinho=false, quarts=false, temps3=false, ida=false, movementOf vaut "none"

  Scenario: movementFlags n'active qu'une seule option, et movementOf(movementFlags(m)) == m
    Then movementFlags("quarts") n'active que quarts
    And movementFlags("corridinho") n'active que corridinho
    And movementFlags("temps3") n'active que temps3
    And movementFlags("ida") n'active que ida
    And movementFlags("none") n'active aucune option
    And movementOf(movementFlags("ida")) vaut "ida"
    And movementOf(movementFlags("none")) vaut "none"
