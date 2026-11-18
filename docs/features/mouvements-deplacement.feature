Feature: Déplacements — quarts de tour (séparés du corridinho), marche avant/arrière + marka « 3 temps », ida e volta, GLB corrigé
  Spec : docs/spec-phase8-deplacements.md (demandes 2026-11-18)

  Scenario: 4 quarts de tour sur 16 temps font un tour complet (2π), en marche arrière le suiveur inverse le sens
    Given la séquence quarts de tour sur 16 temps
    When on évalue quartsPath de 0 à 16
    Then ry croît de 0 à 2π (tour complet)
    And la trajectoire reste finie
    When on inverse la trajectoire du corridinho (reversePath)
    Then z est miroir et ry opposé, et le cercle passe encore par le repère (0, 0)

  Scenario: Marche avant/arrière — dir=-1 inverse le déplacement le long de la ligne de danse
    When on évalue travelOffset avec travel = 0.8, dir = 1 puis dir = -1 sur 16 temps
    Then travelOffset(dir=-1) est l'opposé de travelOffset(dir=1) à chaque temps

  Scenario: Marke « 3 temps » — un pas tous les 3 temps
    Then swingBeat avec temps3 a une période de 3 temps
    And swingBeat sans temps3 a une période de 1 temps

  Scenario: Ida e volta — G avant/arrière puis D avant/arrière sur un cycle de 8 temps
    When on évalue idaEVoltaStep sur 8 temps
    Then la séquence est L avant, L arrière, R avant, R arrière

  Scenario: Le GLB place la patella au genou et la fibula près du tibia (bug os flottants corrigé)
    Then le GLB place patella et fibula au niveau du genou
