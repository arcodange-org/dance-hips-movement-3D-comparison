# Spec — musique enregistrée générée par ElevenLabs (#142)

Fil d'Ariane : [docs](./) › **spec musique ElevenLabs** · avant : [son synthétisé (#44)](spec-son-synthese.md) ·
provenance des pistes : [docs/musique/enregistrements.md](musique/enregistrements.md)

## Demande du propriétaire

> Remplaçons les musiques de synthèse par de la musique elevenlabs (récupère les moyens
> d'authentification dans le vault)

Exemple de prompt fourni :

```
Authentic Angolan Kizomba and Semba fusion instrumental, 102 BPM, strictly quantized steady tempo, prominent syncopated kick drum, crisp rimshot snare, dikanza scraper percussion, deep warm round bassline, clean melodic acoustic guitar riffs, subtle atmospheric synth pad, clear 1-2-3 rhythmic pulse, no tempo changes, no breakdown, dry and punchy studio mix, high transient clarity, instrumental only, no vocals
```

## Objectif

Le bouton « Son » joue, pour chaque style, une **boucle enregistrée** générée avec Eleven Music
(ElevenLabs). La boucle reste calée sur le temps de la danse : l'horloge audio pilote la danse,
comme pour la synthèse (R21, les temps de la musique tombent sur les transferts d'appui).

La synthèse (#44) n'est pas supprimée par ce chantier : elle sert de **repli** quand une piste
manque ou ne se charge pas, et reste proposée comme source au choix. Son retrait est une décision
du propriétaire (voir « Points ouverts »).

## État d'avancement

| Élément | État |
|---|---|
| Lecteur de boucle synchronisé, repli, interface, tests | dans ce chantier |
| Script de génération et d'analyse de tempo | dans ce chantier |
| Pistes générées | **en attente** : la clé ElevenLabs n'est pas disponible pour l'agent |

Tant qu'aucune piste n'est publiée, le registre des pistes est vide et l'app se comporte
exactement comme avant (synthèse).

## Modules

| Fichier | Rôle | Testé sans navigateur |
|---|---|---|
| `public/musique/<style>.mp3` | La piste telle que rendue par l'API, sans réencodage | présence et cohérence avec le registre |
| `src/music/recordings.data.ts` | Registre **généré** par le script : une entrée par piste | oui |
| `src/music/recordings.ts` | Type `Recording`, accès `recordingOf(style)`, validation | oui |
| `src/music/loop.ts` | Fonctions pures : position dans la boucle pour un temps de la danse, fondu de raccord, moteur de boucle sur un port de sortie abstrait | oui (sortie factice) |
| `src/music/loopOutput.ts` | Port Web Audio : chargement, décodage, source en boucle, vitesse, fondus | non (navigateur) |
| `src/music/useMusic.ts` | Choix de la source (enregistrement ou synthèse), chargement, repli | non |
| `src/components/SoundControls.tsx` | Source, provenance, tempo de la piste | non |
| `scripts/musique_prompts.mjs` | Prompts versionnés, un par style | oui |
| `scripts/tempo.mjs` | Analyse pure : tempo, instant du premier temps, dérive | oui (signal de synthèse) |
| `scripts/generer_musique.mjs` | Appel de l'API, analyse, mise à jour du registre | non (réseau) |
| `scripts/test_musique_enregistree.mjs` | Tests de tout ce qui précède, dans `npm test` | — |

## Registre d'une piste

```ts
interface Recording {
  style: string;        // kizomba, semba, kompa, tarraxinha, suave, zouk
  file: string;         // nom dans public/musique/
  bpm: number;          // tempo MESURÉ sur le fichier (pas celui du prompt)
  firstBeat: number;    // instant (s) du temps 1 où commence la boucle
  beats: number;        // longueur de la boucle en temps, multiple de 8
  duration: number;     // durée du fichier (s)
  gainDb: number;       // correction de niveau vers −16 LUFS
  prompt: string; model: string; generatedAt: string;   // provenance
  measure: { drift: number; confidence: number };       // qualité de l'analyse
}
```

`bpm`, `firstBeat` et `beats` sont **mesurés** par `scripts/tempo.mjs`, jamais recopiés du prompt :
un générateur respecte un tempo demandé à peu près, pas exactement.

## Calage sur la danse

- Le transport est celui de la synthèse : `b(t) = b0 + (t − t0)·bpm/60`, ancré sur l'horloge
  `AudioContext` (fonctions de `src/music/scheduler.ts`, réutilisées telles quelles).
- Position de lecture pour le temps `b` :
  `p(b) = firstBeat + mod(b, beats) · 60 / piste.bpm`. Comme `beats` est un multiple de 8, le
  temps 1 de la boucle tombe sur un temps 1 du compte de 8 de la danse.
- La source est un `AudioBufferSourceNode` en boucle entre `firstBeat` et
  `firstBeat + beats·60/piste.bpm`, démarrée à un instant précis de l'horloge audio avec le décalage
  `p(b)` : calage à l'échantillon près, sans dérive.
- **Tempo du curseur** : `vitesse = bpm / piste.bpm`. Hors du tempo de la piste, la boucle est jouée
  plus vite ou plus lentement et sa hauteur change, comme un vinyle. Le changement de vitesse est
  programmé à un instant futur proche, et le transport est ré-ancré au même instant : le temps
  reste continu, la source n'est pas relancée (pas de coupure quand on fait glisser le curseur).
- **Pause** : la source s'arrête en fondu court, le temps est figé. **Reprise** et **saut** : une
  nouvelle source démarre à la position du temps affiché.
- **Changement de style** (ou de côté A/B) : la source s'arrête, la piste du nouveau style est
  chargée puis démarre à la position du temps courant. Pendant le chargement, l'horloge audio
  continue de piloter la danse, en silence.
- **Raccord de boucle** : au chargement, un fondu enchaîné de 30 ms est appliqué dans le tampon
  autour du point de raccord (fonction pure `crossfadeLoop`), pour éviter un clic. Le fichier
  publié n'est pas modifié.
- **Niveau** : la piste passe par un gain (`gainDb`, puis le volume) sans le compresseur de la
  synthèse, qui ferait pomper une musique déjà mixée.

## Source et repli

| Situation | Source jouée |
|---|---|
| Une piste existe pour le style, source « Enregistrement » (défaut) | boucle enregistrée |
| Source « Synthèse » choisie (`source=synthese` dans l'URL) | synthèse |
| Pas de piste pour le style | synthèse, sans message |
| Piste introuvable ou illisible | synthèse, avec le message « Enregistrement indisponible » |

Son coupé : aucun contexte audio, aucun téléchargement, comportement strictement inchangé.
Une piste n'est téléchargée qu'à l'activation du son pour son style (environ 1 Mo par piste).

Avec une piste enregistrée, les interrupteurs par instrument et les niveaux de preuve n'ont pas
d'objet : ils ne s'affichent que pour la synthèse. À leur place, l'interface indique la provenance
(« boucle générée par IA, Eleven Music »), le tempo de la piste et la longueur de la boucle. Le
bouton « Tempo conseillé » règle le curseur sur le tempo de la piste (arrondi à l'entier).

## Génération

`scripts/generer_musique.mjs` :

- lit la clé dans la variable d'environnement `ELEVENLABS_API_KEY` ; ne l'écrit jamais (ni
  journal, ni fichier, ni URL) ; sans clé, seuls `--plan` et `--analyse` fonctionnent ;
- `--plan` : affiche les prompts, les durées et le coût estimé, sans appel réseau ;
- avant toute génération : lit l'abonnement (`GET /v1/user/subscription`), affiche l'offre et les
  crédits restants, et s'arrête si le coût estimé dépasse le reste ;
- génère (`POST /v1/music`, `force_instrumental`, prompt du style, durée demandée), écrit
  `public/musique/<style>.mp3` ; **refuse d'écraser** une piste existante sans `--refaire` (une
  prise coûte des crédits) ;
- analyse le fichier (décodage par `ffmpeg`, puis `scripts/tempo.mjs`) et met à jour
  `src/music/recordings.data.ts` ; `--analyse` refait seulement cette étape, sans réseau ;
- s'arrête avec un message clair si le tempo mesuré s'écarte de plus de 4 % du tempo demandé ou
  si la dérive mesurée dépasse 25 ms : la piste est à refaire ou à valider à l'oreille.

Coût : Eleven Music est facturé 900 crédits par minute générée (tarif relevé le 21 novembre 2026).

| Style | Tempo demandé | Boucle visée | Durée demandée |
|---|---|---|---|
| kizomba | 102 bpm (prompt du propriétaire, tel quel) | 96 temps | 62 s |
| semba | 120 bpm | 128 temps | 68 s |
| kompa | 120 bpm | 128 temps | 68 s |
| tarraxinha | 75 bpm | 64 temps | 56 s |
| suave | 72 bpm | 64 temps | 58 s |
| zouk brésilien | 80 bpm | 64 temps | 52 s |

Total : environ 6 minutes par prise complète, soit environ 5 500 crédits.

### Prompts

Le prompt de la kizomba est celui du propriétaire, mot pour mot. Les autres reprennent sa
structure (tempo strict, pas de changement de tempo ni de break, mixage sec, instrumental) avec
l'instrumentation documentée dans [docs/musique/](musique/README.md). Aucun prompt ne nomme
d'artiste, de titre ni d'œuvre (les conditions d'Eleven Music l'interdisent). Les prompts sont
versionnés dans `scripts/musique_prompts.mjs` et recopiés dans le registre de chaque piste.

### Analyse de tempo (`scripts/tempo.mjs`)

1. Enveloppe d'attaques : flux d'énergie par trames de 5,8 ms, sur le signal entier et sur la
   bande grave (grosse caisse).
2. Tempo et phase : recherche en peigne autour du tempo demandé (± 4 %), puis régression sur les
   attaques les plus proches de chaque temps prédit ; la **dérive** est l'écart maximal entre les
   attaques et la grille régulière.
3. Premier temps de mesure : phase de 4 temps dont les temps portent le plus d'énergie grave.
4. Boucle : plus grand multiple de 32 temps (à défaut 16, puis 8) qui tient dans le fichier.

Limite assumée : l'analyse trouve le temps et la mesure, pas le début d'une phrase de 8 temps
(deux candidats à 4 temps d'écart). Le registre accepte un décalage manuel ; la validation finale
se fait **à l'oreille** par le propriétaire.

## Conditions d'usage (relevé du 21 novembre 2026, à confirmer par le propriétaire)

D'après les conditions d'Eleven Music pour l'offre Starter : usage commercial en ligne et hors
ligne permis, sauf film, télévision, radio et jeux de studio ; pas d'attribution exigée ; diffusion
sur les plateformes de streaming musical interdite ; constitution d'une bibliothèque musicale
interdite ; l'utilisateur vérifie lui-même que la sortie est utilisable. Les pistes seront
**publiques** (dépôt GitHub et site Pages) : ce point est à valider par le propriétaire avant
publication. L'app et la documentation indiquent que la musique est générée par IA.

## Critères d'acceptation

1. Son coupé : comportement strictement inchangé (aucun contexte audio, aucun téléchargement).
2. `p(b)` : périodique de période `beats`, continue sur un tour, égale à `firstBeat` pour tout `b`
   multiple de `beats`, définie pour les temps négatifs.
3. Moteur de boucle sur sortie factice : démarrage à la position du temps affiché ; pause puis
   reprise sans saut de temps ; saut ; changement de tempo sans relance de la source et sans
   discontinuité du temps ; à tout instant, la position jouée correspond au temps affiché à moins
   d'une milliseconde.
4. Le temps de la danse ne dépasse pas la fin de figure (`endBeat`) et n'avance pas pendant un
   export.
5. Fondu de raccord : le tampon est continu au point de raccord, inchangé ailleurs.
6. Analyse de tempo sur un signal de synthèse au tempo et à la phase connus : tempo à ± 0,05 bpm,
   premier temps à ± 5 ms, premier temps de mesure retrouvé, dérive nulle ; une dérive injectée est
   détectée.
7. Registre : pour chaque piste, fichier présent, `beats` multiple de 8, boucle contenue dans le
   fichier, tempo dans la plage du curseur, prompt et date renseignés.
8. Piste absente ou illisible : repli sur la synthèse, message à l'écran.
9. Le script de génération n'appelle pas le réseau avec `--plan` ou `--analyse`, et n'affiche
   jamais la clé.
10. Contrôle navigateur avec une piste réelle : le temps 1 s'entend sur un transfert d'appui, à
    90 bpm comme au tempo de la piste ; pas de clic au raccord de boucle.

## Points ouverts (propriétaire)

- **Clé ElevenLabs** : où la lire, et accord pour la dépense de crédits.
- **Publication des pistes** dans un dépôt public : conforme aux conditions de l'offre ?
- **Kizomba à 102 bpm** (prompt tel quel) : le tempo conseillé de la kizomba devient celui de la
  piste. Alternative : demander 90 bpm.
- **Synthèse** : gardée en repli et en option (choix de ce chantier), ou retirée.
- **Hauteur au changement de tempo** : choix de la lecture en vitesse variable (calage exact,
  hauteur modifiée) plutôt que d'un étirement temporel (hauteur conservée, artefacts et calage
  moins sûr).
