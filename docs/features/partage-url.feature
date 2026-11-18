Feature: Partage de la vue par URL — paramètres d'état + angle caméra (campos/camtgt)
  Spec : docs/spec-phase9-partage-boussole.md §1 (demande 2026-11-18)

  Scenario: L'URL de partage contient tous les paramètres d'état et la caméra
    Given l'état mode=pair, style=kizomba, bpm=90, travel=0.6, iso=true, quarts=true, dir=-1
    When on construit l'URL de partage avec la caméra campos=3.3,1.5,3.3 et camtgt=0,0.85,0
    Then l'URL contient mode=pair et style=kizomba et bpm=90 et quarts=1 et dir=-1 et campos=3.3,1.5,3.3 et camtgt=0,0.85,0

  Scenario: parseVec3 valide les vecteurs 3D de la caméra
    Then parseVec3("1,2,3") vaut [1, 2, 3]
    And parseVec3("1,2") vaut null
    And parseVec3("a,b,c") vaut null
