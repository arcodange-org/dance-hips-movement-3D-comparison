Feature: Corridinho — cercle au sol au repère fixe, seulement après pivot droit puis gauche
  Spec : docs/spec-phase6-comparatif-appuis-corridinho.md §2 (tâche 11)
  Source : Wikipédia FR Kizomba — « corridinho : succession de pas qui forme un cercle au
  sol » ; « 1/4 de tour, en 3 temps avec un marqua »

  Scenario: Séquence pivot droit, pivot gauche, puis cercle autour du repère fixe
    Given la séquence corridinho sur 16 temps
    When on évalue la trajectoire de root
    Then les temps 0 à 3 font un quart de tour à droite
    And les temps 4 à 7 font un quart de tour à gauche
    And les temps 8 à 15 décrivent un cercle de rayon entre 0.25 et 0.35 m autour du point (0.3, 0), en passant par le repère fixe
    And la trajectoire reste finie et le rayon est borné
