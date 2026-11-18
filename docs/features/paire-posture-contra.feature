Feature: Phase 15 — contacts de la paire (hanches/genoux), posture par style, contraposition ida e volta
  Spec : docs/spec-phase15-paire.md ; sources : docs/posture-contraposition.md (verbatim EN/FR)

  Scenario: En paire, les 4 points de contact frontaux (poitrine, bassin, 2 genoux) se touchent
    Then en paire (PAIR_DZ) les points de contact frontaux (z=0.13, 0.12, 0.10) sont à moins de 0.09 m

  Scenario: Chaque style a une posture finie (lean, knee) dans les bornes
    Then les 6 styles ont une posture finie dans les bornes

  Scenario: Genoux plus fléchis en tarraxinha/kizomba qu'en zouk ; zouk en cambré (lean < 0)
    Then tarraxinha.knee > kizomba.knee > zouk.knee et zouk.lean < 0

  Scenario: Pendant un pas d'ida e volta, le haut et le bas du corps sont en opposition (contraposition)
    Given on évalue idaContra sur 8 temps
    Then pendant chaque pas upperYaw et lowerYaw sont de signes opposés
    And entre les pas upperYaw et lowerYaw retombent à 0
