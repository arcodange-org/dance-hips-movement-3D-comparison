// #132 — Atlas anatomique : calcul hors navigateur du `meta.json` d'une planche « mouvement », sur le
// GLB réel et par le moteur de l'application (src/atlas.ts → src/pose.ts). Partagé par
// scripts/capture_atlas.mjs (écriture) et scripts/test_atlas_planches.mjs (contrôle).
// Déterministe : ni date, ni machine. Spécification : docs/spec-atlas-anatomique.md, D11.
import { build } from "esbuild";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import { fixture, minimumBoneY } from "./pose_fixture.mjs";

export const ROOT = new URL("../", import.meta.url).pathname;
export const MANIFEST_PATH = ROOT + "docs/atlas/manifest.json";
export const DOCS_DIR = ROOT + "docs/atlas/mouvements/";
export const PUBLIC_DIR = ROOT + "public/atlas/mouvements/";
/** Taille d'une image de planche (px) et cadence des GIF (images par seconde). */
export const ATLAS_CAPTURE = { largeurPx: 400, hauteurPx: 500, gifImagesParSeconde: 8 };

export const readManifest = () => JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

/** Le moteur de l'application, empaqueté en mémoire pour Node (comme scripts/test_poses.mjs). */
export async function loadAtlasApi() {
  const tmp = mkdtempSync(ROOT + "scripts/.atlas-api-");
  try {
    await build({
      stdin: { contents: ["atlas", "pose", "anatomy", "styles", "rigJoints", "cameras"].map(n => `export * from "./src/${n}";`).join("\n"),
        resolveDir: ROOT, loader: "ts" },
      bundle: true, packages: "external", platform: "node", format: "esm", outfile: tmp + "/api.mjs",
      define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent",
    });
    return await import(pathToFileURL(tmp + "/api.mjs").href);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

const round = (value, digits) => {
  const k = 10 ** digits, r = Math.round(value * k) / k;
  return Object.is(r, -0) ? 0 : r;
};

export const frameFile = (vue, index) => `${vue}-${String(index).padStart(2, "0")}.png`;
export const gifFile = (vue) => `${vue}.gif`;
export const PLANCHE_FILE = "planche.png";
export const META_FILE = "meta.json";
export const README_FILE = "README.md";

/** Aller-retour de la ROM pour un GIF, extrêmes tenus trois images : [0,0,0,1,…,N−1,N−1,N−1,N−2,…,1]. */
export function gifSequence(frames) {
  const up = Array.from({ length: frames }, (_, i) => i);
  return [0, 0, ...up, frames - 1, frames - 1, ...up.slice(1, -1).reverse()];
}

/** Mesures brutes (non arrondies) d'un mouvement sur le rig réel, frame par frame. */
export function measureMovement(api, mouvement, frames) {
  const f = fixture(api);
  const reference = api.atlasReference(f.r, f.model, mouvement);
  const neutral = api.measureAtlasPose(f.r, mouvement, reference, api.applyAtlasPose(f.r, f.model, mouvement, 0));
  const up0 = new THREE.Vector3(0, 1, 0).applyQuaternion(reference.quaternion);
  const samples = api.atlasAngles(mouvement, frames).map((angleDeg, index) => {
    const stats = api.applyAtlasPose(f.r, f.model, mouvement, angleDeg);
    const mesure = api.measureAtlasPose(f.r, mouvement, reference, stats);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(api.atlasNode(f.r, mouvement).getWorldQuaternion(new THREE.Quaternion()));
    return { index, angleDeg, mesure, solMm: minimumBoneY(f.r) * 1000, up: up.toArray() };
  });
  return { fixture: f, reference, neutral, up0: up0.toArray(), samples };
}

/** Convention de signe, lue sur les mesures de la frame d'angle maximal (jamais supposée). */
function signConvention(mouvement, measured) {
  const last = measured.samples.reduce((a, b) => (b.angleDeg > a.angleDeg ? b : a));
  if (!(last.angleDeg > 0)) return "angle négatif uniquement : sens inverse de la rotation directe autour de l'axe monde";
  if (mouvement.articulation !== "Pelvis") return "angle positif : rotation directe autour de l'axe monde";
  if (mouvement.axeLocal === "z") {
    const haute = last.mesure.ecartHanchesMm - measured.neutral.ecartHanchesMm > 0 ? "gauche" : "droite";
    return `angle positif : la hanche ${haute} monte, l'autre descend (rotation directe autour de l'axe monde)`;
  }
  if (mouvement.axeLocal === "y") {
    const avant = last.mesure.hanches[2] - measured.neutral.hanches[2] > 0 ? "gauche" : "droite";
    return `angle positif : la hanche ${avant} avance, l'autre recule (rotation directe autour de l'axe monde)`;
  }
  const sens = last.up[2] - measured.up0[2] > 0 ? "avant (antéversion)" : "arrière (rétroversion)";
  return `angle positif : le haut du bassin bascule vers l'${sens}`;
}

const fr = (value, digits = 1) => value.toFixed(digits).replace(".", ",").replace("-", "−");

/** D13 — ce que la chaîne fermée du bassin montre et ne montre pas, par axe du mouvement. */
const LIMITES_BASSIN = {
  z: [
    "Bassin en chaîne fermée, pieds plantés : la hanche qui descend fait fléchir son genou. D'autres stratégies (demi-pointe, translation du bassin) ne sont pas montrées.",
    "Hauteur du bassin : la plus haute que les jambes permettent. Les genoux fléchissent donc à tour de rôle et le bassin remonte au passage par le centre (colonne « Hauteur du bassin »). La variante à hauteur constante, les deux genoux fléchis ensemble, n'est pas montrée : question ouverte dans la spécification.",
  ],
  y: [
    "Bassin en chaîne fermée, pieds plantés : les pieds ne pivotent pas, les hanches absorbent la rotation.",
    "Le thorax reste de face parce que la colonne contre-tourne du même angle. C'est une règle propre à l'atlas : l'isolation du comparateur compense le roulis et le tangage du bassin, pas le lacet.",
  ],
  x: [
    "Bassin en chaîne fermée, pieds plantés : la bascule se fait autour de l'axe des centres de hanche, les jambes ne bougent pas.",
    "Le buste reste vertical et se décale d'avant en arrière avec le haut du bassin. La courbure lombaire qui accompagne la bascule chez une personne n'est pas montrée.",
  ],
};

/** D13 — repère de position d'une planche du bassin : la mesure qui varie avec le mouvement, par axe.
 * `titre` et `note` servent au tableau de la page, `phrase` à la légende de la planche. */
const REPERES = {
  z: {
    titre: "Hanche gauche − droite", note: "Hanche : écart de hauteur des centres articulaires.",
    valeur: f => f.mesure.ecartHanchesMm,
    phrase: f => `hanche gauche ${fr(f.mesure.ecartHanchesMm)} mm par rapport à la droite`,
  },
  y: {
    titre: "Hanche gauche, avancée", note: "Hanche : avancée du centre articulaire gauche par rapport au droit (positif : gauche devant).",
    valeur: f => f.mesure.avanceHanchesMm,
    phrase: f => `hanche gauche ${fr(Math.abs(f.mesure.avanceHanchesMm))} mm ${f.mesure.avanceHanchesMm >= 0 ? "devant" : "derrière"} la droite`,
  },
  x: {
    titre: "Sacrum, hauteur", note: "Sacrum : hauteur du centre du sacrum au-dessus de l'axe des centres de hanche.",
    valeur: f => f.mesure.sacrumHauteurMm,
    phrase: f => `centre du sacrum ${fr(f.mesure.sacrumHauteurMm)} mm au-dessus de l'axe des hanches`,
  },
};
export const atlasRepere = (meta) => REPERES[meta.articulation.axeLocal];

/** Le `meta.json` d'une planche : provenance, mesures sur le GLB, vues, fichiers. */
export function buildAtlasMeta(api, manifest, id, { frames = api.ATLAS_FRAMES, vues = manifest.views, muscles = true } = {}) {
  const mouvement = manifest.mouvements.find(m => m.id === id);
  if (!mouvement) throw new Error(`atlas : mouvement « ${id} » absent du manifeste`);
  const support = api.atlasSupport(mouvement);
  if (!support.ok) throw new Error(`atlas ${id} : ${support.raison}`);
  if (!Number.isInteger(frames) || frames < 2 || frames > api.ATLAS_FRAMES_MAX)
    throw new RangeError(`atlas : --frames entre 2 et ${api.ATLAS_FRAMES_MAX} (reçu ${frames})`);
  const unknown = vues.filter(vue => !manifest.views.includes(vue) || !(vue in api.ATLAS_VIEWS));
  if (unknown.length || !vues.length) throw new RangeError(`atlas : vues inconnues « ${unknown.join(", ")} » (vues du manifeste : ${manifest.views.join(", ")})`);
  const measured = measureMovement(api, mouvement, frames);
  const angles = measured.samples.map(s => s.mesure.angleDeg);
  const mesuree = [Math.min(...angles), Math.max(...angles)];
  const state = (vue, frame) => ({ id, vue, frame, frames, muscles });
  return {
    atlas: manifest.atlas,
    version: manifest.version,
    issue: manifest.issue,
    mouvement: { id, label: mouvement.label, labelEn: mouvement.labelEn, cote: mouvement.cote, priorite: mouvement.priorite },
    generation: api.ATLAS_PROVENANCE,
    niveauDePreuve: mouvement.preuve,
    licence: { ...manifest.licence, attribution: api.ATLAS_ATTRIBUTION },
    limites: [
      "Illustratif : aucune validation médicale ni chorégraphique.",
      "Pose neutre du moteur : pieds à l'écartement et à l'ouverture natifs du squelette, genoux fléchis d'au moins 0,12 rad par l'IK (jambe jamais verrouillée).",
      ...LIMITES_BASSIN[mouvement.axeLocal],
      "Buste et bras : volumes stylisés, pas un maillage anatomique. Le haut du tronc compense le bassin (iso=1), bras en cadre de danse.",
    ],
    articulation: {
      rig: mouvement.rig,
      noeud: mouvement.articulation,
      axeLocal: mouvement.axeLocal,
      axeMonde: measured.reference.axe.toArray().map(v => round(v, 6)),
      signe: signConvention(mouvement, measured),
    },
    romDeg: {
      manifeste: mouvement.romDeg,
      mesuree: mesuree.map(v => round(v, 4)),
      ecartMaxDeg: round(Math.max(Math.abs(mesuree[0] - mouvement.romDeg[0]), Math.abs(mesuree[1] - mouvement.romDeg[1])), 4),
      methode: `angle signé du quaternion monde du nœud ${mouvement.articulation}, relatif à la pose neutre (angle 0), autour de l'axe monde`,
    },
    frames: measured.samples.map(s => ({
      index: s.index,
      angleDeg: round(s.angleDeg, 4),
      mesure: {
        angleDeg: round(s.mesure.angleDeg, 4),
        horsAxeDeg: round(s.mesure.horsAxeDeg, 4),
        ecartHanchesMm: round(s.mesure.ecartHanchesMm, 2),
        avanceHanchesMm: round(s.mesure.hanches[2] * 1000, 2),
        sacrumHauteurMm: round(s.mesure.sacrum[1] * 1000, 2),
        sacrumAvanceMm: round(s.mesure.sacrum[2] * 1000, 2),
        genouDeg: { R: round(s.mesure.genouDeg.R, 2), L: round(s.mesure.genouDeg.L, 2) },
        thoraxDeg: round(s.mesure.thoraxDeg, 3),
        thoraxRotationDeg: round(s.mesure.thoraxRotationDeg, 3),
        bassinMm: round(s.mesure.bassinMm, 2),
        solMm: round(s.solMm, 3),
      },
    })),
    unites: {
      angleDeg: "degrés", horsAxeDeg: "écart entre l'axe de rotation mesuré et l'axe monde attendu, degrés",
      ecartHanchesMm: "hauteur du centre de hanche gauche moins celle du droit, mm",
      avanceHanchesMm: "avancée du centre de hanche gauche par rapport au droit, mm (positif : gauche devant)",
      sacrumHauteurMm: "hauteur du centre du sacrum au-dessus du milieu des centres de hanche, mm",
      sacrumAvanceMm: "avancée du centre du sacrum par rapport au milieu des centres de hanche, mm (négatif : derrière)",
      genouDeg: "flexion du genou, degrés (0 = jambe tendue)",
      thoraxDeg: "inclinaison du thorax par rapport à la verticale, degrés",
      thoraxRotationDeg: "rotation du thorax par rapport à la pose neutre, tous axes confondus, degrés",
      bassinMm: "hauteur du centre du bassin au-dessus du sol, mm",
      solMm: "hauteur du sommet osseux le plus bas, mm (0 = au sol)",
    },
    vues: vues.map(vue => {
      const camera = api.atlasView(vue, mouvement.cote);
      return {
        id: vue,
        label: api.atlasVueLabel(vue, mouvement.cote),
        azimutDeg: api.atlasAzimut(vue, mouvement.cote),
        camera: { position: camera.position.map(v => round(v, 4)), cible: camera.target, fovDeg: api.ATLAS_FOV },
        url: "?" + api.atlasQuery(state(vue, (frames - 1) >> 1)),
      };
    }),
    capture: {
      ...ATLAS_CAPTURE, frames, muscles,
      commande: `npm run build && node scripts/capture_atlas.mjs --mouvement ${id}${frames === api.ATLAS_FRAMES ? "" : ` --frames ${frames}`}${
        vues.length === manifest.views.length ? "" : ` --vues ${vues.join(",")}`}${muscles ? "" : " --sans-muscles"}`,
    },
    fichiers: {
      images: Object.fromEntries(vues.map(vue => [vue, measured.samples.map(s => frameFile(vue, s.index))])),
      gifs: Object.fromEntries(vues.map(vue => [vue, gifFile(vue)])),
      planche: PLANCHE_FILE,
      servis: [META_FILE, PLANCHE_FILE],
    },
  };
}

export const serializeMeta = (meta) => JSON.stringify(meta, null, 2) + "\n";

/** Page Markdown de la planche, entièrement dérivée de `meta.json` (déterministe). */
export function buildPlancheReadme(api, meta) {
  const m = meta.mouvement, a = meta.articulation, repere = atlasRepere(meta);
  const thorax = Math.max(...meta.frames.map(f => f.mesure.thoraxRotationDeg));
  const rows = meta.frames.map(f => `| ${f.index + 1} | ${api.atlasAngleLabel(f.angleDeg)} | ${api.atlasAngleLabel(f.mesure.angleDeg)} | ${
    fr(repere.valeur(f))} mm | ${fr(f.mesure.genouDeg.R)}° | ${fr(f.mesure.genouDeg.L)}° | ${fr(f.mesure.thoraxDeg)}° | ${fr(f.mesure.bassinMm)} mm |`);
  return [
    `# ${m.label}`,
    "",
    "[Atlas](../../README.md) · [Manifeste](../../manifest.json) · [Spécification](../../../spec-atlas-anatomique.md) · [Recherche biomécanique](../../../recherche-biomecanique/README.md)",
    "",
    "> Page générée par `scripts/capture_atlas.mjs` à partir de [`meta.json`](meta.json). Ne pas la modifier à la main.",
    "",
    `*${m.labelEn}* · nœud \`${a.noeud}\`, axe local \`${a.axeLocal}\` · priorité ${m.priorite} · ${meta.frames.length} images de ${
      api.atlasAngleLabel(meta.romDeg.manifeste[0])} à ${api.atlasAngleLabel(meta.romDeg.manifeste[1])}, ${meta.vues.length} vues.`,
    "",
    `![Planche : ${m.label}](${meta.fichiers.planche})`,
    "",
    "## Lecture",
    "",
    `- Convention de signe : ${a.signe}.`,
    `- Thorax : il garde l'orientation de la pose neutre sur toute la course (rotation maximale ${fr(thorax)}°, tous axes confondus).`,
    `- Provenance : ${meta.generation}`,
    `- Niveau de preuve : ${meta.niveauDePreuve}.`,
    "",
    "## Mesures sur le squelette",
    "",
    "Mesures prises sur le GLB réel posé par le moteur de l'application, hors navigateur",
    `(${meta.romDeg.methode}). ROM mesurée : ${api.atlasAngleLabel(meta.romDeg.mesuree[0])} à ${api.atlasAngleLabel(meta.romDeg.mesuree[1])}.`,
    "",
    `| Image | Angle commandé | Angle mesuré | ${repere.titre} | Genou droit | Genou gauche | Thorax | Hauteur du bassin |`,
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    `${repere.note} Genou : flexion, 0° = jambe tendue. Thorax : inclinaison par rapport à la verticale.`,
    "",
    "## Vues animées",
    "",
    `| ${meta.vues.map(v => v.label[0].toUpperCase() + v.label.slice(1)).join(" | ")} |`,
    `| ${meta.vues.map(() => "---").join(" | ")} |`,
    `| ${meta.vues.map(v => `![${v.label}](${meta.fichiers.gifs[v.id]})`).join(" | ")} |`,
    "",
    `Images fixes : ${meta.vues.map(v => `[${v.label}](${meta.fichiers.images[v.id][(meta.frames.length - 1) >> 1]})`).join(", ")} (une par image de la séquence, \`<vue>-<nn>.png\`).`,
    `Vue en direct dans l'application : \`${meta.vues[0].url}\`.`,
    "",
    "## Limites",
    "",
    ...meta.limites.map(l => `- ${l}`),
    "",
    "## Licences",
    "",
    `- ${meta.licence.attribution} (attribution obligatoire).`,
    `- Planche, images et mesures générées : ${meta.licence.assetsGeneres}.`,
    `- ${meta.licence.note}`,
    "",
    "## Régénérer",
    "",
    "```bash",
    meta.capture.commande,
    "```",
    "",
  ].join("\n");
}
