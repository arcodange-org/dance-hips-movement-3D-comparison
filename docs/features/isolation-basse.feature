Feature: Isolation du bas du corps — haut du tronc stable et vertical, genoux qui fléchissent, cadre de bras de danseur
  Spec : docs/spec-phase7-isolation-basse.md
  Sources : docs/ginga-angolana.md §2 — Eddy Vents « the movements hips down are the dominant
  ones [...], not the upper body movements » (saidadance.com) ; « Keep the shoulder line level
  and do not pitch or sway the entire body » (SOS Dance Footwork Manual) ; « the upper body
  remains stable and calm in the connection » (udansa) ; « the upper body must remain straight,
  while the hips remain mobile » (SalsaNueva)

  Scenario: En iso=1 le thorax reste vertical pendant que le bassin roule et que les genoux fléchissent (kizomba sur place)
    Given le style "kizomba"
    When on applique le style puis lockUpperTrunk avec iso = true sur 16 temps à amplitude 1
    Then le roll résiduel du thorax reste inférieur à 0.01 rad
    And le pelvis roule d'au moins 0.05 rad
    And les genoux restent fléchis d'au moins 0.1 rad
    And la stabilité du buste vaut au moins 0.99

  Scenario: En iso=0 le buste n'est pas verrouillé (comportement libre)
    Given le style "kizomba"
    When on applique le style puis lockUpperTrunk avec iso = false sur 16 temps à amplitude 1
    Then le roll résiduel du thorax n'est pas corrigé (supérieur au cas iso=1)

  Scenario: Le cadre de bras de danseur est orienté comme demandé
    Then le cadre de bras a les bras vers l'avant et les coudes pliés
    And l'avant-bras gauche est vers le haut
    And l'avant-bras droit est vers la gauche, paume vers le buste
