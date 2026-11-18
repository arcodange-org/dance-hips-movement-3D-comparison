Feature: Quarts de tour — vrais pivots vírgula (talon G au bout du pied D à 90°, puis pied D parallèle) + dissociation haut/bas
  Spec : docs/spec-phase14-options-pivots.md §2 (demande 2026-11-18) ; sources : docs/virgula.md

  Scenario: 16 temps = 4 quarts de tour, lowerYaw croît de 0 à ~2π, stepSide alterne L, R, L, R
    Given on évalue quartTurnStep sur 16 temps
    Then lowerYaw croît de 0 à ~2π (tour complet) et stepSide alterne L, R, L, R

  Scenario: Pendant le demi-pas 0 le haut du corps suit le pied G (dissociation ~π/4), puis le bas rattrape
    Given on évalue quartTurnStep sur 16 temps
    Then pendant le demi-pas 0 la dissociation upperYaw-lowerYaw atteint ~π/2 en fin de demi-pas
    And pendant le demi-pas 1 lowerYaw rattrape upperYaw (dissociation retombe à 0 en fin de quart)

  Scenario: Le pied G est orienté à 90° vers la gauche (th0+π/2) pendant chaque demi-pas 0
    Given on évalue quartTurnStep sur 16 temps
    Then le pied G a un lacet de th0+π/2 pendant chaque demi-pas 0

  Scenario: Après 4 quarts (tour complet) les pieds retrouvent leur position initiale
    Given on évalue quartTurnStep sur 16 temps
    Then après 4 quarts les pieds retrouvent leur position initiale (tol 0.01)

  Scenario: En reverse (suiveur en paire) les lacets sont opposés et z des pieds est miroir
    Given on évalue quartTurnStep sur 16 temps
    Then en reverse lowerYaw est l'opposé et z des pieds est miroir
