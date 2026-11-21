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

## État d'avancement (21 novembre 2026)

| Élément | État |
|---|---|
| Lecteur de boucle synchronisé, repli, interface, tests | fait |
| Script de génération, analyse de tempo, de structure et de signature rythmique | fait |
| Kizomba, prise 1 (prompt du propriétaire, mot pour mot) | **refusée à l'écoute**, retirée de la branche |
| Kizomba, deuxième tentative | extraits d'essai A, B, C générés ; **variante C retenue** à l'oreille par le propriétaire |
| Kizomba, prise complète de la variante C | première demande : **fichier silencieux** (échec de génération) ; deuxième demande, en sections de 32 temps : **générée et mesurée**, en attente de l'écoute du propriétaire |
| Pistes semba, kompa, tarraxinha, suave, zouk brésilien | après une kizomba validée |

Piste dans la branche : kizomba (variante C). Les autres styles jouent la synthèse.

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
- **Raccord de boucle** : au chargement, un fondu enchaîné (30 ms au plus) est appliqué dans le
  tampon juste avant le point de raccord (fonction pure `crossfadeLoop`), pour éviter un clic ;
  l'attaque du temps 1 n'est pas touchée. Le fichier publié n'est pas modifié.
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
  journal, ni fichier, ni URL) ; sans clé, seuls `--plan` et `--analyse` fonctionnent ; pour la
  lire d'un fichier d'environnement sans l'afficher : `node --env-file=<fichier> scripts/generer_musique.mjs …` ;
- `--plan` : affiche les prompts, les durées et le coût estimé, sans appel réseau ;
- avant toute génération : lit l'abonnement (`GET /v1/user/subscription`), affiche l'offre et les
  crédits restants, et s'arrête si le coût estimé dépasse le reste ;
- génère (`POST /v1/music`, `force_instrumental`, prompt du style, durée demandée), écrit
  `public/musique/<style>.mp3` ; **refuse d'écraser** une piste existante sans `--refaire` (une
  prise coûte des crédits) ;
- analyse le fichier (décodage par `ffmpeg`, puis `scripts/tempo.mjs`) et met à jour
  `src/music/recordings.data.ts` ; `--analyse` refait seulement cette étape, sans réseau ;
- signale (code de sortie 2) une piste dont le tempo mesuré s'écarte de plus de 4 % du tempo
  demandé, dont la dérive dépasse 15 ms, ou dont un quart du morceau a moins de 30 % de ses temps
  portés par une attaque : la piste est à refaire ou à valider à l'oreille ;
