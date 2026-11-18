# Recherche — posture par style, contacts de l'embrace, contraposition (tango)

Demandes 2026-11-18 (phase 15) : contacts hanches/genoux visibles en mode face à face, posture
(légère inclinaison du haut du corps, flexion des jambes) différente selon la danse, et
« contraposition » du tango entre haut et bas du corps dans ida e volta / quarts de tour.
Citations verbatim collectées en FR/EN.

## Posture selon la danse (kizomba/semba en particulier)

- **SOS Dance, Kizomba Footwork Manual (PDF, EN)**,
  https://sosadance.co.uk/wp-content/uploads/2017/07/Kizomba-Footwork-Manual-2.pdf :
  > « The footwork is based on Afro, which means it is danced with **slightly bent knees and loose
  > hips throughout**. The posture is unlike a ballroom frame, **the dancer should lean slightly
  > forward** taking more weight onto the balls of the feet, your knees should be soft… **Keep the
  > shoulder line level and do not pitch or sway the entire body**. »
  > « …movements that require a lot of **flexibility in the knees** for the frequent up and down
  > motion of the dance, the lower body & hip movements. »
- **saidadance.com, « Ginga in Kizomba and Semba » (EN)**,
  https://saidadance.com/ginga-in-kizomba-and-semba/ :
  > « The body posture is similar to hugging where **the chest is slightly forward**, the shoulders
  > are in normal position (not forced back), and **the knees have a slight bending in a relaxed
  > way**. This posture generates enough space between the lower bodies hips down. »
  > « According to Paulo Isidoro, **the most important part of ginga is the (slight) bending of
  > the knees**, as without it, the other movements cannot be accomplished. »
- **dancewithmeusa.com (EN)** : « Kizomba is danced in a continuous **close embrace, with partners
  connected from the chest down to the hips**… **grounded posture and soft, slightly bent knees**. »

## Points de contact de l'embrace (hanches ET genoux)

- **Capacious Journal, « Desiring Connection » (EN)**,
  https://capaciousjournal.com/article/desiring-connection :
  > « The embrace employs much body-to-body connection through touch — **chest, bellies, temples,
  > hands, thighs, knees, arms** — and requires a heightened sense of kinesthesia and
  > proprioception in order to move with your partner. »

## Contraposition / opposition (tango) — haut du corps opposé au bas

- **Tango Topics, « Definition: Opposition » (EN)**, https://tangotopics.com/definition/definition-opposition/ :
  > « **Opposition means that, for example, if you're stepping forward with your right leg/foot,
  > your left shoulder/arm will come forward to oppose this motion.** »
- **Revue Acropolis, « Éloge du tango » (FR)**, https://revue-acropolis.com/eloge-du-tango/ :
  > « Le danseur apprendra à marcher, **à guider avec le haut du corps, à dissocier haut et bas du
  > corps**. »
- **fr.wikipedia, Technique du tango rioplatense (FR)** :
  > « Un partenaire guide le poids du deuxième, qui suit, **en laissant aller naturellement son
  > poids, [transmis par] le corps du premier**, sans chercher à deviner les pas. »

## Implications pour l'app (spec-phase15)

1. **Mode paire** : espacement resserré (z=∓0.125) + marqueurs de contact **hanches (pelvis) et
   genoux** en plus de la poitrine, tous verts quand le contact est effectif (seuil ~0.09 m) →
   on voit que hanches et genoux se touchent. Le **retard du suiveur (delay) est supprimé** : en
   paire, le suiveur est le miroir exact du guideur (même style, phaseOffset 0) — la danse
   différente n'a de sens qu'en mode **comparaison côte à côte** (styleB n'est utilisé qu'en
   `mode=compare`).
2. **Posture par style** : `posture: { lean, knee }` (radians) dans chaque `STYLES` — lean =
   inclinaison du buste vers l'avant (kizomba/tarraxinha ~0.10–0.14, zouk négatif = cambré),
   knee = flexion de base des genoux (kizomba/tarraxinha ~0.30–0.34, plus fléchi que zouk ~0.12).
3. **Contraposition** : `idaContra(b)` pur — pendant chaque pas d'ida e volta, le bas du corps
   (root) tourne d'un côté et le haut du corps (chest/tête) du côté opposé (comme les quarts de
   tour de la phase 14 via `quartTurnStep`). En paire, le miroir (rotY π) reflète automatiquement
   la dissociation : le corps du guideur « fait agir » le suiveur via les contacts.
