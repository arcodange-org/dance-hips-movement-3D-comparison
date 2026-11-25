// #203 — calibration probe (not in npm test): every leg-bone crossing of the pair figures, between partners and
// within one dancer, on the real GLB. The pair tests stop at the first crossing; this lists them all, grouped by
// figure, so that a figure can be re-tuned for a new knee floor (`FLEXION=<deg>`, default: the elected minimum).
//   node scripts/sonde_croisements_couple.mjs [figure regexp]   (FLEXION=7 for the former floor)
// REGLAGE tries a setting without touching the sources: a JSON list of [file, text, replacement], e.g.
//   REGLAGE='[["src/placement.ts", "z: 0.060, stagger", "z: 0.030, stagger"]]'
import { build } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import { fixture } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection } from "./mesh_intersections.mjs";
const root = new URL('../', import.meta.url).pathname;
const settings = JSON.parse(process.env.REGLAGE ?? '[]');
const tune = { name: 'reglage', setup(build) {
  build.onLoad({ filter: /src\/.*\.ts$/ }, args => {
    let text = readFileSync(args.path, 'utf8');
    for (const [file, from, to] of settings) if (args.path === root + file) {
      if (!text.includes(from)) throw new Error(`REGLAGE: « ${from} » absent de ${file}`);
      text = text.replace(from, to);
    }
    return { contents: text, loader: 'ts' };
  });
} };
const bundle = new URL(`./.sonde-croisements-bundle-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'idaPaire', 'marchePaire', 'sortieGarcon', 'sortieFille', 'placePaire']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: root },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent', plugins: settings.length ? [tune] : [] });
const api = await import(bundle.href); unlinkSync(bundle);
const ONLY = process.argv[2] ? new RegExp(process.argv[2]) : null;
const styles = m => Object.keys(api.STYLES).filter(k => api.movementAllowed(k, m));
const range = (from, to, step) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step);
const ida = (i, extra) => ({ movement: 'ida', ida: true, embrace: true, idaPaire: true, follower: !!i, ...extra });
// The configurations of the pair tests: test_quarts_paire (and its plexus replay), the sortie runners (reference, the
// two placements of test_placements, the plexus replay), test_ida_paire and test_marche_paire.
const tenths = n => Array.from({ length: n * 10 + 1 }, (_, i) => i / 10);
const SORTIE_PLACEMENTS = [{ placement: 'reference' }, { placement: 'quinconce' }, { placement: 'face' }, { placement: 'quinconce', plexus: true }];
const PAIR_CONFIGS = [{ placement: 'quinconce' }, { placement: 'reference' }, { placement: 'quinconce', plexus: true, contraposition: 1 }];
const tag = c => c.placement + (c.plexus ? '+plexus' : '');
const FIGURES = [
  ...[{ placement: 'quinconce' }, { placement: 'face' }, { placement: 'quinconce', plexus: true }].map(config => ({ name: `quarts ${tag(config)}`, dz: api.QUARTS_PAIR_DZ,
    beats: range(0, 3.875, .125), styles: styles('quarts'),
    options: (i, extra) => ({ movement: 'quarts', quarts: true, embrace: true, quartsPaire: true, follower: !!i, ...config, ...extra }) })),
  ...['line', 'right'].flatMap(sortieVariant => SORTIE_PLACEMENTS.map(config => ({ name: `sortie garçon ${sortieVariant} ${tag(config)}`, dz: api.SORTIE_GARCON_PAIR_DZ,
    beats: [...new Set([...tenths(5), .26, 2.83, 3.07, 4.25, 4.42, 4.87])].sort((a, b) => a - b), styles: styles('sortieG'),
    options: (i, extra) => ({ movement: 'sortieG', embrace: true, sortieVariant, follower: !!i, ...config, ...extra }) }))),
  ...['hook', 'back'].flatMap(sortieFilleVariant => SORTIE_PLACEMENTS.map(config => ({ name: `sortie fille ${sortieFilleVariant} ${tag(config)}`, dz: api.SORTIE_FILLE_PAIR_DZ,
    beats: [...new Set([...tenths(5), .26, 1.34, 1.68, 2.34, 2.42, 2.46, 2.53, 2.68, 2.83, 3.07, 3.24, 3.46, 3.48, 3.68, 3.85, 3.95, 4.16, 4.25, 4.34, 4.42, 4.68, 4.87])].sort((a, b) => a - b),
    styles: styles('sortieF'), options: (i, extra) => ({ movement: 'sortieF', embrace: true, sortieFilleVariant, follower: !!i, ...config, ...extra }) }))),
  ...PAIR_CONFIGS.map(config => ({ name: `ida ${tag(config)}`, dz: api.IDA_PAIR_DZ, beats: range(0, 7.875, .125), styles: styles('ida'),
    options: (i, extra) => ida(i, { ...config, ...extra }) })),
  ...[...['avance', 'recule', 'double'].map(marche => [`marche ${marche}`, api.MARCHE_BEATS, { marche }, styles('ida')]),
    ...[{ side: 'R', back: false }, { side: 'L', back: true }, { side: 'R', back: true }].map(v => [`marche ida ${v.side}${v.back ? ' arrière' : ''}`, api.IDA_BEATS, { idaVariant: v },
      styles('ida').filter(k => !api.STYLE_MOVEMENTS[k])])]
    .flatMap(([label, beats, extra, list]) => PAIR_CONFIGS.map(config => ({ name: `${label} ${tag(config)}`, dz: api.MARCHE_PAIR_DZ, beats: range(0, beats, .125), styles: list,
      options: (i, more) => ida(i, { ...config, ...extra, ...more }) }))),
  ...PAIR_CONFIGS.map(config => ({ name: `sur place ${tag(config)}`, dz: api.PLACE_PAIR_DZ, beats: range(0, 3.9, .1), styles: Object.keys(api.STYLES), amps: [.5, 1, 1.5, 2],
    options: (i, extra) => ({ embrace: true, placePaire: true, follower: !!i, ...config, ...extra }) })),
].filter(f => !ONLY || ONLY.test(f.name));
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
for (const figure of FIGURES) {
  const hits = new Map(); let poses = 0;
  for (const styleKey of figure.styles) for (const amp of figure.amps ?? [.5, 1, 2]) {
    const pair = [fixture(api, { offset: [0, 0, -figure.dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, figure.dz] })];
    for (const beat of figure.beats) {
      pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, figure.options(i, { styleKey, amp })));
      const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
      const add = (key) => { const h = hits.get(key) ?? []; h.push(`${styleKey} ${amp} @${+beat.toFixed(3)}`); hits.set(key, h); };
      for (const a of boneNames) for (const b of boneNames) if (meshIntersection(meshes[0][a], meshes[1][b])) add(`entre : guideur ${a} / suiveuse ${b}`);
      for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
        for (const b of boneNames.filter(n => n.endsWith('_R'))) if (meshIntersection(own[a], own[b])) add(`${role ? 'suiveuse' : 'guideur'} seul : ${a} / ${b}`);
      poses++;
    }
  }
  console.log(`\n== ${figure.name} : ${poses} poses, ${[...hits.values()].reduce((n, h) => n + h.length, 0)} croisements`);
  for (const [key, list] of hits) console.log(`  ${key} (${list.length}) : ${list.slice(0, 8).join(', ')}${list.length > 8 ? ' …' : ''}`);
}