- `--abonnement` : affiche l'offre et les crédits restants (appel gratuit) ;
- `--decaler <style>=<temps>` : décale le temps 1 de la boucle (validation à l'oreille) ;
- `--temps <style>=<temps>` : impose la longueur de la boucle, multiple de 8 temps ;
- `--essais <style>` : extraits courts de chaque variante du style, hors dépôt (`essais/musique/`) ;
- `--variante <style>=<lettre>` : prise complète à partir du plan de composition de la variante.

Coût : 750 crédits par minute générée, mesurés sur le compteur de l'abonnement le 21 novembre 2026 (la grille publique annonçait 900) ; une prise de 62 s coûte 775 crédits.

| Style | Tempo demandé | Boucle visée | Durée demandée |
|---|---|---|---|
| kizomba | 102 bpm (prompt du propriétaire, tel quel) | 96 temps | 62 s |
| semba | 120 bpm | 128 temps | 68 s |
| kompa | 120 bpm | 128 temps | 68 s |
| tarraxinha | 75 bpm | 64 temps | 56 s |
| suave | 72 bpm | 64 temps | 58 s |
| zouk brésilien | 80 bpm | 64 temps | 52 s |

Total : environ 6 minutes par prise complète des six styles, soit environ 4 550 crédits.

### Prompts

Le prompt de la kizomba est celui du propriétaire, mot pour mot ; la prise qui en est sortie a été
refusée à l'écoute (voir plus bas), et la deuxième tentative passe par des plans de composition.
Les autres prompts reprennent sa
structure (tempo strict, pas de changement de tempo ni de break, mixage sec, instrumental) avec
l'instrumentation documentée dans [docs/musique/](musique/README.md). Aucun prompt ne nomme
d'artiste, de titre ni d'œuvre (les conditions d'Eleven Music l'interdisent). Les prompts sont
versionnés dans `scripts/musique_prompts.mjs` et recopiés dans le registre de chaque piste.

### Analyse de tempo (`scripts/tempo.mjs`)

1. Enveloppe d'attaques : flux d'énergie par trames de 5,8 ms, sur le signal entier et sur la
   bande grave (grosse caisse).
2. Tempo et phase : recherche en peigne autour du tempo demandé (± 12 %), puis régression sur les
   attaques les plus proches de chaque temps prédit.
3. Régularité : la **dérive** est le plus grand de deux écarts — la tendance des attaques par
   rapport à la grille (moyenne glissante sur 8 temps), et l'écart entre la grille d'ensemble et
   la grille recalculée sur chaque tiers du morceau. La **confiance** est la part des temps portés
   par une attaque, dans le quart du morceau où elle est la plus faible (une musique syncopée ne
   pose pas une attaque sur chaque temps : c'est normal).
4. Temps 1 d'une phrase de 8 temps, déduit de la **structure** : un morceau commence, change de
   section et se termine sur un temps 1. Trois indices votent — le début franc de la musique, les
   changements de niveau entre sections (tout, grave, aigu), la fin (accord final qui résonne, ou
   silence). À défaut, l'accent grave de la mesure de 4 temps départage.
5. Boucle : du premier temps 1 « plein » (une entrée en fondu est écartée) au plus grand multiple
   de 32 temps (à défaut 16, puis 8) avant la fin de la musique ; la résonance de l'accord final
   reste hors de la boucle.

6. Signature rythmique : force des attaques graves (grosse caisse, basse) et aiguës (rimshot,
   charleston, racleur) sur les seize doubles-croches de la mesure, pondérée par l'amplitude.

Limite assumée : le temps 1 est une **déduction**, pas une écoute. Deux réglages manuels existent,
sans nouvelle génération : `--decaler` (temps 1) et `--temps` (longueur de boucle, pour ne garder
qu'une section). La validation finale se fait **à l'oreille** par le propriétaire.

## Écoute du propriétaire : prise 1 de la kizomba refusée (21 novembre 2026)

> ça ressemble plus à de la techno qu'à de la kizomba semba angolaise

La prise (62 s, 775 crédits) venait du prompt du propriétaire, mot pour mot. Ce que la
mesure en dit, après coup :

| Mesure | Valeur | Lecture |
|---|---|---|
| Tempo | 101,994 bpm pour 102 demandés, dérive 3 ms | le tempo demandé est tenu |
| Attaques graves sur les temps 1 à 4 | 0,95 – 0,82 – 1,00 – 0,88 | grosse caisse d'égale force sur les quatre temps : la pulsation des musiques électroniques de danse |
| Syncope 3-3-2 dans l'aigu | 0,05 | presque aucune syncope |
| Structure | 32 temps d'introduction, 32 avec charleston, relance de 3 temps, 32 temps pleins, accord final | une relance malgré « no breakdown » |

Pourquoi la prise a dérivé (hypothèses, appuyées sur le guide de prompt d'Eleven Music) :

- le guide demande de fixer cinq choses — genre, humeur, instrumentation, tempo, **époque de
  production** — et prévient que ce qui manque reçoit le choix le plus probable ; le prompt ne
  donnait ni époque ni humeur ;
- « dry and punchy studio mix, high transient clarity » et « prominent … kick drum » sont un
  vocabulaire de production moderne et percutante ;
- un prompt ne peut exclure qu'en toutes lettres ; rien n'écartait la grosse caisse sur chaque temps.

La recherche du dépôt décrit autre chose : pour la kizomba, une rythmique héritée du zouk
(figure 3-3-2), des percussions peu denses, une grosse caisse douce sur les temps forts seulement,
une basse ronde et forte, des guitares ; pour le semba, une mesure à deux temps rebondissante,
ngomas, dikanza en doubles-croches, deux guitares, accordéon
([kizomba](musique/kizomba.md), [semba](musique/semba.md)).

### Ce qui change

- **Signature rythmique** (`scripts/tempo.mjs`) : force des attaques graves et aiguës sur les seize
  doubles-croches de la mesure. Une attaque grave d'égale force sur les quatre temps est désormais
  signalée dès la mesure, avant toute écoute. Ce n'est pas un jugement musical : l'oreille tranche.
- **Plans de composition** (`scripts/musique_prompts.mjs`, `VARIANTES`) : au lieu d'un prompt, une
  liste de styles voulus (le premier donne le genre, avec l'époque et le type de production) et
  une liste de styles **à éviter** (techno, house, grosse caisse sur chaque temps, etc.).
- **Extraits d'essai** (`--essais kizomba`) : un extrait de 15 s par variante, écrit dans
  `essais/musique/` (hors dépôt), pour choisir à l'oreille avant de payer une prise complète.

| Variante | Couleur visée |
|---|---|
| A | Kizomba de groupe, Luanda, années 1990 : rythmique zouk en 3-3-2, grosse caisse douce sur 1 et 3, congas, basse ronde, guitare claire en arpèges, nappe discrète, mineur |
| B | Semba de groupe, Luanda, années 1970 : deux temps rebondissants, tambours à main, dikanza en doubles-croches, deux guitares, accordéon, majeur |
| C | Fusion kizomba et semba : la rythmique de A avec les guitares, la dikanza et l'accordéon de B |

Les trois gardent 102 bpm, le tempo du prompt du propriétaire.

### Extraits d'essai du 21 novembre 2026 (accord du propriétaire : « Oui, les trois »)

Générés avec `--essais kizomba` (564 crédits), écrits dans `essais/musique/` et non
publiés. Mesures sur 15 s, donc moins sûres que sur une prise complète :

| Variante | Tempo | Attaques graves sur les temps 1 à 4 | Ce que montre le profil par double-croche |
|---|---|---|---|
| A | 102,2 bpm | 1,00 – 0,21 – 0,06 – 0,05 | grave sur le temps 1, puis syncopé (contretemps du 2 et du 4) ; aigu accentué sur les temps 2 et 4 |
| B | 102,0 bpm | 0,52 – 0,09 – 0,39 – 0,07 | grave sur les temps 1 et 3 et à contretemps ; aigu en « galop » (trois doubles-croches, un silence), comme une dikanza |
| C | 102,9 bpm | 1,00 – 0,28 – 0,34 – 0,53 | grave appuyé sur le temps 1 ; aigu syncopé (syncope 3-3-2 mesurée à 0,51) |

Aucun des trois n'a la pulsation à quatre temps égaux de la prise 1 (égalité mesurée : 0,05, 0,14
et 0,28, contre 0,82). Cela écarte le défaut constaté, sans dire que la musique est juste : le
choix se fait à l'oreille. **Choix du propriétaire : la variante C.**

### Prise complète de la variante C : un fichier silencieux (21 novembre 2026)

La première prise complète demandait la variante C en **un seul bloc de 62 s**. L'API a répondu
sans erreur, mais le fichier rendu est du silence : 58 s de silence numérique, puis un souffle à
−51 dB. Les 775 crédits sont débités. Les extraits de 15 s, demandés de la même façon en un bloc,
contiennent bien de la musique.

Cause inconnue. Indice : le planificateur de l'API (`POST /v1/music/plan`, gratuit), interrogé
ensuite avec la même description pour 62 s, découpe le morceau en quatre sections de 15 à 16 s.

Ce qui change :

- **Sections de 32 temps** : un morceau entier est demandé en sections de 32 temps (18,8 s à
  102 bpm, soit quatre phrases de 8 temps), toutes avec les mêmes styles pour un groove constant,
  suivies d'une courte section de fin. Les changements de section tombent ainsi sur un temps 1 et
  la fin reste hors de la boucle.
- **Garde-fou** : une prise rendue sous −40 LUFS est tenue pour un échec ; elle est écartée dans
  `essais/musique/`, jamais publiée ni inscrite au registre (code de sortie 3).
- **Coût mesuré** : 750 crédits par minute d'après le compteur de l'abonnement (775 pour 62 s,
  564 pour trois extraits de 15 s), et non 900 comme l'annonçait la grille publique.

### Prise complète de la variante C, en sections (21 novembre 2026, accord : « Oui, relancer »)

Demandée en trois sections de 32 temps aux styles identiques, plus une fin. Le fichier contient
bien de la musique, et la branche la publie pour l'écoute.

| Mesure | Valeur | Lecture |
|---|---|---|
| Niveau | −15,2 LUFS (gain −0,8 dB) | normal |
| Tempo | 101,996 bpm pour 102 demandés, dérive 2 ms | tenu |
| Structure | niveau constant du temps 1 au temps 100, aucun changement de section, puis la fin | pas de relance ni d'introduction : un groove d'un seul tenant |
| Temps 1 | 0,036 s | début franc de la musique ; l'accent grave le plus fort tombe sur le temps 3 de la mesure |
| Boucle | 96 temps, de 0,036 s à 56,51 s | les trois sections demandées ; les 4 temps suivants prolongent le même groove |
| Attaques graves sur les temps 1 à 4 | 0,73 – 0,66 – 1,00 – 0,72 | du grave sur chaque temps, un temps appuyé : entre l'extrait C (0,28) et la prise refusée (0,82) |
| Syncope 3-3-2 dans l'aigu | 0,61 | figure nette |

Deux réserves pour l'écoute. C'est une **nouvelle génération** avec les consignes de l'extrait C,
pas son prolongement : la couleur peut différer. Et le grave est présent sur chaque temps, plus
que dans l'extrait ; la mesure ne dit pas s'il s'agit d'une grosse caisse ou d'une basse.

L'analyse a d'abord placé le temps 1 deux temps trop tard, parce que l'accent grave du temps 3
pesait plus lourd que le début de la musique. Corrigé : l'accent grave départage seulement quand
la structure ne dit rien.

Crédits dépensés pour ce chantier au 21 novembre 2026 : 775 (prise 1, refusée) + 564 (extraits)
+ 775 (prise silencieuse) + 775 (prise en sections) = 2 889 ; il en reste 35 018.

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
   premier temps à ± 5 ms, premier temps de mesure retrouvé, dérive nulle ; un tempo qui accélère
   est signalé ; une entrée en fondu est écartée de la boucle ; un accord final reste hors de la
   boucle et un changement de section désigne le temps 1.
7. Registre : pour chaque piste, fichier présent, `beats` multiple de 8, boucle contenue dans le
   fichier, tempo dans la plage du curseur, prompt et date renseignés.
8. Piste absente ou illisible : repli sur la synthèse, message à l'écran.
9. Le script de génération n'appelle pas le réseau avec `--plan` ou `--analyse`, et n'affiche
   jamais la clé.
10. Contrôle navigateur avec une piste réelle : le temps 1 s'entend sur un transfert d'appui, à
    90 bpm comme au tempo de la piste ; pas de clic au raccord de boucle.

## Points ouverts (propriétaire)

- **Écoute de la piste kizomba (variante C)** : couleur, temps 1 sur un transfert d'appui,
  raccord de boucle. Si le temps 1 est décalé : `--decaler kizomba=<temps>`, sans nouvelle prise.
- **Tempo** : les sources du dépôt situent la kizomba vers 85–95 bpm ; 102 bpm vient du prompt
  d'origine. À confirmer.
- **Autres styles** : après une kizomba validée, même méthode (variantes, extraits, prise).
- **Publication des pistes** dans un dépôt public : conforme aux conditions de l'offre ?
- **Synthèse** : gardée en repli et en option (choix de ce chantier), ou retirée.
- **Hauteur au changement de tempo** : choix de la lecture en vitesse variable (calage exact,
  hauteur modifiée) plutôt que d'un étirement temporel (hauteur conservée, artefacts et calage
  moins sûr).
- **Clé ElevenLabs** : elle n'est pas dans le Vault ; elle est lue depuis un fichier
  d'environnement local du propriétaire, hors dépôt (`node --env-file=…`). La déposer dans le
  Vault éviterait de dépendre de ce fichier.
