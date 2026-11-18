// Phase 18 — oracle de poses discrètes par demi-pas (docs/spec-phase18-oracle.md).
// Fichier neuf (coordination issue #17) : ne MODIFIE aucun moteur, ne fait qu'ÉNONCER des poses
// de frontière (début/fin de demi-pas de 2 temps) à partir des fonctions pures existantes, pour
// tester la continuité aux raccords de cycle, la dualité danseur/partenaire (reverse = miroir
// z + lacets opposés + échange des rôles G/D) et la dualité haut/bas (contraposition).
import { quartTurnStep, idaEVoltaStep, idaContra } from "./styles";

export interface FootPose {
  x: number;
  z: number;
  yaw: number;
}
export interface Pose {
  footL: FootPose;
  footR: FootPose;
  upperYaw: number; // lacet monde du HAUT du corps
  lowerYaw: number; // lacet monde du BAS du corps (root)
}
export type OracleMovement = "quarts" | "ida";

// Ida e volta : amplitude du pas en avant/arrière (même 0.09 que le Rig).
const IDA_STEP_Z = 0.09;

function quartsPose(b: number, reverse: boolean): Pose {
  const qs = quartTurnStep(b, reverse);
  return {
    footL: { x: qs.footL.x, z: qs.footL.z, yaw: qs.footL.yaw },
    footR: { x: qs.footR.x, z: qs.footR.z, yaw: qs.footR.yaw },
    upperYaw: qs.upperYaw,
    lowerYaw: qs.lowerYaw,
  };
}

// Pose de repos des pieds déduite de quartTurnStep(0) (évite de dupliquer QH/QF) :
// pied D au repos = { x: -QH, z: QF, yaw: 0 }, pied G symétrique.
function restFeet(): { footL: FootPose; footR: FootPose } {
  const r = quartTurnStep(0, false).footR;
  return { footL: { x: -r.x, z: r.z, yaw: 0 }, footR: { x: r.x, z: r.z, yaw: r.yaw } };
}

function idaPose(b: number, reverse: boolean): Pose {
  const { footL, footR } = restFeet();
  const p = ((b % 8) + 8) % 8;
  const stepsDone = Math.floor(p / 2); // pas de 2 temps déjà accomplis dans le cycle de 8
  let fl = { ...footL };
  let fr = { ...footR };
  for (let j = 0; j < stepsDone; j++) {
    const st = idaEVoltaStep(j * 2);
    const dz = st.dir * IDA_STEP_Z;
    if (st.side === "L") fl = { ...fl, z: fl.z + dz };
    else fr = { ...fr, z: fr.z + dz };
  }
  const ic = idaContra(b);
  let pose: Pose = { footL: fl, footR: fr, upperYaw: ic.upperYaw, lowerYaw: ic.lowerYaw };
  if (reverse) {
    pose = {
      footL: { x: pose.footR.x, z: -pose.footR.z, yaw: -pose.footR.yaw },
      footR: { x: pose.footL.x, z: -pose.footL.z, yaw: -pose.footL.yaw },
      upperYaw: -pose.upperYaw,
      lowerYaw: -pose.lowerYaw,
    };
  }
  return pose;
}

// Pose oracle au temps b (frontière de demi-pas incluse).
export function oraclePose(movement: OracleMovement, b: number, reverse = false): Pose {
  return movement === "quarts" ? quartsPose(b, reverse) : idaPose(b, reverse);
}

// Oracle entre deux demi-temps : pose de départ et d'arrivée du demi-pas k (2 temps chacun).
export function oracleHalfStep(
  movement: OracleMovement,
  k: number,
  reverse = false
): { start: Pose; end: Pose } {
  return { start: oraclePose(movement, 2 * k, reverse), end: oraclePose(movement, 2 * (k + 1), reverse) };
}
