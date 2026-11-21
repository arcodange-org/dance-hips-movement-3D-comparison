# Spec — vitrine : danse automatique en musique, lien direct (#150)

Fil d'Ariane : [docs](./) › **spec vitrine** · dépend du [mode jeu (#140)](spec-jeu-file-auto.md) et de la
[musique enregistrée (#142)](spec-musique-elevenlabs.md)

## Demande du propriétaire (21 novembre 2026)

> Utiliser la musique d'elevenlab et son BPM en mode auto , afficher les muscles (le buste aussi) pour
> plus d'esthetisme.
> Permettre de partager le lien direct vers ce mode ci pour un effet wow (Arcodange pourra intégrer ceci
> sur un autre siteweb. Hors scope mais on utilisera certainement les mascottes Rémi et Corinne)

## Objectif

La danse automatique du mode jeu devient une **vitrine** : le couple danse seul sur la piste
enregistrée du style, à son tempo, avec les muscles et un buste lisible. Une adresse courte ouvre
directement cette vue, pour la partager ou l'intégrer dans une autre page.

## Lien direct

```
https://arcodange-org.github.io/dance-hips-movement-3D-comparison/?vitrine=1
```

| Paramètre | Effet | Défaut |
|---|---|---|
| `vitrine=1` | ouvre la vitrine : danse automatique, muscles, buste lisible, vue libre qui tourne lentement, interface réduite | — |
| `style=` | style dansé | `kizomba` |
| `graine=` | graine du tirage : même graine, même danse | tirée à l'ouverture |
| `bpm=` | tempo imposé | tempo de la piste du style, à défaut tempo conseillé du style |
| `vue=guideur` | point de vue du guideur au lieu de la vue libre | vue libre |

`?mode=pair&guidage=1&auto=1` reste valable : c'est le mode jeu complet, ouvert en danse automatique.

## Comportement

| Situation | Tempo | Musique | Muscles | Buste | Interface |
|---|---|---|---|---|---|
| Mode jeu, écoute | celui du champ bpm | au choix (bouton « Son ») | `muscles=1` | translucide | complète |
| Mode jeu, danse automatique | **tempo de la piste** du style | piste enregistrée | **affichés** | **lisible** | complète |
| Vitrine (`vitrine=1`) | tempo de la piste | piste enregistrée | affichés | lisible | réduite |

- **Tempo** : en entrant en danse automatique, le tempo prend celui de la piste enregistrée du style
  (`recordingTempo`, 102 bpm pour la kizomba). Un `bpm=` dans l'URL l'emporte. En revenant à l'écoute,
  le tempo d'avant est rétabli. Un style sans piste garde son tempo.
- **Son** : un navigateur ne laisse pas démarrer l'audio sans geste. La vitrine affiche donc un bouton
  « ▶ Lancer la musique » au centre ; un clic démarre la piste, calée sur le temps de la danse
  (l'horloge audio pilote alors la danse). Sans clic, le couple danse en silence au même tempo.
- **Esthétique** : couche des muscles affichée ; buste à l'opacité des captures « corps »
  (`SOLID_TORSO_OPACITY`), pour lire des corps plutôt que des squelettes.
- **Vue** : en vitrine, vue libre qui tourne lentement autour du couple ; la souris reprend la main.
- **Partage** : un bouton « Partager » copie le lien direct de la vitrine avec le style et la graine en
  cours : celui qui l'ouvre voit la même danse. Le bouton existe aussi dans le mode jeu en danse
  automatique.
- **Interface de la vitrine** : le compte, le nom de la figure en cours, « Lancer la musique » ou
  « Couper le son », « Partager », « Prendre la main » (ouvre le mode jeu en écoute). Pas de boutons de
  figures. Les mentions obligatoires restent visibles : BodyParts3D (CC BY-SA 2.1 Japan © DBCLS) et
  « musique générée par IA ».

## Intégration dans une autre page

```html
<iframe src="https://arcodange-org.github.io/dance-hips-movement-3D-comparison/?vitrine=1"
        title="Kizomba en 3D" allow="autoplay" loading="lazy"
        style="width:100%;aspect-ratio:16/9;border:0"></iframe>
```

La vitrine remplit le cadre qu'on lui donne. Le son démarre au premier clic dans le cadre.

## Modules

| Fichier | Rôle | Testé sans navigateur |
|---|---|---|
| `src/vitrine.ts` | Fonctions pures : réglages déduits de l'URL, tempo de la danse automatique, lien de partage | oui |
| `src/main.tsx` | `vitrine=1` ouvre la vue du mode jeu | non |
| `src/components/GuidageApp.tsx` | Applique les réglages, interface réduite, bouton de partage | non |
| `scripts/test_vitrine.mjs`, `docs/features/vitrine.feature` | Tests, dans `npm test` | — |

## Critères d'acceptation

1. `vitrine=1` ouvre la danse automatique, muscles affichés, buste lisible, au tempo de la piste du
   style ; `bpm=` l'emporte ; un style sans piste garde le tempo conseillé du style.
2. Le lien de partage contient `vitrine=1`, le style et la graine, et rien d'autre ; rouvert, il donne
   les mêmes réglages.
3. Mode jeu en écoute : comportement inchangé (tempo, muscles sur demande, buste translucide).
4. Passage écoute → danse automatique → écoute : le tempo d'écoute est rétabli.
5. Sans geste, aucun contexte audio n'est créé ; la danse tourne au tempo de la piste.
6. Les mentions BodyParts3D et « musique générée par IA » sont dans la vitrine.
7. Contrôle navigateur : la vitrine s'ouvre, le bouton lance la piste, le lien copié rouvre la même
   danse.

## Hors périmètre

- Les mascottes Rémi et Corinne à la place des corps anatomiques.
- L'intégration sur le site d'Arcodange (cette spec fournit seulement le lien et le fragment `iframe`).

## Suite (#155, 21 novembre 2026) : le buste sans blocs gris

Le propriétaire, en regardant la vitrine : « Si on affiche les os et muscle du buste il n'y a pas de raison
d'afficher les blocs gris. » Avec la couche de muscles (toujours affichée en danse automatique), les volumes
gris du tronc (colonne, thorax, épaules) sont masqués : on voit les muscles du tronc à leur place. La tête et
les bras restent stylisés, le modèle n'ayant ni leurs os ni leurs muscles (`trunkBlocksVisible`,
`src/muscles.ts`, scénario dans `docs/features/video.feature`). La même règle vaut dans toutes les vues.
