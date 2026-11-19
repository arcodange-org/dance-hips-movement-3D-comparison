#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadOracleApi } from './oracle_test_api.mjs';
import { near, angleNear, finiteTree, planNear, floorAtLeast, quaternionNear } from './oracle_assertions.mjs';
const { oraclePose, oracleHalfStep, legacySortiePose } = await loadOracleApi();
const feature = readFileSync(new URL('../docs/oracle.feature', import.meta.url), 'utf8');
const scenarios = [];
for (const raw of feature.split('\n')) {
  const line = raw.trim();
  if (line.startsWith('Scenario:')) scenarios.push({ name: line.slice(9).trim(), steps: [] });
  const step = /^(?:Given|When|Then|And|But) (.*)$/.exec(line);
  if (step && scenarios.length) scenarios.at(-1).steps.push(step[1]);
}
const poses = (c, reverse = false) => {
  c.reverse = reverse;
  c.steps = Array.from({ length: c.last + 1 }, (_, k) => oracleHalfStep(c.movement, k, reverse));
  assert.equal(c.steps.length, c.n / 2, 'inclusive half-step coverage');
};
const steps = [
  [/^le mouvement "(quarts|ida)" sur (\d+) temps$/, (c,m) => { c.movement=m[1]; c.n=Number(m[2]); c.reverse=false; }],
  [/^on calcule les poses oracle des demi-pas k de 0 à (\d+)( en reverse)?$/, (c,m) => { c.last=Number(m[1]); poses(c,!!m[2]); }],
  [/^les poses évaluées sont continues autour des frontières et des atterrissages$/, c => {
    // Each half-step, INCLUDING the last and both cycle seams. No same-time identity.
    for (let k=0;k<=c.n/2;k++) for (const dt of [0,.6,1.2,1.999999]) {
      const t=2*k+dt;
      const at=oraclePose(c.movement,t,c.reverse);
      planNear(oraclePose(c.movement,t-1e-7,c.reverse),at,1e-5,`continuity ${c.movement} t=${t} left`);
      planNear(at,oraclePose(c.movement,t+1e-7,c.reverse),1e-5,`continuity ${c.movement} t=${t} right`);
    }
  }],
  [/^la pose au temps (\d+) est égale à la pose au temps (\d+) \(raccord de cycle\)$/, (c,m) =>
    planNear(oraclePose(c.movement,Number(m[1]),c.reverse),oraclePose(c.movement,Number(m[2]),c.reverse),1e-9)],
  [/^les poses et cibles respectent les repères géométriques indépendants$/, () => {
    const start=oraclePose('quarts',0), next=oraclePose('quarts',2), end=oraclePose('quarts',4);
    near(start.footL.x,.084); near(start.footL.z,.09); angleNear(start.footL.yaw,0);
    near(next.footR.z,.09); near(next.targets.R.z,.368); angleNear(next.footR.yaw,0);
    near(end.footL.x,-.084); near(end.footL.z,.20); near(end.footR.x,-.084); near(end.footR.z,.368);
    const back=oraclePose('quarts',8); near(back.footR.x,.194); near(back.footR.z,.368);
    for(const k of [0,1,2,3,4,5,6,7]) finiteTree(oracleHalfStep('quarts',k));
  }],
  [/^chaque pose reverse est le miroir dans le repère extérieur sur tous les demi-pas$/, c => {
    assert.equal(c.steps.length,8,'all eight reverse half-steps');
    for(let k=0;k<c.steps.length;k++) for(const phase of [0,.5,1.2,1.99,2]) {
      const a=oraclePose(c.movement,2*k+phase),b=oraclePose(c.movement,2*k+phase,true);
      for(const [s,opposite] of [['L','R'],['R','L']]) {
        near(b['foot'+s].x,a['foot'+opposite].x); near(b['foot'+s].z,-a['foot'+opposite].z);
        angleNear(b['foot'+s].yaw,-a['foot'+opposite].yaw);
      }
      angleNear(b.rootLocalYaw,-a.rootLocalYaw); angleNear(b.chestLocalYaw,-a.chestLocalYaw);
    }
  }],
  [/^on calcule les poses oracle aux temps ([\d., ]+)$/, (c,m) => { c.times=m[1].split(',').map(Number); c.poses=c.times.map(t=>oraclePose(c.movement,t)); }],
  [/^l'écart des lacets des pieds posés vaut pi\/2$/, c => { for(const p of c.poses) near(Math.abs(Math.atan2(Math.sin(p.footL.yaw-p.footR.yaw),Math.cos(p.footL.yaw-p.footR.yaw))),Math.PI/2); }],
  [/^les consignes nominales haut et bas sont opposées et nulles aux frontières$/, c => {
    for(const p of c.poses) assert(p.rootLocalYaw*(p.rootLocalYaw+p.chestLocalYaw)<0);
    for(let t=0;t<=c.n;t+=2) {const p=oraclePose(c.movement,t); near(p.rootLocalYaw,0);near(p.chestLocalYaw,0);}
  }],
];
let passed=0;
for(const scenario of scenarios) {
  const context={};
  for(const step of scenario.steps) {
    const found=steps.find(([re])=>re.test(step)); assert(found,'unknown step: '+step);
    found[1](context,step.match(found[0]));
  }
  passed++; console.log('PASS oracle :: '+scenario.name);
}
assert.equal(passed,6,'scenario coverage');
// Finite validation exercises the real assertion helpers, including expected values.
for(const bad of [NaN,Infinity,-Infinity]) {
  for(const args of [[bad,0,1e-6],[0,bad,1e-6],[0,0,bad]]) assert.throws(()=>near(...args),/non-finite/);
  assert.throws(()=>angleNear(bad,0),/non-finite/); assert.throws(()=>floorAtLeast(bad),/non-finite/);
  assert.throws(()=>floorAtLeast(0,bad),/non-finite/);
  assert.throws(()=>oraclePose('quarts',bad),/finite/);
  assert.throws(()=>legacySortiePose('sortieG',bad),/finite/);
  assert.throws(()=>quaternionNear([0,0,0,bad],[0,0,0,1]),/non-finite/);
}
assert.throws(()=>near(0,0,-1),/negative/); assert.throws(()=>near(1e308,-1e308),/non-finite/);
assert.throws(()=>floorAtLeast(-.1),/penetration/);
assert.throws(()=>oraclePose('ida',0,true),/unsupported/);
assert.throws(()=>oraclePose('sortieG',0,true),/unsupported/);
assert.throws(()=>legacySortiePose('sortieG',0,true),/unsupported/);
assert.throws(()=>oracleHalfStep('quarts',-1),/index/);
assert.throws(()=>oracleHalfStep('quarts',.5),/index/);
assert.throws(()=>oraclePose('quarts',0,'true'),/boolean/);
assert.throws(()=>oraclePose('ida',0,false,{L:{x:NaN,z:0,yaw:0},R:{x:0,z:0,yaw:0}}),/finite/);
assert.throws(()=>quaternionNear([0,1],[0,1]),/length/);
console.log(`Oracle: ${passed} scenarios; finite/reverse guards PASS`);
