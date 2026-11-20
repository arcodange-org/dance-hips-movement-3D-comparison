// Audit de conformité (20 nov. 2026) — sonde indépendante, hors `npm test`.
// Mesure sur le GLB réel, pour chaque figure en paire telle que l'app la montre (quinconce, plexus,
// contraposition 1 ; sur place : écartement PAIR_DZ sans placement, comme l'app) :
//   écart avant-arrière des bassins (décalage latéral retiré), hauteurs bassin et buste, écart des
//   repères de poitrine, longueurs de pas, croisements d'os des jambes, glissement des pieds porteurs,
//   instants des transferts d'appui par rapport aux temps de la musique.
// Usage : node scripts/audit_conformite.mjs [cas…] [--bones] [--json out.json]
// Voir docs/audit-conformite-2026-11-20.md.
import { buildSync } from "esbuild";
import { unlinkSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection } from "./mesh_intersections.mjs";

const bundle = new URL(`./.audit-conformite-${process.pid}.mjs`, import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'idaPaire', 'sortieGarcon', 'sortieFille', 'music/patterns', 'music/scheduler']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

const args = process.argv.slice(2);
const withBones = args.includes('--bones');
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const STYLES = Object.keys(api.STYLES);
const AMPS = [0.5, 1, 2];
const app = { placement: 'quinconce', plexus: true, contraposition: 1 };
// Same options as Rig.tsx (embrace, placement given ⇒ quartsPaire / idaPaire / plexus).
const CASES = {
  sortieG_line: { dz: api.SORTIE_GARCON_PAIR_DZ, beats: 5, o: { movement: 'sortieG', sortieVariant: 'line', ...app } },
  sortieG_right: { dz: api.SORTIE_GARCON_PAIR_DZ, beats: 5, o: { movement: 'sortieG', sortieVariant: 'right', ...app } },
  sortieF_hook: { dz: api.SORTIE_FILLE_PAIR_DZ, beats: 5, o: { movement: 'sortieF', sortieFilleVariant: 'hook', ...app } },
  sortieF_back: { dz: api.SORTIE_FILLE_PAIR_DZ, beats: 5, o: { movement: 'sortieF', sortieFilleVariant: 'back', ...app } },
  quarts: { dz: api.QUARTS_PAIR_DZ, beats: 16, o: { movement: 'quarts', quarts: true, quartsPaire: true, ...app } },
  ida: { dz: api.IDA_PAIR_DZ, beats: 8, o: { movement: 'ida', ida: true, idaPaire: true, ...app } },
  // On the spot: the app gives no placement (hasPlacement false), so no plexus either.
  surPlace: { dz: api.PAIR_DZ, beats: 8, o: { movement: 'none' } },
  // Other pair movements without placement (the app passes reverse to the follower in the corridinho).
  temps3: { dz: api.PAIR_DZ, beats: 6, o: { movement: 'temps3', temps3: true } },
  corridinho: { dz: api.PAIR_DZ, beats: 8, o: { movement: 'corridinho', corridinho: true }, follower: { reverse: true } },
};
const selected = args.filter(a => CASES[a]);
const caseKeys = selected.length ? selected : Object.keys(CASES).filter(k => k !== 'temps3' && k !== 'corridinho');

const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const fwd = f => new THREE.Vector3(0, 0, 1).applyQuaternion(f.r.root.getWorldQuaternion(new THREE.Quaternion()));
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(n => ['L', 'R'].map(s => n + '_' + s));
const restOf = f => ({ L: f.model.legs.L.rest, R: f.model.legs.R.rest });
const stanceOf = m => (m.legs.L.hipX - m.legs.L.rest.x + m.legs.R.rest.x - m.legs.R.hipX) / 2;
const range = a => Math.max(...a) - Math.min(...a);
const cm = v => +(v * 100).toFixed(1);

function sampleFeet(key, beat, follower, f, amp) {
  const c = CASES[key].o, off = api.placementOffset(c.placement, amp), rest = restOf(f), st = stanceOf(f.model);
  if (key.startsWith('sortieG')) return api.sampleSortieGarcon(beat, follower, rest, c.sortieVariant, api.DEFAULT_SORTIE_CONTRA, off, api.placementScale(amp), st);
  if (key.startsWith('sortieF')) return api.sampleSortieFille(beat, follower, rest, c.sortieFilleVariant, off, api.placementScale(amp), st);
  if (key === 'quarts') return api.sampleQuartsPaire(beat, follower, rest, off, st);
  if (key === 'ida') return api.sampleIdaPaire(beat, follower, rest, off, st);
  return null;
}
/** Steps of a dancer from the figure sampler: displacement of each foot between two rests (cm). */
function steps(key, f, follower, amp) {
  const beats = CASES[key].beats, dt = 1 / 128, out = [];
  for (const s of ['L', 'R']) {
    let last = null, start = null, moving = false, t0 = 0;
    for (let b = 0; b <= beats + 1e-9; b += dt) {
      const p = sampleFeet(key, b, follower, f, amp).feet[s];
      if (last) {
        const d = Math.hypot(p.x - last.x, p.z - last.z);
        if (d > 1e-7 && !moving) { moving = true; start = last; t0 = b - dt; }
        else if (d <= 1e-7 && moving) { moving = false; out.push({ foot: s, from: +t0.toFixed(2), to: +b.toFixed(2), cm: cm(Math.hypot(p.x - start.x, p.z - start.z)) }); }
      }
      last = { x: p.x, z: p.z };
    }
  }
  return out.sort((a, b) => a.from - b.from);
}

