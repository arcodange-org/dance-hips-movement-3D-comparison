Feature: Vitrine — danse automatique en musique, lien direct (#150)
  Spec : docs/spec-vitrine-danse-auto.md

  Scenario: Le lien direct ouvre la danse automatique, muscles affichés, au tempo de la piste
    When on ouvre l'adresse "?vitrine=1"
    Then la vue s'ouvre en danse automatique
    And les muscles sont affichés et le tronc n'a plus de bloc gris
    And le tempo d'ouverture du style "kizomba" est celui de sa piste enregistrée

  Scenario: Le mode jeu en écoute montre aussi les muscles, sans bloc gris sur le tronc
    When on ouvre l'adresse "?mode=pair&guidage=1"
    Then la vue s'ouvre en écoute
    And les muscles sont affichés et le tronc n'a plus de bloc gris
    And le tempo d'ouverture du style "kizomba" est le tempo d'écoute

  Scenario: Sans les muscles, le buste stylisé revient
    When on ouvre l'adresse "?mode=pair&guidage=1&muscles=0"
    Then les muscles sont masqués et le tronc garde ses blocs gris
    And le buste est translucide
    When on ouvre l'adresse "?vitrine=1&muscles=0"
    Then les muscles sont masqués et le tronc garde ses blocs gris
    And le buste est lisible

  Scenario: Un tempo dans l'adresse l'emporte sur celui de la piste
    When on ouvre l'adresse "?vitrine=1&bpm=90"
    Then le tempo d'ouverture du style "kizomba" est 90 bpm

  Scenario: Le lien de partage rouvre la même danse
    Then le lien de partage du style "kizomba" avec la graine 4242 est "https://exemple.test/app/?vitrine=1&style=kizomba&graine=4242"
