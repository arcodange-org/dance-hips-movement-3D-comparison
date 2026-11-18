Feature: URL — angle et zoom de vue explicites (angle=, zoom=) en complément de campos/camtgt
  Spec : docs/spec-phase11-virgula-vue.md §3 (demande 2026-11-18)

  Scenario: resolveView sans override retourne le preset inchangé
    Given le preset caméra "diag"
    Then resolveView sans override retourne le preset inchangé

  Scenario: angle= remplace l'azimut, zoom= remplace la distance (élévation du preset gardée)
    Given le preset caméra "diag"
    Then resolveView avec angle=90 remplace l'azimut et garde la distance
    And resolveView avec zoom=2 remplace la distance et garde l'azimut

  Scenario: viewAnglesOf et posFromView sont inverses
    Given viewAnglesOf(pos=3.3,1.5,3.3, tgt=0,0.85,0) donne az=45, el=7.93, dist=4.71
    Then posFromView est l'inverse de viewAnglesOf

  Scenario: L'URL de partage contient angle et zoom cohérents avec la caméra
    Given l'état mode=solo, style=kizomba, bpm=90, travel=0, iso=true, quarts=true, dir=1
    When on construit l'URL de partage avec campos=3.3,1.5,3.3 camtgt=0,0.85,0 et la vue courante
    Then l'URL contient mode=solo et style=kizomba et quarts=1 et campos=3.3,1.5,3.3
    And l'URL a des params angle et zoom cohérents avec la caméra
