// #40 (docs/cadre/spec-implementation.md, option A): the dance frame closes on the real GLB.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, snapshot } from "./pose_fixture.mjs";
const bundle = new URL("./.test-cadre-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'sortieGarcon', 'sortieFille', 'idaPaire', 'placePaire', 'cadre']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const world = o => o.getWorldPosition(new THREE.Vector3());

// Pure IK: lengths kept, target reached when in reach, clamped on the shoulder line otherwise,
// elbow on the pole's side.
{
  const S = new THREE.Vector3(0, 0, 0), P = new THREE.Vector3(0, -1, 0);
  const near = api.solveArm(S, new THREE.Vector3(0.3, 0, 0.1), 0.26, 0.24, P);
  assert(Math.abs(near.elbow.distanceTo(S) - 0.26) < 1e-9 && Math.abs(near.elbow.distanceTo(near.hand) - 0.24) < 1e-9);
  assert(near.hand.distanceTo(new THREE.Vector3(0.3, 0, 0.1)) < 1e-9 && !near.clamped && near.elbow.y < 0);
  const far = api.solveArm(S, new THREE.Vector3(1, 0, 0), 0.26, 0.24, P);
  assert(far.clamped && Math.abs(far.hand.length() - (0.5 - api.CADRE.slack)) < 1e-9 && Math.abs(far.hand.y) < 1e-9);
  console.log('PASS IK des bras : longueurs constantes, cible atteinte ou bornée, coude du côté du pôle');
}

// The frame in the pair figures (quinconce, plexus as in the app): hands on their contact sites,
// segments of constant length, forearms along the partner's flank (not through the torso), legs and
// regression fingerprints untouched (the arms are not part of `snapshot`).
const cases = [
  ['sortieG', api.SORTIE_GARCON_PAIR_DZ, 5, { movement: 'sortieG' }],
  ['sortieF', api.SORTIE_FILLE_PAIR_DZ, 5, { movement: 'sortieF' }],
  ['quarts', api.QUARTS_PAIR_DZ, 16, { movement: 'quarts', quarts: true, quartsPaire: true }],
  ['ida', api.IDA_PAIR_DZ, 8, { movement: 'ida', ida: true, idaPaire: true }],
  ['sur place', api.PLACE_PAIR_DZ, 4, { movement: 'none', placePaire: true }],
];
for (const [label, dz, beats, opt] of cases) {
  const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
  let worst = 0, clamped = 0, solved = 0, depth = 0, released = 0, lowest = Infinity, leaderReleased = 0, lean = 0, leans = 0;
  for (let b = 0; b <= beats; b += .25) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, b, { ...opt, embrace: true, placement: 'quinconce', follower: !!i, styleKey: 'kizomba', amp: 1, plexus: true }));
    const before = pair.map(f => snapshot(f.r));
    pair.forEach((f, i) => {
      const res = api.solveFrame(f.r, pair[1 - i].r, !!i);
      for (const s of ['L', 'R']) {
        const S = world(f.r['armU' + s]), E = world(f.r['armF' + s]);
        assert(Math.abs(S.distanceTo(E) - 0.26) < 1e-9 && Math.abs(E.distanceTo(res[s].hand) - 0.24) < 1e-9, `${label} ${b}: arm lengths`);
        // The hand sphere is where the solver put it.
        assert(f.r['armF' + s].localToWorld(new THREE.Vector3(...api.ARM_JOINTS.hand)).distanceTo(res[s].hand) < 1e-9, `${label} ${b}: hand placed`);
        if (res[s].released) released++;
        // #178: the leader's right arm is never lowered, also when his hand has left the follower's back:
        // the hand stays above his waist (height in his chest frame; along the body it was at -0.42).
        if (!i && s === 'R') {
          lowest = Math.min(lowest, f.r.chest.worldToLocal(res[s].hand.clone()).y);
          if (res[s].released) leaderReleased++;
        }
        // #180: the follower's left elbow seeks the leader's right arm (distance to his upper arm, when her hand
        // is on his shoulder).
        if (i && s === 'L' && !res[s].clamped && !res[s].released) {
          const a = world(pair[0].r.armUR), b = world(pair[0].r.armFR), ab = b.clone().sub(a);
          const t = Math.max(0, Math.min(1, res[s].elbow.clone().sub(a).dot(ab) / ab.lengthSq()));
          lean += res[s].elbow.distanceTo(a.addScaledVector(ab, t)); leans++;
        }
        if (res[s].clamped) clamped++; else worst = Math.max(worst, res[s].hand.distanceTo(res[s].target));
        solved++;
        const pts = [];
        for (let k = 0; k <= 20; k++) pts.push(S.clone().lerp(E, k / 20), E.clone().lerp(res[s].hand, k / 20));
        for (const p of pts) if (p.distanceTo(res[s].hand) > .04) {
          const q = pair[1 - i].r.chest.worldToLocal(p.clone());
          depth = Math.max(depth, Math.min(.15 - Math.abs(q.x), .13 - Math.abs(q.y), .09 - Math.abs(q.z)));
        }
      }
    });
    pair.forEach((f, i) => snapshot(f.r).forEach((v, n) => assert(Math.abs(v - before[i][n]) < 1e-12, `${label} ${b}: frame leaves the body pose`)));
  }
  assert(worst < 1e-6, `${label}: hands on their sites when in reach (${worst})`);
  // In the sorties the couple opens (no chasing of the plexus contact by leaning, #93): the frame
  // stretches and more arms reach their length.
  assert(clamped <= (label.startsWith('sortie') ? .25 : .1) * solved, `${label}: few clamped arms (${clamped}/${solved})`);
  // In the open sorties an arm at its length may graze the partner's side (#93).
  const deep = label.startsWith('sortie') ? .03 : .015;
  assert(depth <= deep, `${label}: forearms along the partner's flank, at most ${deep * 100} cm into the torso box (${depth})`);
  assert(released <= (label.startsWith('sortie') ? .2 : 0) * solved, `${label}: released hands (${released}/${solved})`);
  assert(lowest >= -0.15, `${label}: the leader's right hand comes down to ${(lowest * 100).toFixed(1)} cm in his chest frame (#178: never lowered)`);
  console.log(`PASS cadre ${label} : mains sur leurs sites, ${clamped}/${solved} bras bornés, ${released} mains lâchées, au plus ${(depth * 100).toFixed(1)} cm dans le torse du partenaire ; ` +
    `main droite du guideur jamais plus bas que ${(lowest * 100).toFixed(0)} cm dans le repère de sa poitrine (épaule à +10 ; ${leaderReleased} fois hors du dos) ; coude gauche de la suiveuse à ${leans ? (lean / leans * 100).toFixed(1) : '—'} cm du bras droit du guideur en moyenne (${leans} poses, main sur son épaule)`);
}
