// Phase 18 — oracle de poses discrètes par demi-pas (docs/spec-phase18-oracle.md).
// Fichier neuf (coordination issue #17) : ne MODIFIE aucun moteur, ne fait qu'ÉNONCER des poses
// de frontière (début/fin de demi-pas de 2 temps) à partir des fonctions pures existantes, pour
// tester la continuité aux raccords de cycle, la dualité danseur/partenaire (reverse = miroir
// z + lacets opposés + échange des rôles G/D) et la dualité haut/bas (contraposition).
import { quartTurnStep, idaEVoltaStep, idaContra, sortieActive, type MovementKey } from "./styles";

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
  rootX: number; // phase M5 : déplacement latéral prédit du root (sorties), 0 sinon
}
// Phase M5 : l'oracle couvre aussi les sorties (option exclusive phase 17).
export type OracleMovement = "quarts" | "ida" | "sortieG" | "sortieF" | "sortieGF";
export type OracleSide = "leader" | "follower";

// Ida e volta : amplitude du pas en avant/arrière (même 0.09 que le Rig).
const IDA_STEP_Z = 0.09;

function quartsPose(b: number, reverse: boolean): Pose {
  const qs = quartTurnStep(b, reverse);
  return {
    footL: { x: qs.footL.x, z: qs.footL.z, yaw: qs.footL.yaw },
    footR: { x: qs.footR.x, z: qs.footR.z, yaw: qs.footR.yaw },
    upperYaw: qs.upperYaw,
    lowerYaw: qs.lowerYaw,
    rootX: (qs.footL.x + qs.footR.x) / 2, // le moteur pose root.x = moyenne des pieds (pose.ts)
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
  const index = Math.floor(p / 2); // pas courant de 2 temps
  // Convention du moteur (pose.ts plannedFeet) : à la frontière de pas, le pied d'un côté est
  // à repos + dir(dernier pas de ce côté) * 0.09 (recherche arrière, pas de cumul).
  let fl = { ...footL };
  let fr = { ...footR };
  for (const sd of ["L", "R"] as const) {
    let last = index - 1;
    while (idaEVoltaStep(((last % 4) + 4) % 4 * 2).side !== sd) last--;
    const dz = idaEVoltaStep((((last % 4) + 4) % 4) * 2).dir * IDA_STEP_Z;
    if (sd === "L") fl = { ...fl, z: fl.z + dz };
    else fr = { ...fr, z: fr.z + dz };
  }
  const ic = idaContra(b);
  let pose: Pose = { footL: fl, footR: fr, upperYaw: ic.upperYaw, lowerYaw: ic.lowerYaw, rootX: 0 };
  if (reverse) {
    pose = {
      footL: { x: pose.footR.x, z: -pose.footR.z, yaw: -pose.footR.yaw },
      footR: { x: pose.footL.x, z: -pose.footL.z, yaw: -pose.footL.yaw },
      upperYaw: -pose.upperYaw,
      lowerYaw: -pose.lowerYaw,
      rootX: -pose.rootX, // suiveur en miroir (rotY=pi) : x monde opposé
    };
  }
  return pose;
}

// Phase M5 — pose oracle d'une sortie (option exclusive phase 17) : déplacement latéral
// prédit du root (et des pieds, qui suivent) = 0.22 * sortieActive(side, m, b) à amp=1.
function sortiePose(b: number, m: MovementKey, side: OracleSide, reverse: boolean): Pose {
  const { footL, footR } = restFeet();
  const se = sortieActive(side, m, b);
  const dx = 0.22 * se;
  let pose: Pose = {
    footL: { x: footL.x + dx, z: footL.z, yaw: 0 },
    footR: { x: footR.x + dx, z: footR.z, yaw: 0 },
    // contre-rotation du buste pendant la sortie (pose.ts : chest.y -= 0.22 * se), le bas
    // du corps reste sur la ligne -> dissociation haut/bas prédite = -0.22 * se
    upperYaw: -0.22 * se,
    lowerYaw: 0,
    rootX: dx,
  };
  if (reverse) {
    pose = {
      footL: { x: -pose.footR.x, z: -pose.footR.z, yaw: -pose.footR.yaw },
      footR: { x: -pose.footL.x, z: -pose.footL.z, yaw: -pose.footL.yaw },
      upperYaw: -pose.upperYaw,
      lowerYaw: -pose.lowerYaw,
      rootX: -pose.rootX,
    };
  }
  return pose;
}

// Pose oracle au temps b (frontière de demi-pas incluse).
export function oraclePose(movement: OracleMovement, b: number, reverse = false, side: OracleSide = "leader"): Pose {
  if (movement === "quarts") return quartsPose(b, reverse);
  if (movement === "ida") return idaPose(b, reverse);
  return sortiePose(b, movement, side, reverse);
}

// Oracle entre deux demi-temps : pose de départ et d'arrivée du demi-pas k (2 temps chacun).
export function oracleHalfStep(
  movement: OracleMovement,
  k: number,
  reverse = false,
  side: OracleSide = "leader"
): { start: Pose; end: Pose } {
  return {
    start: oraclePose(movement, 2 * k, reverse, side),
    end: oraclePose(movement, 2 * (k + 1), reverse, side),
  };
}
