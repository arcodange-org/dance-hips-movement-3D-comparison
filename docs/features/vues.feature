Feature: Vues lisibles — presets caméra face/dos/diago, caméra diago par défaut en paire
  Spec : docs/spec-phase6-comparatif-appuis-corridinho.md §3 (tâches 13-14)

  @wip
  Scenario: Les presets caméra existent
    Then les presets cam "hip", "fixed", "wide", "diag", "front", "back" sont définis

  @wip
  Scenario: En mode paire la caméra par défaut est diagonale
    Given le mode pair sans preset cam
    Then la caméra par défaut est le preset diag

  @wip
  Scenario: En capture solid=1 le buste est plus opaque
    Given le paramètre solid = 1
    Then torsoOpacity vaut 0.62
