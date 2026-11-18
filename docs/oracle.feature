Feature: Phase 18 — oracle de poses discrètes par demi-pas (docs/spec-phase18-oracle.md)
  Principes de body dynamic testés : continuité aux raccords (pas de saut), accord avec le
  moteur (quartTurnStep / idaEVoltaStep / idaContra aux frontières), dualité danseur/partenaire
  (reverse = miroir z + lacets opposés + échange G/D), dualité haut/bas (contraposition),
  orientation des jambes (angle droit au pivot).

  Scenario: Quarts de tour — continuité end(k) = start(k+1) sur le cycle de 16 temps
    Given le mouvement "quarts" sur 16 temps
    When on calcule les poses oracle des demi-pas k de 0 à 7
    Then end(k) est égal à start(k+1) pour tout k
    And la pose au temps 16 est égale à la pose au temps 0 (raccord de cycle)

  Scenario: Quarts de tour — les poses correspondent à quartTurnStep aux frontières des demi-pas
    Given le mouvement "quarts" sur 16 temps
    When on calcule les poses oracle des demi-pas k de 0 à 7
    Then chaque pose oracle au temps 2k correspond à quartTurnStep(2k) (pieds, upperYaw, lowerYaw)

  Scenario: Quarts de tour — reverse est le miroir (z opposé, lacets opposés, rôles G/D échangés)
    Given le mouvement "quarts" sur 16 temps
    When on calcule les poses oracle des demi-pas k de 0 à 7 en reverse
    Then chaque pose reverse est le miroir de la pose normale (footL<->footR, z et yaw opposés, upperYaw/lowerYaw opposés)

  Scenario: Quarts de tour — le pied qui pivote fait un angle droit avec l'autre pied
    Given le mouvement "quarts" sur 16 temps
    When on calcule les poses oracle aux temps 1, 5, 9, 13 (milieu du demi-pas 0 de chaque quart)
    Then l'écart de lacet entre le pied pivotant et l'autre pied vaut pi/2 à chaque quart

  Scenario: Ida e volta — continuité et raccord de cycle sur 8 temps
    Given le mouvement "ida" sur 8 temps
    When on calcule les poses oracle des demi-pas k de 0 à 3
    Then end(k) est égal à start(k+1) pour tout k
    And la pose au temps 8 est égale à la pose au temps 0 (raccord de cycle)

  Scenario: Ida e volta — contraposition haut/bas en milieu de pas (signes opposés)
    Given le mouvement "ida" sur 8 temps
    When on calcule les poses oracle aux temps 1, 3, 5, 7 (milieux de pas)
    Then upperYaw et lowerYaw sont de signes strictement opposés à chaque milieu de pas
    And upperYaw et lowerYaw sont nuls aux frontières de pas (temps pairs)
