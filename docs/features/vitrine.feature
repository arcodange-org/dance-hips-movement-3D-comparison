Feature: Vitrine — danse automatique en musique, lien direct (#150)
  Spec : docs/spec-vitrine-danse-auto.md

  Scenario: Le lien direct ouvre la danse automatique, muscles et buste lisibles, au tempo de la piste
    When on ouvre l'adresse "?vitrine=1"
    Then la vue s'ouvre en danse automatique
    And les muscles sont affichés et le buste est lisible
    And le tempo d'ouverture du style "kizomba" est celui de sa piste enregistrée

  Scenario: Le mode jeu en écoute n'est pas modifié
    When on ouvre l'adresse "?mode=pair&guidage=1"
    Then la vue s'ouvre en écoute
    And les muscles sont masqués et le buste est translucide
    And le tempo d'ouverture du style "kizomba" est le tempo d'écoute

  Scenario: Un tempo dans l'adresse l'emporte sur celui de la piste
    When on ouvre l'adresse "?vitrine=1&bpm=90"
    Then le tempo d'ouverture du style "kizomba" est 90 bpm

  Scenario: Le lien de partage rouvre la même danse
    Then le lien de partage du style "kizomba" avec la graine 4242 est "https://exemple.test/app/?vitrine=1&style=kizomba&graine=4242"
