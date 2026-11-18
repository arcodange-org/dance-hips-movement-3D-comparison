Feature: Comparatif d'appuis — charges G/D par corps (mode Comparaison + appui=1)
  Spec : docs/spec-phase6-comparatif-appuis-corridinho.md §1 (tâche 10)

  Scenario: La charge de chaque pied reste dans [0, 1] quel que soit le style (base des jauges G/D)
    When on applique chaque style sur 800 temps à amplitude 1
    Then la charge de chaque pied (load G/D) reste dans [0, 1]
