Feature: Filmer l'application image par image (#155)
  Spec : docs/spec-video-pas-de-base.md

  Scenario: Sans film=1, l'application s'anime seule comme avant
    Then l'adresse "?mode=solo&style=kizomba&bare=1" n'active pas le film image par image
    And l'adresse "?vitrine=1&film=0" n'active pas le film image par image
    And l'adresse "?mode=solo&style=kizomba&bare=1&film=1" active le film image par image

  Scenario: Chaque image tombe à un instant et à un temps de danse connus
    Given on filme à 25 images par seconde une danse à 120 bpm
    Then l'image 0 est à 0 s et au temps 0 de la danse
    And l'image 50 est à 2 s et au temps 4 de la danse
    And l'image 75 est à 3 s et au temps 6 de la danse

  Scenario: La caméra de film suit la convention des vues de l'application
    Then la caméra de film à l'azimut 0°, à 3 m d'une cible à hauteur 0.85 m, est en (0, 0.85, 3)
    And la caméra de film à l'azimut 90°, à 3 m d'une cible à hauteur 0.85 m, est en (3, 0.85, 0)

  Scenario: Le décalage d'objectif fait glisser le sujet sans déplacer la caméra
    Then un décalage d'objectif de 0.2 sur une image de 1920 pixels de large vaut 384 pixels
