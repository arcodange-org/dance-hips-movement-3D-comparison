Feature: Ginga visible en danse de couple
  Demande du propriétaire (#157) : « que le "sway" des hanches et le petit effet de "bounce", le ginga en
  fait, soit présent pour montrer que les danseurs se balancent au rythme de la musique »
  (docs/spec-ginga-couple.md).

  Scenario: La phase du ginga suit les transferts d'appui dans chaque figure
    R13 : « le ginga déclenché à chaque alternance droite/gauche, gauche/droite ».
    When on lit la phase du ginga sur les appuis du leader dans chaque figure du mode jeu
    Then la phase ne recule pas et ne saute pas
    And chaque figure fait avancer la phase d'au moins un transfert

  Scenario: Le mode jeu danse avec le ginga, et propose des réglages à élire
    When on lit les réglages du ginga du mode jeu
    Then le réglage par défaut balance les hanches et fait rebondir le bassin
    And les réglages vont du plus discret au plus ample, et "sans" l'éteint
