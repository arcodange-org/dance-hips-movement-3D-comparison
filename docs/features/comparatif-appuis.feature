Feature: Comparatif d'appuis — deux styles côte à côte avec jauges G/D par corps
  Spec : docs/spec-phase6-comparatif-appuis-corridinho.md §1 (tâche 10)

  @wip
  Scenario: Chaque corps a sa propre jauge G/D en mode comparaison
    Given le mode compare avec appui activé et les styles kizomba et kompa
    When les deux rigs tournent sur 800 temps
    Then chaque rig produit ses propres stats (charge G/D, genoux, roll bassin)
    And les charges des deux côtés restent dans [0, 100] %
