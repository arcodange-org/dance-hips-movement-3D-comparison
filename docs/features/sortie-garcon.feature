Feature: Sortie garçon validée, cinq actions et quatre transferts
  La partenaire recule du droit au premier pas ; la progression finale est conservée.
  La sortie fille et le combiné restent indépendants de cette correction.

  Scenario: Croisé de rentrée et marka gauche disponible
    Given la sortie garçon est évaluée à la fin des cinq actions
    Then les appuis du leader sont D G D G D D et ceux de la partenaire sont G D G D G G
    And le gauche du leader croise devant le droit puis le marka reste déchargé
