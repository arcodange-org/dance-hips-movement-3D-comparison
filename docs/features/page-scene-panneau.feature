Feature: Page principale : la scène toujours visible, les réglages dans un panneau (#192)
  Spec : docs/spec-page-scene-panneau.md. Onglets, figures offertes, commandes affichées selon la vue, pas
  d'une figure en cinq actions, repère au centre, préréglage « Hanches au ralenti ».
  Fonctions pures de src/page.ts ; l'interface réelle se mesure avec scripts/mesure_page.mjs.

  Scenario: Chaque mode de l'adresse a son onglet
    Then le mode "solo" s'affiche dans l'onglet "seul"
    And le mode "observe" s'affiche dans l'onglet "seul"
    And le mode "compare" s'affiche dans l'onglet "comparer"
    And le mode "pair" s'affiche dans l'onglet "couple"

  Scenario: Un onglet ouvre son mode, et « Jeu » mène au mode jeu dans le style affiché
    Then l'onglet "seul" ouvre le mode "solo"
    And l'onglet "comparer" ouvre le mode "compare"
    And l'onglet "couple" ouvre le mode "pair"
    And l'onglet « Jeu » mène à "?mode=pair&guidage=1&style=semba" quand le style affiché est "semba"

  Scenario: Les sorties ne se proposent qu'en couple
    Then l'onglet "seul" propose les figures "Pas de base, Sur place, Corridinho, Quarts de tour, 3 temps, Ida e volta"
    And l'onglet "comparer" propose les figures "Pas de base, Sur place, Corridinho, Quarts de tour, 3 temps, Ida e volta"
    And l'onglet "couple" propose les figures "Pas de base, Corridinho, Quarts de tour, 3 temps, Ida e volta, Sortie garçon, Sortie fille"

  Scenario: Une figure qu'un style n'offre pas est grisée, avec le nom du style
    Then avec les styles "kompa" la figure "corridinho" est refusée par "Kompa"
    And avec les styles "kizomba, kompa" la figure "quarts" est refusée par "Kompa"
    And avec les styles "kompa" la figure "ida" est offerte
    And avec les styles "kizomba, semba" la figure "corridinho" est offerte

  Scenario Outline: Une commande n'apparaît que là où elle sert (<vue>)
    Given l'onglet "<onglet>", la figure "<figure>" et les styles "<styles>"
    Then les commandes "<affichees>" sont affichées
    And les commandes "<absentes>" ne le sont pas

    Examples:
      | vue                    | onglet   | figure   | styles         | affichees                                                         | absentes                                                                                         |
      | seul, sur place        | seul     | none     | kizomba        | onglets, style, figure, ralenti, largeurPas, reculer, piedsPlantes | styleB, montrer, ligne, proximite, pas, fin, placement, detailPas, sortieCombinee, musiqueCote   |
      | comparer               | comparer | none     | kizomba, semba | styleB, montrer, ligne, musiqueCote, largeurPas                   | ralenti, proximite, placement, plexus, pas, sortieCombinee                                       |
      | en couple, sur place   | couple   | none     | kizomba        | placement, plexus, proximite, montrer, ligne, sortieCombinee      | styleB, ralenti, pas, fin, deuxiemePas, virgula, contraSortie, detailPas, musiqueCote            |
      | sortie garçon          | couple   | sortieG  | kizomba        | pas, fin, placement, contraSortie, plexus, detailPas              | deuxiemePas, virgula, largeurPas, reculer, piedsPlantes                                          |
      | sortie fille           | couple   | sortieF  | kizomba        | pas, deuxiemePas, placement, plexus, detailPas                    | fin, virgula, contraSortie, largeurPas, reculer, piedsPlantes                                    |
      | ida e volta en couple  | couple   | ida      | kizomba        | virgula, placement, reculer                                       | pas, fin, deuxiemePas, detailPas                                                                 |
      | sortie combinée        | couple   | sortieGF | kizomba        | sortieCombinee, reculer                                           | placement, plexus, pas, fin                                                                      |
      | kompa seul             | seul     | ida      | kompa          | reculer, amplitude                                                | largeurPas                                                                                       |
      | sortie choisie, seul   | seul     | sortieG  | kizomba        | largeurPas, reculer                                               | pas, fin, placement, detailPas                                                                   |

  Scenario: Le son montre ce qui se règle
    Given l'onglet "seul", la figure "none" et les styles "kizomba"
    Then avec une piste enregistrée jouée, "source" est affichée et "instruments" ne l'est pas
    And avec une musique de synthèse sans piste, "instruments" est affichée et "source" ne l'est pas
    And "tempoConseille" n'est affichée que si le tempo diffère du tempo conseillé

  Scenario: Chaque commande de l'inventaire a un nom, une place, et son tiroir quand elle sert
    Then l'inventaire compte 40 commandes, aux noms tous différents
    And chaque commande est rangée dans une place connue
    And le tiroir "detail" n'apparaît que pendant une figure en cinq actions
    And les tiroirs "corps, mouvement, reperes, son, miseAuPoint" apparaissent dans toutes les vues

  Scenario: Chaque paramètre du lien partagé a sa commande, ou reste réglé par l'adresse
    Then les paramètres que « Partager » écrit ont chacun une commande, sauf "cam, demo, bare, solid, isolation, miroir, campos, camtgt, angle, zoom"
    And les paramètres "mode, style, styleB, bpm, playing, muscles, placement, sortieVariant, ghost, repere, boussole" ont chacun une commande
    And aucun paramètre n'est réglé par deux commandes

  Scenario: Le pas affiché d'une figure en cinq actions
    Then au battement 0 le pas affiché est 0
    And au battement 0.4 le pas affiché est 1
    And au battement 2 le pas affiché est 2
    And au battement 2.01 le pas affiché est 3
    And au battement 5 le pas affiché est 5
    And au battement 7 le pas affiché est 5

  Scenario: Pas précédent et pas suivant mènent toujours à une pose
    Then depuis le battement 2 le pas suivant est 3 et le précédent 1
    And depuis le battement 2.5 le pas suivant est 3 et le précédent 2
    And depuis le battement 0 le pas suivant est 1 et le précédent 0
    And depuis le battement 5 le pas suivant est 5 et le précédent 4

  Scenario: Hors figure en cinq actions, le compte va de 1 à 8
    Then au battement 0 le compte est 1
    And au battement 7.9 le compte est 8
    And au battement 8 le compte est 1
    And au battement 19.5 le compte est 4

  Scenario: Le nom d'un pas s'affiche sans son numéro
    Then le pas "4 · D du guideur en face" se nomme "D du guideur en face"
    And le pas "5 · Marka" se nomme "Marka"

  Scenario: Repère au centre : masqué, point ou boussole
    Then un repère affiché avec sa boussole se lit "boussole"
    And un repère affiché sans sa boussole se lit "point"
    And un repère masqué avec sa boussole se lit "masque"
    And un repère masqué sans sa boussole se lit "masque"
    And choisir "point" donne repere=1 et boussole=0
    And choisir "boussole" donne repere=1 et boussole=1
    And choisir "masque" donne repere=0 et garde la boussole

  Scenario: « Hanches au ralenti » règle ce que réglait l'ancien mode
    Then le ralenti met le tempo à 32, masque le buste, met la largeur du pas à 0 et affiche le poids

  Scenario: Quitter « Hanches au ralenti » remet les réglages d'avant
    Given le tempo 96, le buste affiché, la largeur du pas 0.5 et le poids masqué
    When on active « Hanches au ralenti » puis on le quitte
    Then le tempo est 96, le buste est affiché, la largeur du pas est 0.5 et le poids est masqué

  Scenario: Page ouverte déjà au ralenti : le quitter affiche le buste et masque le poids
    Given le tempo 40, le buste masqué, la largeur du pas 0 et le poids affiché
    When on quitte « Hanches au ralenti » sans réglages d'avant
    Then le tempo est 40, le buste est affiché, la largeur du pas est 0 et le poids est masqué