function measure(key, styleKey, amp, { dt = 1 / 32, bones = false, boneDt = 1 / 8 } = {}) {
  const C = CASES[key];
  const pair = [fixture(api, { offset: [0, 0, -C.dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, C.dz] })];
  const opts = i => ({ ...C.o, ...(i ? C.follower : {}), styleKey, amp, embrace: true, follower: !!i });
  const rows = [];
  const prevContact = [{}, {}];
  const slide = [{ L: 0, R: 0 }, { L: 0, R: 0 }];
  const slideMax = [{ L: 0, R: 0 }, { L: 0, R: 0 }];
  let boneHits = [], bonePoses = 0; const slideEvents = [];
  const n = Math.round(C.beats / dt);
  for (let k = 0; k <= n; k++) {
    const beat = k * dt;
    const stats = pair.map((f, i) => api.applyPose(f.r, f.model, beat, opts(i)));
    const P = pair.map(f => world(f, 'pelvis')), H = pair.map(f => world(f, 'chest'));
    // Front-back axis: where the two pelvises face each other (mean of leader forward and −follower forward).
    const axis = fwd(pair[0]).sub(fwd(pair[1])).setY(0).normalize();
    const d = P[1].clone().sub(P[0]).setY(0);
    const gap = d.dot(axis), lateral = Math.sqrt(Math.max(0, d.lengthSq() - gap * gap));
    const chestGap = world(pair[0], 'contactChest').distanceTo(world(pair[1], 'contactChest'));
    rows.push({ beat, gap, lateral, dist: d.length(), py: P.map(p => p.y), cy: H.map(p => p.y), chestGap,
      loadR: stats.map(s => s.loadR) });
    // Sliding: contact vertices (sole ≤ 1 mm) of a weight-bearing foot that move between samples.
    pair.forEach((f, i) => {
      for (const s of ['L', 'R']) {
        const load = stats[i]['load' + s];
        const m = f.r['foot' + s].matrixWorld, sole = f.model.legs[s].sole, now = new Map();
        for (let v = 0; v < sole.length; v += 3) { const w = sole[v].clone().applyMatrix4(m); if (w.y <= 0.001) now.set(v, w); }
        const before = prevContact[i][s];
        if (before && load > 0.05) {
          let moved = 0, count = 0, cx = 0, cz = 0, px = 0, pz = 0;
          for (const [v, w] of now) { const b = before.get(v); if (!b) continue; count++; cx += w.x; cz += w.z; px += b.x; pz += b.z; }
          if (count) moved = Math.hypot(cx / count - px / count, cz / count - pz / count);
          slide[i][s] += moved; slideMax[i][s] = Math.max(slideMax[i][s], moved);
          if (moved > 2e-4) slideEvents.push({ beat, role: i ? 'suiveur' : 'leader', foot: s, mm: +(moved * 1000).toFixed(2), load: +load.toFixed(2), contacts: count });
        }
        prevContact[i][s] = now;
      }
    });
    if (bones && Math.abs(beat / boneDt - Math.round(beat / boneDt)) < 1e-9) {
      const meshes = pair.map(f => Object.fromEntries(boneNames.map(nm => [nm, transformedMesh(f.r[nm])])));
      for (const a of boneNames) for (const b of boneNames)
        if (meshIntersection(meshes[0][a], meshes[1][b])) boneHits.push({ beat, between: 'partenaires', a: 'leader ' + a, b: 'suiveur ' + b });
      meshes.forEach((own, role) => {
        for (const a of boneNames.filter(x => x.endsWith('_L'))) for (const b of boneNames.filter(x => x.endsWith('_R')))
          if (meshIntersection(own[a], own[b])) boneHits.push({ beat, between: role ? 'suiveur' : 'leader', a, b });
      });
      bonePoses++;
    }
  }
  // Support transfers (prescribed loads): windows where loadR moves, crossing of 0.5 and arrival.
  const transfers = [0, 1].map(i => {
    const out = []; let start = null;
    for (let k = 1; k < rows.length; k++) {
      const a = rows[k - 1].loadR[i], b = rows[k].loadR[i];
      const changing = Math.abs(b - a) > 1e-6;
      if (changing && start === null) start = rows[k - 1].beat;
      if (!changing && start !== null) { out.push({ start, end: rows[k - 1].beat }); start = null; }
      if ((a - 0.5) * (b - 0.5) < 0) {
        const t = rows[k - 1].beat + (0.5 - a) / (b - a) * dt;
        out.push({ cross: t, to: b > a ? 'R' : 'L' });
      }
    }
    if (start !== null) out.push({ start, end: rows.at(-1).beat });
    return out;
  });
  const crossings = transfers.map(list => list.filter(x => 'cross' in x).map(x => x.cross));
  const offBeat = t => Math.abs(t - Math.round(t));
  return {
    key, styleKey, amp,
    gap: { min: cm(Math.min(...rows.map(r => r.gap))), max: cm(Math.max(...rows.map(r => r.gap))), range: cm(range(rows.map(r => r.gap))) },
    lateral: { min: cm(Math.min(...rows.map(r => r.lateral))), max: cm(Math.max(...rows.map(r => r.lateral))) },
    pelvisY: [0, 1].map(i => cm(range(rows.map(r => r.py[i])))),
    chestY: [0, 1].map(i => cm(range(rows.map(r => r.cy[i])))),
    chestGap: { min: cm(Math.min(...rows.map(r => r.chestGap))), max: cm(Math.max(...rows.map(r => r.chestGap))) },
    slideEvents,
    slide: [0, 1].map(i => ({ L: +(slide[i].L * 1000).toFixed(1), R: +(slide[i].R * 1000).toFixed(1), maxStepMm: +(Math.max(slideMax[i].L, slideMax[i].R) * 1000).toFixed(2) })),
    crossings: crossings.map(c => c.map(t => +t.toFixed(3))),
    crossOffBeat: crossings.map(c => c.length ? +Math.max(...c.map(offBeat)).toFixed(3) : null),
    windows: transfers.map(list => list.filter(x => 'start' in x).map(x => [+x.start.toFixed(3), +x.end.toFixed(3)])),
    steps: sampleFeet(key, 0, false, pair[0], amp) ? [steps(key, pair[0], false, amp), steps(key, pair[1], true, amp)] : null,
    bones: bones ? { poses: bonePoses, hits: boneHits.length, first: boneHits.slice(0, 6),
      beats: [...new Set(boneHits.map(h => h.beat))].length } : null,
    series: key && amp === 1 && styleKey === 'kizomba' ? rows.filter((_, k) => k % 8 === 0).map(r => ({ b: r.beat, gap: cm(r.gap), lat: cm(r.lateral), py: r.py.map(cm), chest: cm(r.chestGap) })) : undefined,
  };
}

