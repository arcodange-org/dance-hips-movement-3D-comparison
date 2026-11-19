Feature: Son synthétisé synchronisé avec la danse (#44)
  Spec : docs/spec-son-synthese.md — grilles : docs/musique/

  Scenario: Kompa — grosse caisse sur 1 et 3, tanbou sur 2 et 4
    Given la musique "kompa"
    Then la piste "KICK" frappe aux pas 0, 8 de la grille 1
    And la piste "TANBOU" frappe aux pas 4, 12 de la grille 1

  Scenario: Zouk brésilien — « boom-chick-chick » puis variante tresillo
    Given la musique "zouk"
    Then la piste "KICK" frappe aux pas 0 de la grille 1
    And la piste "RIM" frappe aux pas 8, 12 de la grille 1
    And la piste "RIM" frappe aux pas 6, 12 de la grille 3

  Scenario: Semba en 2/4 — ngoma grave appuyée sur chaque premier temps
    Given la musique "semba"
    Then la piste "NGOMA_L" frappe aux pas 0, 4, 8, 12 de la grille 1
    And la piste "NGOMA_L" est accentuée aux pas 0, 8 de la grille 1

  Scenario Outline: Deux fenêtres contiguës ne dupliquent ni ne perdent aucune note (<style>)
    Given la musique "<style>"
    Then les fenêtres [0, 5.3) et [5.3, 16) donnent les mêmes notes que [0, 16)

    Examples:
      | style      |
      | kizomba    |
      | semba      |
      | kompa      |
      | tarraxinha |
      | suave      |
      | zouk       |

  Scenario: L'horloge audio donne le temps de la danse
    Given un transport audio parti du temps 2 à 120 bpm
    Then 1.5 s plus tard le temps de la danse vaut 5
    And après un passage à 60 bpm à 1 s, 2 s plus tard le temps de la danse vaut 6

  Scenario: Le partage d'URL garde le son et la musique choisie
    When on construit l'URL de partage avec son=true et musique=B
    Then l'URL contient son=1 et musique=B
