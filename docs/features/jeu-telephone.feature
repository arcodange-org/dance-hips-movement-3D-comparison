Feature: Jeu et vitrine utilisables sur téléphone (#186)
  Spec : docs/spec-jeu-telephone.md. Les commandes du jeu et de la vitrine ont trois dispositions selon la
  fenêtre ; aucune n'est posée sur le couple ; toutes les figures du clavier se commandent au toucher.
  Fonctions pures de src/jeuHud.ts ; l'interface réelle se mesure avec scripts/mesure_jeu_telephone.mjs.

  Scenario Outline: La disposition suit la taille de la fenêtre (<appareil>)
    Then une fenêtre de <largeur> × <hauteur> donne la disposition "<disposition>"

    Examples:
      | appareil              | largeur | hauteur | disposition |
      | iPhone 14 tenu droit  | 390     | 664     | droit       |
      | iPhone SE tenu droit  | 320     | 568     | droit       |
      | Pixel 7 tenu droit    | 412     | 839     | droit       |
      | iPhone 14 couché      | 750     | 340     | couche      |
      | iPhone SE couché      | 568     | 320     | couche      |
      | Pixel 7 couché        | 863     | 360     | couche      |
      | iPhone couché, Safari avec sa barre d'onglets | 750 | 280 | couche |
      | petit iPhone couché, barre d'onglets          | 667 | 280 | couche |
      | tablette tenue droite | 768     | 1024    | large       |
      | tablette couchée      | 1024    | 768     | large       |
      | ordinateur            | 1280    | 800     | large       |

  Scenario: Téléphone tenu droit, la vue est réduite et placée entre les deux bandes
    Given une scène de 390 × 664 avec des bandes de 110 px en haut, 0 à droite, 142 en bas et 0 à gauche
    Then la vue d'origine est à 72 % de sa taille, centrée en (195, 316)
    And le couple tient dans la place libre

  Scenario: Téléphone couché, la vue garde sa taille et se centre entre les deux colonnes
    Given une scène de 750 × 340 avec des bandes de 0 px en haut, 222 à droite, 0 en bas et 210 à gauche
    Then la vue d'origine est à 100 % de sa taille, centrée en (369, 170)
    And le couple tient dans la place libre

  Scenario: Écran large, la vue remonte au-dessus des rangées de figures
    Given une scène de 1280 × 800 avec des bandes de 0 px en haut, 0 à droite, 124 en bas et 0 à gauche
    Then la vue d'origine est à 98 % de sa taille, centrée en (640, 338)
    And le couple tient dans la place libre

  Scenario: Sans commandes autour de la scène, la vue n'est pas modifiée
    Given une scène de 1280 × 800 avec des bandes de 0 px en haut, 0 à droite, 0 en bas et 0 à gauche
    Then la vue d'origine n'est pas modifiée

  Scenario: La kizomba a toutes ses figures au toucher
    Then le style "kizomba" propose au pavé les figures "ida, quart, sortieG, sortieF, avance, recule, double" et les bascules "virgula, jambe droite, en arrière"
    And un pavé de 10 boutons tient en 5 colonnes sur un téléphone tenu droit

  Scenario: Le kompa n'a que les marches, sans bascule
    Then le style "kompa" propose au pavé les figures "avance, recule, double" et les bascules ""
    And un pavé de 3 boutons tient en 3 colonnes sur un téléphone tenu droit

  Scenario: Les bascules donnent au toucher les variantes de l'ida e volta du clavier
    Then « Ida e volta » touché avec les bascules "" commande "ida", comme les flèches "" maintenues
    And « Ida e volta » touché avec les bascules "jambe droite" commande "idaD", comme les flèches "→" maintenues
    And « Ida e volta » touché avec les bascules "en arrière" commande "idaArr", comme les flèches "↓" maintenues
    And « Ida e volta » touché avec les bascules "jambe droite, en arrière" commande "idaArrD", comme les flèches "→ ↓" maintenues
    And les bascules ne changent pas les autres figures du pavé

  Scenario: Changer de style garde le reste de l'adresse
    Then changer de style depuis "?mode=pair&guidage=1&style=kizomba&graine=7&vue=libre" pour "semba" mène à "?mode=pair&guidage=1&style=semba&graine=7&vue=libre"
    And changer de style depuis "?mode=pair&guidage=1" pour "kompa" mène à "?mode=pair&guidage=1&style=kompa"

  Scenario: Une commande se touche sans viser
    Then une commande fait au moins 44 px de côté
