#!/usr/bin/env node
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { loadOracleApi } from './oracle_test_api.mjs';
import { fixture, minimumBoneY, snapshot } from './pose_fixture.mjs';
import { near, angleNear, finiteTree, floorAtLeast, quaternionNear } from './oracle_assertions.mjs';
const api = await loadOracleApi();
let poses=0, footChecks=0, worldChecks=0, continuityChecks=0;
let maxFootError=0, minY=Infinity, maxNominalRootError=0;
const worldPosition = node => node.getWorldPosition(new THREE.Vector3());
const worldQuaternion = node => node.getWorldQuaternion(new THREE.Quaternion());
const eulerQ = (x,y,z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'XYZ'));
const Y = new THREE.Vector3(0,1,0);
const rest = f => Object.fromEntries(['L','R'].map(side=>[side,{x:f.model.legs[side].rest.x,z:f.model.legs[side].rest.z,yaw:0}]));

// Independent Kizomba/amp=1/iso=1 orientation reference for this integration contract.
// These documented style amplitudes are not read from STYLES.apply or animated ancestors.
// #223: run with the trunk of before (`elu`) and with the isolated trunk (the default, docs/spec-isolation-buste.md).
let MODE='elu';
// Trunk of before: World = outer * root * pelvis * spine * chest. The nominal yaw sum is NOT a world Euler yaw.
// Isolated: the waist takes up the pelvis; the chest turns by its nominal yaw over the root, then leans forward (0.1).
function expectedChestWorld(outer, beat, expected) {
  if(MODE==='isole') return outer.clone().multiply(eulerQ(0,expected.rootLocalYaw,0))
    .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.1,expected.chestLocalYaw,0,'YXZ')));
  const sway=Math.sin(Math.PI*beat), pitch=.02*Math.sin(2*Math.PI*beat), roll=.05*sway;
  return outer.clone().multiply(eulerQ(0,expected.rootLocalYaw,0))
    .multiply(eulerQ(pitch,.03*sway,roll)).multiply(eulerQ(-pitch,0,-roll))
    .multiply(eulerQ(.1,expected.chestLocalYaw,0));
}
function check(f, beat, expected, config, label) {
  finiteTree(expected, label+' expected');
  api.applyPose(f.r,f.model,beat,{styleKey:'kizomba',amp:1,embrace:true,iso:true,...config});
  snapshot(f.r).forEach(value=>near(value,value,0,label+' finite matrix'));
  const floor=minimumBoneY(f.r); floorAtLeast(floor); minY=Math.min(minY,floor);
  const outer=worldQuaternion(f.outer);
  for(const side of ['L','R']) {
    const actual=f.outer.worldToLocal(worldPosition(f.r['foot'+side])), target=expected['foot'+side];
    for(const axis of ['x','z']) maxFootError=Math.max(maxFootError,near(actual[axis],target[axis],1e-6,`${label} foot${side}.${axis}`));
    const orientation=outer.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Y,target.yaw));
    quaternionNear(worldQuaternion(f.r['foot'+side]).toArray(),orientation.toArray(),1e-7,`${label} foot${side} world`);
    footChecks++;
  }
  angleNear(f.r.root.rotation.y,expected.rootLocalYaw,1e-9,label+' root local');
  if(MODE==='elu') angleNear(f.r.chest.rotation.y,expected.chestLocalYaw,1e-9,label+' chest local');
  else {
    // The chest's turn over the root (its local rotation also holds the waist's counter-lean).
    const over=worldQuaternion(f.r.root).invert().multiply(worldQuaternion(f.r.chest));
    angleNear(new THREE.Euler().setFromQuaternion(over,'YXZ').y,expected.chestLocalYaw,1e-7,label+' chest local');
  }
  quaternionNear(worldQuaternion(f.r.root).toArray(),outer.clone().multiply(eulerQ(0,expected.rootLocalYaw,0)).toArray(),1e-7,label+' root world');
  // #62: on the spot the style runs ON_BEAT_SHIFT behind the clock (weight on the beat).
  const styleBeat=beat-api.onBeatShift({movement:'none',embrace:true,...config});
  quaternionNear(worldQuaternion(f.r.chest).toArray(),expectedChestWorld(outer,styleBeat,expected).toArray(),1e-7,label+' chest world');
  worldChecks+=4;
  // #31: the root is the oracle's nominal path plus kizomba's own lateral hip shift (0.07·sway at
  // amplitude 1, re-derived here like the chest above), exact on both axes; no reach projection occurs.
  maxNominalRootError=Math.max(maxNominalRootError,
    near(f.r.root.position.x,expected.nominalRootX+.07*Math.sin(Math.PI*styleBeat),1e-6,label+' nominal root x'),
    near(f.r.root.position.z,expected.nominalRootZ,1e-6,label+' nominal root z'));
  poses++;
}
function checkContinuity(f, times, config, label) {
  for(const t of times) {
    const frames=[t-1e-7,t,t+1e-7].map(b=>{
      api.applyPose(f.r,f.model,b,{styleKey:'kizomba',amp:1,embrace:true,...config});
      return snapshot(f.r);
    });
    for(const [a,b] of [[frames[0],frames[1]],[frames[1],frames[2]]])
      a.forEach((value,i)=>near(value,b[i],1e-4,`${label} GLB continuity t=${t} matrix[${i}]`));
    continuityChecks++;
  }
}
let coverage=[];
for(const mode of ['elu','isole']) {
MODE=mode; api.setTrunk(mode);
coverage=[];
for(const movement of ['quarts','ida']) for(const reverse of movement==='quarts'?[false,true]:[false]) for(const follower of [false,true]) {
  const cycle=movement==='quarts'?16:8;
  const f=fixture(api,{rotation:(follower?Math.PI:0)+.37,offset:[.13,0,follower?.175:-.175]});
  const config={movement,quarts:movement==='quarts',ida:movement==='ida',reverse,follower};
  const landings=Array.from({length:cycle/2},(_,k)=>2*k+1.2);
  const boundaries=Array.from({length:cycle/2+1},(_,k)=>2*k);
  const times=[...new Set([...Array.from({length:cycle*4+1},(_,i)=>i/4),...landings,...boundaries.flatMap(t=>[t-1e-7,t+1e-7])])].sort((a,b)=>a-b);
  const seen=new Set();
  for(const b of times) {
    const label=`[${MODE}] ${movement} reverse=${reverse} follower=${follower} b=${b}`;
    check(f,b,api.oraclePose(movement,b,reverse,rest(f)),config,label);
    if(landings.includes(b)) seen.add(Math.floor(b/2));
  }
  assert.deepEqual([...seen],Array.from({length:cycle/2},(_,i)=>i),'all landed half-steps, including the last');
  checkContinuity(f,[...boundaries,...landings],config,`${movement} reverse=${reverse}`);
  coverage.push({movement,reverse,follower,poses:times.length,landedSteps:seen.size});
}
assert.equal(coverage.length,6,'both roles, both quarts directions, ida forward');
assert.equal(coverage.filter(c=>c.reverse).length,2,'reverse evaluated on the GLB for both roles');

// All old M5 paths remain exercised. G and F target the legacy internal option on their active roles.
// Historical reset at b=5/13 is characterised, not silently turned into a continuity claim.
for(const movement of ['sortieG','sortieF','sortieGF']) for(const follower of [false,true]) {
  const cycle=movement==='sortieGF'?16:8, role=follower?'follower':'leader';
  const f=fixture(api,{rotation:follower?Math.PI:0,offset:[0,0,follower?.175:-.175]});
  // Do not confuse the old internal sortie=true (active for both) with G's role window.
  // Its inactive follower uses the baseline pose; the current sortieG is a different figure.
  const config=movement==='sortieGF' ? {movement,follower}
    : {movement:'none',sortie:movement==='sortieG' ? !follower : follower,follower};
  const times=[...new Set([...Array.from({length:cycle*4+1},(_,i)=>i/4),...Array.from({length:cycle},(_,i)=>i+.6)])].sort((a,b)=>a-b);
  for(const b of times) check(f,b,api.legacySortiePose(movement,b,role,rest(f)),config,`legacy ${movement} ${role} b=${b}`);
  const reset=movement==='sortieGF'?(follower?13:5):5;
  const active=movement==='sortieGF'||(movement==='sortieG'?!follower:follower);
  if(active) {
    const before=api.legacySortiePose(movement,reset-1e-7,role,rest(f));
    const after=api.legacySortiePose(movement,reset,role,rest(f));
    // Characterisation only, preserving this known pre-existing discontinuity until the
    // owner validates the replacement figures. Never included in continuity coverage.
    near(before.footR.x-after.footR.x,.17248,1e-6,'historical right foot reset');
    const actual=[reset-1e-7,reset].map(b=>{
      check(f,b,api.legacySortiePose(movement,b,role,rest(f)),config,`legacy reset ${movement} ${role} b=${b}`);
      return Object.fromEntries(['L','R'].map(s=>[s,f.outer.worldToLocal(worldPosition(f.r['foot'+s])).x]));
    });
    near(actual[0].L-actual[1].L,.02288,1e-6,'historical GLB left foot reset');
    near(actual[0].R-actual[1].R,.17248,1e-6,'historical GLB right foot reset');
  }
}
}
// The actual world yaw differs from the nominal root+chest sum: guard the old mislabelling (trunk of before).
// #223: isolated, the pelvis's own yaw no longer reaches the chest: the nominal sum is its world yaw.
{
  const f=fixture(api), expected=api.oraclePose('ida',.5,false,rest(f));
  api.applyPose(f.r,f.model,.5,{movement:'ida',ida:true,embrace:true});
  near(new THREE.Euler().setFromQuaternion(worldQuaternion(f.r.chest),'YXZ').y,expected.rootLocalYaw+expected.chestLocalYaw,1e-7,'isolated chest world yaw');
  api.setTrunk('elu');
  api.applyPose(f.r,f.model,.5,{movement:'ida',ida:true,embrace:true});
  const measured=new THREE.Euler().setFromQuaternion(worldQuaternion(f.r.chest),'YXZ').y;
  near(expected.rootLocalYaw+expected.chestLocalYaw,-.07071067811865475);
  near(measured,-.0413428059705013);
  assert(Math.abs(measured-(expected.rootLocalYaw+expected.chestLocalYaw))>.02,'nominal is not world yaw');
  api.setTrunk(null);
}
floorAtLeast(minY);
console.log('PASS oracle GLB:',JSON.stringify({poses,footChecks,worldChecks,continuityChecks,maxFootError,minY,maxNominalRootError,coverage}));
