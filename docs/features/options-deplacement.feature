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

  Scenario: Phase 17 — les sorties sont des options exclusives comme les autres déplacements
    Then movementFlags("sortieG") n'active que sortieG
    And movementFlags("sortieF") n'active que sortieF
    And movementFlags("sortieGF") n'active que sortieGF
    And movementOf(movementFlags("sortieG")) vaut "sortieG"
    And movementOf(movementFlags("sortieF")) vaut "sortieF"
    And movementOf(movementFlags("sortieGF")) vaut "sortieGF"

  Scenario: Sortie garçon — seul le guideur sort (cycle 8), le suiveur reste sur la ligne
    When on évalue sortieActive pour le côté "leader" et le mouvement "sortieG" sur 16 temps
    Then sortieActive reste dans [0, 1]
    And sortieActive est pleine (1) entre les temps 1 et 3
    And sortieActive est nulle à partir du temps 5 du cycle de 8
    When on évalue sortieActive pour le côté "follower" et le mouvement "sortieG" sur 16 temps
    Then sortieActive vaut 0 pour l'autre danseur

  Scenario: Sortie fille — seul le suiveur sort (cycle 8)
    When on évalue sortieActive pour le côté "follower" et le mouvement "sortieF" sur 16 temps
    Then sortieActive reste dans [0, 1]
    And sortieActive est pleine (1) entre les temps 1 et 3
    When on évalue sortieActive pour le côté "leader" et le mouvement "sortieF" sur 16 temps
    Then sortieActive vaut 0 pour l'autre danseur

  Scenario: Sortie combinée — enchaînement G (temps 0–7) puis F (8–15) sur un cycle de 16
    When on évalue sortieActive pour le côté "leader" et le mouvement "sortieGF" sur 32 temps
    Then sortieActive du combiné vaut 0 hors de la fenêtre de ce côté
    And sortieActive du combiné est périodique de 16 temps
    When on évalue sortieActive pour le côté "follower" et le mouvement "sortieGF" sur 32 temps
    Then sortieActive du combiné vaut 0 hors de la fenêtre de ce côté
    And sortieActive du combiné est périodique de 16 temps
