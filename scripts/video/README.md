# La chaîne vidéo (`scripts/video/`)

Elle fabrique la vidéo éducative « le pas de base sur place d'un style à l'autre » (#155,
[spec](../../docs/spec-video-pas-de-base.md)). On la relance quand le moteur ou le texte change.

```bash
node scripts/video/controle.mjs            # le scénario est-il conforme ? (structure, faits, durée)
node scripts/video/generer_video.mjs       # tout : voix, plans, habillage, montage → essais/video/pas-de-base.mp4
node scripts/video/generer_video.mjs --besoins            # durée de musique nécessaire par style
node scripts/video/generer_video.mjs --chapitres semba    # ne refait que ce chapitre, sans réassembler le film (relancer sans l'option)
node scripts/video/generer_video.mjs --refaire plans      # ignore un cache (voix, plans, habillage, montage, tout)
node scripts/video/musique.mjs             # état des musiques
```

Il faut : `ffmpeg`, Chrome pour Playwright (`CHROME_PATH` si Playwright ne le trouve pas), et Phonon dans
l'ollama local (`ollama pull` du modèle `phonon:40m-fr` ; voix : `ollama show phonon:40m-fr`).

## Qui fait quoi

| Fichier | Rôle |
|---|---|
| `narration.json` | **Le texte du film** : titres, phrases, voix, faits cités, cartouches, générique. |
| `scenario.mjs` | Ce qu'on voit : ordre, voix, cadrages de chaque plan, habillage de chaque chapitre. |
| `controle.mjs` | Vérifie `narration.json` (aussi dans `npm test`). |
| `voix.mjs` | Dit chaque phrase avec Phonon, en local ; relève sa durée. |
| `musique.mjs` | Les extraits de musique (`pistes/`) ; ne génère que sur `--generer`. |
| `calendrier.mjs` | Pur : place les phrases, donne la durée des chapitres et les coupes. |
| `capturer.mjs` | Filme l'application image par image (`film=1`). |
| `habillage.mjs` | Rend titres, cartouches, sous-titres et générique en images. |
| `monter.mjs` | Assemble image, voix et musique ; niveau final −16 LUFS. |
| `durees.json` | Durées mesurées des phrases, écrites par la génération (le test s'en sert). |

Tout ce qui est lourd va dans `essais/video/` (ignoré par git) : voix, plans, images, vidéo.

## Écrire `narration.json`

**Règle première : chaque phrase ne dit que ce que porte la fiche de faits**
(`docs/video/faits-pas-de-base.md`) et cite les identifiants des faits sur lesquels elle s'appuie
(`"faits": ["F012", "F047"]`). Quand la fiche dit qu'une source est faible, qu'un point est discuté ou
que le moteur s'écarte des sources, la phrase le dit aussi, ou n'affirme pas.

```jsonc
{
  "surTitre": "…",              // petite ligne au-dessus du titre
  "titre": "…",                 // titre du film
  "sousTitre": "…",
  "piedTitre": "…",             // optionnel, petite ligne en bas de la carte de titre
  "ordre": ["semba", "kompa", "kizomba", "tarraxinha", "suave", "zouk"],   // ordre des six chapitres de style
  "chapitres": {
    "ouverture":   { "phrases": [ … ] },
    "<style>":     { "cartouche": { "lieu": "…", "epoque": "…", "tempo": "…", "faits": ["F…"] }, "phrases": [ … ] },
    "comparaison": { "phrases": [ … ] },      // au moins deux phrases avec "accent"
    "limites":     { "titre": "…", "phrases": [ … ] },   // au moins trois phrases avec "point"
    "final":       { "phrases": [ … ] }
  },
  "generique": { "titre": "…", "accroche": "…", "blocs": [ { "titre": "…", "lignes": ["…", { "texte": "…", "detail": "…" }] } ], "fin": "…" }
}
```

Une phrase :

```jsonc
{
  "voix": "guide",              // guide | histoire | geste (rôles de scenario.mjs, une voix Phonon par rôle)
  "texte": "…",                 // le sous-titre, orthographe normale, 200 caractères au plus
  "dit": "…",                   // optionnel : ce que la voix prononce, si différent (nombres en toutes lettres)
  "faits": ["F012"],            // au moins un, sauf "lien": true (phrase de liaison, 15 % au plus)
  "repere": "…",                // optionnel : mot-clé affiché pendant la phrase (44 caractères au plus)
  "accent": ["semba", "kompa"], // comparaison seulement : les styles dont on parle restent éclairés
  "voile": false,               // avec "accent" : cadres seuls, les autres styles restent éclairés (on compare les six)
  "plan": "grille",             // comparaison : la grille des bassins commence sur cette phrase ; final : "hanches", gros plan
  "point": "…",                 // limites seulement : la ligne ajoutée à la liste à l'écran (90 caractères au plus)
  "pause": 0.6                  // optionnel : silence avant la phrase, en secondes
}
```

- **Les voix** : `guide` conduit le film (ouverture, comparaison, limites, final) ; `histoire` raconte d'où
  vient un style et ce qui l'a influencé ; `geste` décrit ce que fait le corps.
- **Ce qu'on voit pendant un chapitre de style** : un plan par phrase. Les voix `histoire` et `guide` se
  disent sur le corps entier, de face. La première phrase de la voix `geste` passe sur le bassin en gros
  plan, fixe et de face, avec son trajet vu de dessus (largeur et rebond mesurés pendant la capture) ; les
  phrases `geste` suivantes sur le profil, où se lit le buste. Sur place, les pieds restent au sol.
- **La comparaison** montre une rangée de six corps entiers au même tempo, puis, à partir de la phrase
  marquée `"plan": "grille"`, six bassins de près avec leurs six trajets à la même échelle. `"titre"` du
  chapitre s'affiche avant la première phrase (de même pour le final).
- **Le final** montre le couple en danse automatique, puis le générique. Le couple est d'abord en pied ; sur
  la phrase marquée `"plan": "hanches"`, la caméra s'approche des deux bassins, de trois quarts, puis recule
  avant le générique. Ensuite elle va lentement du trois quarts au profil puis à l'autre trois quarts : de
  profil, l'un ne cache pas l'autre ; de trois quarts, le balancement des hanches se lit. Le ginga du couple
  y est celui de l'application, sans réglage forcé.
- **Les sous-titres** sont découpés en cartons de deux lignes au plus, aux fins de phrase : une phrase de
  `texte` peut donc tenir en deux ou trois cartons, sans rien changer à la voix.
- **La voix lit mal** les sigles et les chiffres : écrire « dit » en toutes lettres (« cent vingt battements
  par minute »). `scenario.mjs` remplace déjà semba, tarraxinha, ginga par leur écriture phonétique.
- **Durée** : la voix `guide` dit environ 15 caractères par seconde, les deux autres 19. Un chapitre de style
  vise 24 à 40 secondes, le film 4 min 30 à 6 min 30 (le générique, qui cite les 157 sources, dure
  un peu plus d'une minute). `controle.mjs` donne l'estimation.
- **Le générique** : `blocs` porte les attributions (BodyParts3D CC BY-SA 2.1 Japan © DBCLS ; « Voice: Phonon
  by Gradium — gradium.ai », CC BY-NC 4.0 ; musique Eleven Music, ElevenLabs), les outils et les modèles
  d'IA. **Les sources ne s'y écrivent pas** : elles sont ajoutées automatiquement depuis la section 7 de la
  fiche de faits.

## Musique

Chaque extrait coûte des crédits ElevenLabs : `musique.mjs --generer` ne se lance qu'avec l'accord du
propriétaire, la clé dans l'environnement (`node --env-file=<fichier>`), jamais écrite. Un style sans extrait
est filmé à son tempo prévu, en silence ; le rapport le signale.

**Les fichiers son ne sont pas dans le dépôt.** `pistes/pistes.json` garde la provenance de chaque extrait
(plan de composition, modèle, date, tempo mesuré, partie pleine) ; les `.mp3` sont ignorés par git et restent
sur la machine qui les a générés (`scripts/video/pistes/`, ou le dossier donné par `VIDEO_PISTES`). Raison :
les conditions d'Eleven Music (version du 9 octobre 2026, offre Starter) interdisent de mettre une collection
de morceaux à la disposition de tiers, payante ou non (« Music Library », § 4.2 et 4.8(f)) ; les garder pour
son propre usage reste permis. `musique.mjs --mesurer` remesure les extraits présents, sans rien racheter.
