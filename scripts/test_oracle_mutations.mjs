#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const cwd=new URL('../',import.meta.url).pathname;
const run=(runner,mutation='')=>spawnSync(process.execPath,['scripts/'+runner],{
  cwd,encoding:'utf8',env:{...process.env,ORACLE_TEST_MUTATION:mutation},timeout:240000,
});
for(const runner of ['test_oracle.mjs','test_oracle_final.mjs']) {
  const baseline=run(runner);
  assert.equal(baseline.status,0,`baseline ${runner}: ${baseline.stderr}\n${baseline.stdout}`);
}
for(const [mutation,runner,reason] of [
  ['nan','test_oracle_final.mjs',/non-finite/],
  ['jump','test_oracle.mjs',/continuity quarts/],
  ['reverse','test_oracle_final.mjs',/quarts reverse=true.*footL\.x/],
  ['torso','test_oracle_final.mjs',/chest local/],
  ['world','test_oracle_final.mjs',/chest world/],
]) {
  const result=run(runner,mutation), output=result.stdout+'\n'+result.stderr;
  assert.equal(result.signal,null,`mutation ${mutation}: test timed out/crashed`);
  assert.equal(result.error,undefined,`mutation ${mutation}: failed to launch`);
  assert.notEqual(result.status,0,`mutation ${mutation} escaped detection`);
  assert.match(output,reason,`mutation ${mutation} failed for an unrelated reason:\n${output}`);
  console.log(`PASS mutation ${mutation}: rejected by ${runner}`);
}
