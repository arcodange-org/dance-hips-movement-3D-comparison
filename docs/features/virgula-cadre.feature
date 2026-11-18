Feature: Vírgula — le pied fait l'angle sur les quarts de tour ; cadre (avant-bras G vers le haut)
  Spec : docs/spec-phase11-virgula-vue.md §1-2 (demande 2026-11-18) ; sources : docs/virgula.md

  Scenario: Pendant un quart de tour le lacet du pied rejoint celui du corps
    Given on évalue virgulaFootYawDelta pour foot=0.3 et corps=1.2
    Then virgulaFootYawDelta(foot=0.3, corps=1.2) vaut 0.9
    And après correction le lacet du pied rejoint celui du corps modulo 2π

  Scenario: Le delta vírgula est wrappé dans ]-π, π]
    Given on évalue virgulaFootYawDelta pour foot=3.1 et corps=-3.1
    Then virgulaFootYawDelta(foot=3.1, corps=-3.1) vaut 0.0832
    And après correction le lacet du pied rejoint celui du corps modulo 2π

  Scenario: Le cadre danseur a l'avant-bras gauche vers le haut, paume vers la droite
    Then le cadre danseur a l'avant-bras gauche vers le haut et la paume vers la droite
