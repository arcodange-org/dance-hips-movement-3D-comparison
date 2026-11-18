Feature: Appui au sol en sur place — pieds plantés, petit pivot sur la plante (ball of the foot)
  Spec : docs/spec-phase6-comparatif-appuis-corridinho.md §4 (tâche 15)
  Sources : angolatravelguide § Semba basics (« step in place », « bounce from the knees ») ;
  cours-kizomba.com (suave : talon levé = pivot sur la plante) ; Wikipédia FR Kizomba
  (« le déplacement est du bas vers le haut »)

  Scenario: À travel 0 avec plant activé, l'IK plante les pieds (blend complet)
    Given travel = 0 et plant = true
    Then plantBlend vaut 1

  Scenario: plant désactivé restaure l'ancien comportement glissé à travel 0
    Given travel = 0 et plant = false
    Then plantBlend vaut 0

  Scenario: Le blend suit le curseur Déplacement quand travel > 0
    Given travel = 0.1 et plant = true
    Then plantBlend vaut 0.5

  Scenario: Le pivot sur la plante reste un petit angle (semi-pointe) pour tous les styles
    When on applique chaque style sur 800 temps à amplitude 1
    Then extraL et extraR restent dans [-0.05, 0.35] rad
