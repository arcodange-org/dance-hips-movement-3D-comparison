// #209 — survey (not in npm test) of rule R45, « le ginga se fond dans le mouvement »: in every step of the figures, does the
// pelvis go with the foot (one gesture) or after it (a step, then the hip)? Real GLB, kizomba, amplitude 1, the couple in
// quinconce, each dancer in turn; and the « 1 2 » danced alone (kizomba, semba).
// A step: a foot travelling at least 8 cm over the floor. Its way along its travel, and the pelvis's way along the same
// direction from where it was when the foot left to where it is half a beat after the foot landed: when each reaches
// half its way (lag, beats), and how much of the foot's way is done when the pelvis has done a tenth of its own. Steps
// whose pelvis travels less than 3 cm that way are listed apart (a touch, a rock: the body is not carried).
//   node scripts/sonde_geste_hanche.mjs [figure regexp]
import { build } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const root = new URL('../', import.meta.url).pathname;
const bundle = new URL(`./.sonde-geste-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'idaPaire', 'marchePaire', 'sortieGarcon', 'sortieFille', 'placePaire', 'umDois']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: root },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
if (process.env.GESTE) api.setUmDoisGesture(process.env.GESTE);
const ONLY = process.argv[2] ? new RegExp(process.argv[2]) : null;
const STEP = 1 / 32;
const ida = (i, extra) => ({ movement: 'ida', ida: true, embrace: true, idaPaire: true, follower: !!i, placement: 'quinconce', ...extra });
const FIGURES = [
  { name: '« 1 2 » seul, kizomba', solo: true, beats: 8, options: () => ({ styleKey: 'kizomba' }) },
  { name: '« 1 2 » seul, semba', solo: true, beats: 8, options: () => ({ styleKey: 'semba' }) },
  { name: 'quart de tour en couple', dz: api.QUARTS_PAIR_DZ, beats: 8, options: i => ({ movement: 'quarts', quarts: true, embrace: true, quartsPaire: true, follower: !!i, placement: 'quinconce' }) },
  { name: 'sortie garçon', dz: api.SORTIE_GARCON_PAIR_DZ, beats: 5, options: i => ({ movement: 'sortieG', embrace: true, sortieVariant: 'line', follower: !!i, placement: 'quinconce' }) },
  { name: 'sortie fille (crochet)', dz: api.SORTIE_FILLE_PAIR_DZ, beats: 5, options: i => ({ movement: 'sortieF', embrace: true, sortieFilleVariant: 'hook', follower: !!i, placement: 'quinconce' }) },
  { name: 'sortie fille (recul)', dz: api.SORTIE_FILLE_PAIR_DZ, beats: 5, options: i => ({ movement: 'sortieF', embrace: true, sortieFilleVariant: 'back', follower: !!i, placement: 'quinconce' }) },
  { name: 'ida e volta en couple', dz: api.IDA_PAIR_DZ, beats: 8, options: i => ida(i) },
  ...['avance', 'recule', 'double'].map(marche => ({ name: `marche ${marche}`, dz: api.MARCHE_PAIR_DZ, beats: api.MARCHE_BEATS, options: i => ida(i, { marche }) })),
  { name: 'sur place en couple', dz: api.PLACE_PAIR_DZ, beats: 4, options: i => ({ embrace: true, placePaire: true, follower: !!i, placement: 'quinconce' }) },
].filter(f => !ONLY || ONLY.test(f.name));
const flat = v => new THREE.Vector2(v.x, v.z);
const rows = [];
for (const figure of FIGURES) {
  const dancers = figure.solo ? [fixture(api)] : [fixture(api, { offset: [0, 0, -figure.dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, figure.dz] })];
  const n = Math.round(figure.beats / STEP);
  // Sampled once per dancer: the pelvis and both ankles on the floor plane.
  const tracks = dancers.map((f, i) => Array.from({ length: n + 1 }, (_, k) => {
    api.applyPose(f.r, f.model, k * STEP, { amp: 1, styleKey: 'kizomba', ...figure.options(i) });
    f.r.root.updateWorldMatrix(true, true);
    const w = o => flat(o.getWorldPosition(new THREE.Vector3()));
    return { pelvis: w(f.r.pelvis), L: w(f.r.footL), R: w(f.r.footR) };
  }));
  tracks.forEach((track, i) => {
    const who = figure.solo ? 'seul' : i ? 'suiveuse' : 'guideur';
    for (const side of ['L', 'R']) {
      // Flights: runs of samples where the foot moves more than 1 mm per sample.
      let k = 0;
      while (k < n) {
        if (track[k + 1][side].distanceTo(track[k][side]) < 1e-3) { k++; continue; }
        const a = k; while (k < n && track[k + 1][side].distanceTo(track[k][side]) >= 1e-3) k++;
        if (k === a) { k++; continue; }
        const b = k, travel = track[b][side].clone().sub(track[a][side]);
        if (travel.length() < 0.08) continue;
        const dir = travel.clone().normalize(), end = Math.min(n, b + Math.round(0.5 / STEP));
        const along = (v, from) => v.clone().sub(from).dot(dir);
        const pelvisWay = track.slice(a, end + 1).map(s => along(s.pelvis, track[a].pelvis));
        const pelvisTotal = pelvisWay[pelvisWay.length - 1];
        const footWay = track.slice(a, end + 1).map(s => along(s[side], track[a][side]) / travel.length());
        const half = (way, total) => way.findIndex(v => v / total >= 0.5);
        const row = { figure: figure.name, danseur: who, pied: side, temps: [+(a * STEP).toFixed(2), +(b * STEP).toFixed(2)],
          pied_cm: +(travel.length() * 100).toFixed(0), bassin_cm: +(pelvisTotal * 100).toFixed(1) };
        if (pelvisTotal > 0.03) {
          const fh = half(footWay, 1), ph = half(pelvisWay, pelvisTotal), starts = pelvisWay.findIndex(v => v / pelvisTotal >= 0.1);
          Object.assign(row, { decalage_temps: +((ph - fh) * STEP).toFixed(2), piedQuandLeBassinPart: +footWay[starts].toFixed(2) });
        }
        rows.push(row);
      }
    }
  });
}
for (const r of rows) console.log(JSON.stringify(r));
