# Spec Phase 15 — paire biomecanique : contacts hanches/genoux, plus de retard suiveur, posture par style, contraposition

Demandes 2026-11-18 (2 messages) :
1. URL pair tarraxinha (campos=-4.3,1.85,0.25…) : « on ne voit pas que les hanches (ni les genoux)
   se touchent alors que le danseur guide avec ces points de contact » + « profiter de cette vue
   pour corriger le cadre du danseur ».
2. « En fonction de la danse la posture est légèrement différente : l'inclinaison du haut du
   corps vers l'avant ou plus neutre et la flexion des jambes ».
3. « On va retrouver la "Contraposition" du tango entre le haut et le bas dans l'ida et volta ou
   les quarts de tours aussi. Il faut que le corps du guideur fasse agir le corps du suiveur
   biomécaniquement : c'est la danse à 2. »
4. « le but est que le "retard du suiveur" ne soit pas un paramètre : la danse différente n'a de
   sens que lors de la comparaison côte à côte (pas de suiveur). »

Sources : `docs/posture-contraposition.md` (citations verbatim EN/FR).

## §1 Pair mode = miroir exact, sans retard ; styleB réservé au mode comparaison

- `App.tsx` : suppression de l'état `followDelay`, du param URL `delay`, de la prop Controls
  `followDelay`/`onFollowDelay` et du slider « Retard du suiveur » ; `phaseOffset` du suiveur = 0
  (miroir exact du guideur, même `b`). En mode `pair`, le suiveur danse **styleA** (comme le
  guideur) ; `styleB` n'est utilisé qu'en `mode=compare` (côte à côte). README/CONVENTIONS à jour.
- Le guideur « fait agir » le suiveur biomécaniquement : même chorégraphie, miroir (rotY π),
  contacts affichés (voir §2) — la transmission passe par les points de contact, pas par un délai.

## §2 Contacts hanches + genoux visibles en paire

- `App.tsx` : espacement paire z = ∓0.14 → **∓0.125** (embrace proche, surfaces frontales en
  contact).
- `Rig.tsx` : nouveaux marqueurs `contactKneeL` / `contactKneeR` (petites sphères) placés à
  l'avant des genoux (x=±0.084, y≈HIP_Y−0.44, z≈0.10), `visible={showContacts}` comme
  contactPelvis/contactChest ; `pair.current[side]` gagne `kneeL`/`kneeR`.
- `ContactViz.tsx` : lignes + marqueurs pour les 2 genoux en plus de poitrine et bassin ;
  contact = distance < 0.09 m → vert, sinon rouge/gris (mêmes conventions que chest/pelvis).
- Gherkin : test de distance des marqueurs en config paire (positions locales connues) — les 4
  points de contact (chest, pelvis, kneeL, kneeR) sont à < 0.09 m entre leader et follower en
  position de base (z=∓0.125, rotY π).

## §3 Posture par style : `posture: { lean, knee }`

- `styles.ts` : `StyleDef.posture: { lean: number; knee: number }` (radians) pour les 6 styles.
  Valeurs (sourcées docs/posture-contraposition.md, « lean slightly forward », « slightly bent
  knees », cambré zouk) : kizomba lean 0.10 knee 0.30 ; tarraxinha lean 0.14 knee 0.34 ;
  semba lean 0.06 knee 0.24 ; kompa lean 0.08 knee 0.20 ; suave lean 0.02 knee 0.14 ;
  zouk lean −0.10 knee 0.12.
- `Rig.tsx` : après `lockUpperTrunk` (qui préserve le pitch), `chest.rotation.x += lean`,
  `head.rotation.x += lean` ; flexion de base des genoux dans la branche IK :
  `knee.rotation.x = knee.rotation.x*(1-w) + (sol.beta + kneeBase)*w` (le pied reste plat via
  la contrainte foot-flat qui suit) ; branche non-IK : `kneeX.rotation.x += kneeBase` avant
  le foot-flat.
- Gherkin `posture-styles.feature` : les 6 styles ont une posture finie ; `knee ∈ [0, 0.5]`,
  `lean ∈ [−0.3, 0.3]` ; tarraxinha.knee > kizomba.knee > zouk.knee ; zouk.lean < 0 (cambré).

## §4 Contraposition dans ida e volta (quarts de tour déjà OK, phase 14)

- `styles.ts` : `idaContra(b): { upperYaw, lowerYaw }` pur — pendant chaque pas de 2 temps de
  l'ida e volta, le bas (lowerYaw) pivote vers le côté du pied qui avance et le haut (upperYaw)
  du côté opposé (opposition tango), amplitude ~0.08/0.10 rad en cloche sin(π·ph) sur le pas.
- `Rig.tsx` : `const ic = ida ? idaContra(b) : null` ; appliqué après `lockUpperTrunk` comme la
  dissociation des quarts : `root.rotation.y += ic.lowerYaw`, `chest/head.rotation.y += ic.upperYaw`.
  En paire, le rotY π du suiveur reflète la dissociation (pas de reverse pour ida).
- Gherkin : pendant un pas, `upperYaw` et `lowerYaw` sont de signes opposés (contraposition) et
  retombent à 0 entre les pas.

## §5 Cadre du danseur vérifié à la vue du bug

- Re-capture à l'URL pair fournie (campos=-4.3,1.85,0.25…) : vérifier le cadre (coudes pliés,
  avant-bras G vers le haut) du guideur et de la suiveuse ; corriger `DANCE_FRAME*` si besoin.
- GIF `paire-contacts.gif` (mode pair, appui/contacts, vue de côté) ajouté au README avec
  `<details>` source.

## Hors scope

Pas de nouveau style ; corridinho inchangé ; conventions verrouillées (hiérarchie GLB, métriques,
clamp sol, CC BY-SA DBCLS) intactes.

## Validation

- `npm test` (nouveaux features + 50 existants) vert — garanti en CI (job `test`) ; build vert.
- Sonde/visuel : en mode pair, les 4 marqueurs de contact (poitrine, bassin, 2 genoux) passent
  au vert ; genoux visiblement fléchis en kizomba/tarraxinha vs zouk (posture) ; dissociation
  visible en ida/quarts.
- README/CONTEXT/TASKS/CONVENTIONS à jour.