const results = [];
for (const key of caseKeys) for (const styleKey of STYLES) for (const amp of AMPS) {
  const r = measure(key, styleKey, amp, { bones: withBones });
  results.push(r);
  console.log(JSON.stringify({ key, styleKey, amp, gap: r.gap, lateral: r.lateral, pelvisY: r.pelvisY, chestY: r.chestY,
    chestGap: r.chestGap, crossOffBeat: r.crossOffBeat, slide: r.slide, bones: r.bones && { hits: r.bones.hits, beats: r.bones.beats, poses: r.bones.poses, first: r.bones.first[0] } }));
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(results, null, 1));

// R13 (ginga, #42) : à chaque instant où la figure porte tout le poids sur un pied, le déhanché du style
// (appui du style, horloge) est-il du même côté ? Mesure indépendante du GLB (échantillonneurs seuls).
if (args.includes('--appuis')) {
  const f = fixture(api, {});
  for (const key of ['sortieG_line', 'sortieF_hook', 'quarts', 'ida']) for (const styleKey of ['kizomba', 'semba', 'kompa', 'tarraxinha', 'suave', 'zouk']) {
    let full = 0, same = 0;
    for (const follower of [false, true]) for (let b = 0; b < CASES[key].beats; b += 1 / 64) {
      const s = sampleFeet(key, b, follower, f, 1); const loadR = s.loadR;
      if (loadR > 0.02 && loadR < 0.98) continue;
      const style = api.STYLES[styleKey].support(b); if (Math.abs(style) < 0.05) continue;
      full++; if ((style > 0) === (loadR > 0.5)) same++;
    }
    console.log(JSON.stringify({ appuis: key, styleKey, accord: +(same / full).toFixed(2), echantillons: full }));
  }
}

// R16 (tarraxinha sur place, #61) : avancée de chaque hanche (articulation coxo-fémorale) vers le
// partenaire, par rapport au centre des deux hanches, et alternance G/D dans le plan horizontal.
if (args.includes('--hanches')) {
  for (const styleKey of STYLES) {
    const f = fixture(api, {});
    let min = { L: Infinity, R: Infinity }, max = { L: -Infinity, R: -Infinity }, opposite = 0, n = 0;
    for (let b = 0; b < 4; b += 1 / 32) {
      api.applyPose(f.r, f.model, b, { styleKey, amp: 1, embrace: true });
      const L = world(f, 'hipL'), R = world(f, 'hipR'), c = L.clone().add(R).multiplyScalar(0.5);
      const zl = L.z - c.z, zr = R.z - c.z;
      min.L = Math.min(min.L, zl); max.L = Math.max(max.L, zl); min.R = Math.min(min.R, zr); max.R = Math.max(max.R, zr);
      n++; if (zl * zr < 0) opposite++;
    }
    console.log(JSON.stringify({ hanches: styleKey, avanceG_cm: [cm(min.L), cm(max.L)], avanceD_cm: [cm(min.R), cm(max.R)], alternance: +(opposite / n).toFixed(2) }));
  }
}
