Feature: Sortie garçon/fille — sortir de la ligne de danse puis y revenir (5 temps sur 8)
  Spec : docs/spec-phase6-comparatif-appuis-corridinho.md §5 (ligne de danse) ;
  Source : Wikipédia FR Kizomba — « sortie garçon (5 temps) : l'homme sort de la ligne de
  danse sur la gauche puis revient en face de sa partenaire » ; « sortie fille (5 temps) »

  Scenario: L'enveloppe de sortie dure 5 temps sur un cycle de 8
    When on évalue sortieOffset pour b de 0 à 16 à amplitude 1
    Then l'enveloppe est pleine entre les temps 1 et 3 du cycle
    And l'enveloppe est nulle à partir du temps 5 du cycle
    And l'enveloppe est périodique de 8 temps
    And sortieOffset est borné entre 0 et 0.22 m

  @wip
  Scenario: La sortie est perpendiculaire à la ligne de danse et revient dessus
    Then le déplacement de sortie s'applique sur l'axe x local (perpendiculaire à la ligne)
    And après la sortie le danseur revient sur la ligne (offset = 0 au temps 5+)
