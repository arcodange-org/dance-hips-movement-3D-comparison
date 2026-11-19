import { build } from 'esbuild';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Mutation hooks affect only an in-memory build; tracked production files are never edited.
const mutations = {
  nan: ['oracle.ts', 'rootLocalYaw, chestLocalYaw, nominalRootX, nominalRootZ', 'rootLocalYaw: Number.NaN, chestLocalYaw, nominalRootX, nominalRootZ'],
  jump: ['oracle.ts', 'smooth(within / 1.2)', '(within < .6 ? 0 : 1)'],
  reverse: ['styles.ts', 'footL: { x: out.footR.x, z: -out.footR.z, yaw: -out.footR.yaw },',
    'footL: { x: out.footR.x + (q === 3 && half === 1 ? .10 : 0), z: -out.footR.z, yaw: -out.footR.yaw },'],
  torso: ['styles.ts', 'upperYaw: th0 + ph * (Math.PI / 2),',
    'upperYaw: th0 + ph * (Math.PI / 2) + .20 * Math.sin(2 * Math.PI * ph),'],
  world: ['styles.ts', 'r.pelvis.rotation.y = 0.03 * s * a;',
    'r.pelvis.rotation.y = 0.03 * s * a + .15;'],
};
export async function loadOracleApi() {
  const root = new URL('../', import.meta.url).pathname;
  const mutation = process.env.ORACLE_TEST_MUTATION;
  if (mutation && !mutations[mutation]) throw new Error('unknown oracle mutation');
  const tmp = mkdtempSync(root + 'scripts/.oracle-test-');
  let applied = false;
  try {
    await build({
      stdin: { contents: ['pose', 'oracle', 'anatomy', 'styles', 'rigJoints'].map(n => `export * from './src/${n}';`).join('\n'), resolveDir: root },
      bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: tmp + '/api.mjs',
      define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent',
      plugins: mutation ? [{ name: 'oracle-regression-mutation', setup(build) {
        build.onLoad({ filter: /\/(oracle|styles)\.ts$/ }, args => {
          const [file, from, to] = mutations[mutation];
          if (!args.path.endsWith('/' + file)) return;
          const contents = readFileSync(args.path, 'utf8');
          if (!contents.includes(from)) throw new Error('mutation target missing: ' + mutation);
          applied = true;
          return { contents: contents.replace(from, to), loader: 'ts' };
        });
      } }] : [],
    });
    if (mutation && !applied) throw new Error('mutation was not applied');
    return await import(pathToFileURL(tmp + '/api.mjs').href);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
