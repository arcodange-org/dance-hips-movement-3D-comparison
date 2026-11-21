// #127, #128 — probe of the leader's virgula in the sortie fille's hook variant and in the pair ida e volta
// (calibration, not a test).
// Counts leg-bone crossings and sole overlaps over the affected beats, on the real GLB.
// Usage: node scripts/search_virgula.mjs            (default constants)
//        V='{"pelvis":0.2,"knee":0.6}' STYLES=kizomba,suave AMPS=0.5,1,2 PLACES=quinconce PLEXUS=0,1 STEP=0.04 node scripts/search_virgula.mjs
//        FIGURE=ida probes the ida e volta's virgula (#128; UNTIL=2 by default, its first slot);
//        OFF=1 probes the straight G1 (before #127); INSERT=1 probes the ida inserted at position 2; FACTS=1 prints the geometry at beats 0, 1, 2.
import { buildSync } from "esbuild"; import { unlinkSync } from "node:fs"; import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.search-virgula-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'sortieFille', 'idaPaire'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname, define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
for (const constants of [api.SORTIE_FILLE_VIRGULA, api.IDA_VIRGULA]) Object.assign(constants, JSON.parse(process.env.V ?? '{}'));
const list = (name, fallback) => (process.env[name] ?? fallback).split(',');
const ida = process.env.FIGURE === 'ida';
const styles = list('STYLES', Object.keys(api.STYLES).filter(k => ida || api.movementAllowed(k, 'sortieF')).join(','));
const amps = list('AMPS', '0.5,1,2').map(Number), places = list('PLACES', 'reference,quinconce,face'), plexus = list('PLEXUS', '0,1').map(v => v === '1');
const step = +(process.env.STEP ?? 0.04), until = +(process.env.UNTIL ?? (ida ? 2 : 3.2)), insert = process.env.INSERT === '1';
const dz = ida ? api.IDA_PAIR_DZ : api.SORTIE_FILLE_PAIR_DZ;
const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const bones = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(n => ['L', 'R'].map(s => n + '_' + s));
const hull = (f, s) => footHull(f.model.legs[s].sole.map(p => p.clone().applyMatrix4(f.r['foot' + s].matrixWorld)));
const world = (f, n) => f.r[n].getWorldPosition(new THREE.Vector3());
const figure = ida ? { movement: 'ida', ida: true, idaPaire: true, idaVariant: { side: 'L', back: false, virgula: process.env.OFF !== '1' } }
  : { movement: 'sortieF', sortieFilleVariant: 'hook', sortieInsert: insert, sortieVirgula: process.env.OFF !== '1' };
const pose = (beat, extra) => pair.map((f, i) => api.applyPose(f.r, f.model, beat, { ...figure, embrace: true, follower: !!i, ...extra }));

if (process.env.FACTS === '1') for (const placement of places) for (const beat of [0, 1, ida ? 1.5 : 2]) {
  pose(beat, { placement, plexus: true });
  const cm = v => `(${(v.x * 100).toFixed(1)}, ${(v.z * 100).toFixed(1)})`;
  console.log(placement, 'beat', beat, 'leader G', cm(world(pair[0], 'footL')), 'D', cm(world(pair[0], 'footR')), 'root', cm(world(pair[0], 'root')),
    '| follower G', cm(world(pair[1], 'footL')), 'D', cm(world(pair[1], 'footR')), 'root', cm(world(pair[1], 'root')));
}

let bone = 0, sole = 0, poses = 0; const where = {};
const note = (key, beat) => { where[key] ??= []; if (where[key].length < 4) where[key].push(beat.toFixed(2)); };
for (const styleKey of styles) for (const amp of amps) for (const placement of places) for (const px of plexus)
  for (let beat = 0; beat <= until + 1e-9; beat += step) {
    pose(beat, { styleKey, amp, placement, plexus: px }); poses++;
    const meshes = pair.map(f => Object.fromEntries(bones.map(n => [n, transformedMesh(f.r[n])])));
    for (const a of bones) for (const b of bones) if (meshIntersection(meshes[0][a], meshes[1][b])) { bone++; note(`${styleKey} ${amp} ${placement}${px ? ' plexus' : ''}: leader ${a} / follower ${b}`, beat); }
    for (const [role, own] of meshes.entries()) for (const a of bones.filter(n => n.endsWith('_L'))) for (const b of bones.filter(n => n.endsWith('_R')))
      if (meshIntersection(own[a], own[b])) { bone++; note(`${styleKey} ${amp} ${placement}${px ? ' plexus' : ''}: ${role ? 'follower' : 'leader'} ${a} / ${b}`, beat); }
    const hulls = pair.flatMap(f => ['L', 'R'].map(s => hull(f, s)));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (footHullsOverlap(hulls[i], hulls[j])) { sole++; note(`${styleKey} ${amp} ${placement}${px ? ' plexus' : ''}: soles ${'lGlDfGfD'.slice(2 * i, 2 * i + 2)} / ${'lGlDfGfD'.slice(2 * j, 2 * j + 2)}`, beat); }
  }
console.log(JSON.stringify(ida ? api.IDA_VIRGULA : api.SORTIE_FILLE_VIRGULA), ida ? 'ida' : insert ? 'insertion' : '', '→', poses, 'poses,', bone, 'bone crossings,', sole, 'sole overlaps');
for (const [key, beats] of Object.entries(where).slice(0, +(process.env.SHOW ?? 25))) console.log('  ', key, '@', beats.join(' '));
