Feature: Curseur Déplacement — 0 = sur place, 100% = ±17 cm (HIP_WIDTH)
  Convention verrouillée : travel * (HIP_WIDTH/2) * tanh(2.2*S2(b)), clamp sol

  Scenario: Sur place à travel 0
    Given travel = 0
    Then l'amplitude latérale max est 0 m

  Scenario: Pleine amplitude à travel 1
    Given travel = 1
    Then l'amplitude latérale max est entre 0.15 et 0.17 m

  Scenario: Amplitude progressive à travel 0.5
    Given travel = 0.5
    Then l'amplitude latérale max est entre 0.07 et 0.09 m
