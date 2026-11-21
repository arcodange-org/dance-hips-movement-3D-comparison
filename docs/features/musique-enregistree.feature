Feature: Musique enregistrée calée sur la danse (#142)
  Spec : docs/spec-musique-elevenlabs.md

  Scenario: Le temps 1 de la boucle tombe sur un temps 1 de la danse
    Given une piste enregistrée à 102 bpm dont le temps 1 est à 0.4 s et la boucle fait 96 temps
    Then le temps 0 de la danse se lit à 0.4 s dans le fichier
    And le temps 96 de la danse se lit à 0.4 s dans le fichier
    And le temps 8 de la danse se lit à 5.1059 s dans le fichier
    And le temps -8 de la danse se lit à 52.1647 s dans le fichier
    And la boucle dure 56.4706 s dans le fichier

  Scenario: Le curseur de tempo règle la vitesse de lecture
    Given une piste enregistrée à 102 bpm dont le temps 1 est à 0.4 s et la boucle fait 96 temps
    Then au tempo 102 la piste est jouée à 1 fois sa vitesse
    And au tempo 90 la piste est jouée à 0.8824 fois sa vitesse

  Scenario: Le partage d'URL garde le choix de la synthèse
    When on construit l'URL de partage avec son=true et source=synthese
    Then l'URL contient son=1 et source=synthese
