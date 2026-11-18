Feature: Repères directionnels — 4 directions + 4 « diago » ; le buste fait face à la direction ; position relative à la ligne de danse
  Spec : docs/spec-phase9-partage-boussole.md §3 (demande 2026-11-18 : 4 directions + les diago, le
  buste/épaules font face à la direction, repères pour évaluer le déplacement / ligne de danse)
  Axes monde : E = +x = ligne de danse, W = -x, N = -z, S = +z (face caméra par défaut).

  Scenario: Le buste fait face à la direction — 8 secteurs de 45°
    Then le danseur à ry = 0 fait face à "S"
    And le danseur à ry = 1.5707963 fait face à "E"
    And le danseur à ry = 0.7853982 fait face à "SE" (diago)
    And le danseur à ry = -0.7853982 fait face à "SW" (diago)
    And le danseur à ry = 3.1415927 fait face à "N"

  Scenario: Position relative au repère fixe et à la ligne de danse (axe x)
    Then relToLineOfDance(x=0.12, z=-0.03) donne along=0.12, across=-0.03

  Scenario: Le cadre de la suiveuse en paire est distinct (coude G levé, coude D baissé)
    Then le cadre de la suiveuse a le coude gauche levé et le coude droit baissé
