import assert from 'node:assert/strict';

export function finiteNumber(value, label = 'value') {
  assert.equal(typeof value, 'number', `${label}: expected number`);
  assert(Number.isFinite(value), `${label}: non-finite number ${value}`);
  return value;
}
export function near(actual, expected, tolerance = 1e-9, label = 'near') {
  finiteNumber(actual, label + ' actual'); finiteNumber(expected, label + ' expected');
  finiteNumber(tolerance, label + ' tolerance');
  assert(tolerance >= 0, `${label}: negative tolerance`);
  const error = finiteNumber(Math.abs(actual - expected), label + ' error');
  assert(error <= tolerance, `${label}: ${actual} vs ${expected} (error ${error}, tolerance ${tolerance})`);
  return error;
}
export function angleNear(actual, expected, tolerance = 1e-9, label = 'angle') {
  finiteNumber(actual, label + ' actual'); finiteNumber(expected, label + ' expected');
  const delta = actual - expected;
  finiteNumber(delta, label + ' difference');
  return near(Math.atan2(Math.sin(delta), Math.cos(delta)), 0, tolerance, label);
}
export function floorAtLeast(minimum, floor = -1e-9) {
  finiteNumber(minimum, 'minimum ground height'); finiteNumber(floor, 'ground threshold');
  assert(minimum >= floor, `ground penetration: ${minimum} < ${floor}`);
}
export function finiteTree(value, label = 'pose') {
  if (typeof value === 'number') finiteNumber(value, label);
  else {
    assert(value !== null && typeof value === 'object', `${label}: expected numeric tree`);
    for (const [key, child] of Object.entries(value)) finiteTree(child, `${label}.${key}`);
  }
}
export function quaternionNear(a, b, tolerance = 1e-7, label = 'quaternion') {
  assert.equal(a.length, 4, label + ' actual length');
  assert.equal(b.length, 4, label + ' expected length');
  a.forEach((n, i) => finiteNumber(n, `${label} actual[${i}]`));
  b.forEach((n, i) => finiteNumber(n, `${label} expected[${i}]`));
  near(Math.hypot(...a), 1, 1e-6, label + ' actual norm');
  near(Math.hypot(...b), 1, 1e-6, label + ' expected norm');
  // q and -q encode the same orientation; chord distance is stable near zero.
  const direct = Math.hypot(...a.map((v, i) => v - b[i]));
  const opposite = Math.hypot(...a.map((v, i) => v + b[i]));
  return near(Math.min(direct, opposite), 0, tolerance, label);
}
export function planNear(a, b, tolerance = 1e-5, label = 'continuity') {
  finiteTree(a); finiteTree(b);
  for (const foot of ['footL', 'footR']) {
    for (const axis of ['x', 'z']) near(a[foot][axis], b[foot][axis], tolerance, `${label} ${foot}.${axis}`);
    angleNear(a[foot].yaw, b[foot].yaw, tolerance, `${label} ${foot}.yaw`);
  }
  for (const key of ['rootLocalYaw', 'chestLocalYaw']) angleNear(a[key], b[key], tolerance, `${label} ${key}`);
  for (const key of ['nominalRootX', 'nominalRootZ']) near(a[key], b[key], tolerance, `${label} ${key}`);
  // Targets can change at a boundary; evaluated feet must not jump to the next target.
}
