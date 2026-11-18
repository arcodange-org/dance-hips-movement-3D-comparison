Feature: Vues lisibles — presets caméra face/dos/diago, caméra diago par défaut en paire, solid=1
  Spec : docs/spec-phase6-comparatif-appuis-corridinho.md §3 (tâches 13-14)

  Scenario: Les presets caméra sont définis
    Then les presets cam "default", "hip", "fixed", "wide", "diag", "front", "back" sont définis

  Scenario: En mode paire la caméra par défaut est diagonale (la sortie, axe x, reste visible)
    Given le mode pair sans preset cam
    Then la caméra par défaut est le preset diag

  Scenario: En capture solid=1 le buste est plus opaque (on lit des corps, pas des squelettes)
    Given le paramètre solid = 1
    Then torsoOpacity vaut 0.62
