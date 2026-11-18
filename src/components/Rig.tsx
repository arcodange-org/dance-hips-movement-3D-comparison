import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  ANATOMY_URL,
  HIP_Y,
  HIP_WIDTH,
  S2,
  TRAIL_MAX,
  TAU,
  BODY,
  BODY_DARK,
  TORSO_OPACITY,
  makeTrail,
  resetRig,
  clampSolY,
  groundDip,
  type RigHandle,
} from "../anatomy";
import { STYLES, sortieEnvelope, sortieOffset, supportOf, plantBlend, corridinhoPath, reversePath, travelOffset, swingBeat, idaEVoltaStep, idaContra, lockUpperTrunk, applyDanceFrame, applyFollowerFrame, upperStability, virgulaFootYawDelta, quartTurnStep, swingLift } from "../styles";
import { facingSector } from "../directions";
import { solveLeg3D } from "../ik";
import {
  MUSCLES_URL,
  DRACO_DECODER_PATH,
  MUSCLE_OPACITY,
  muscleParent,
  parentOffsetSkel,
  makeMuscleMaterial,
} from "../muscles";

type Side = "R" | "L";

interface Swing {
  from: THREE.Vector3;
  to: THREE.Vector3;
  t: number;
  yawFrom?: number;
  yawTo?: number;
}

interface IkState {
  ready: boolean;
  L1: Record<Side, number>;
  L2: Record<Side, number>;
  f0: Record<Side, THREE.Vector3>;
  t0: Record<Side, THREE.Vector3>;
  hipSkel: Record<Side, THREE.Vector3>;
  ankleOuterY: number;
  footZ: Record<Side, number>;
  plant: Record<Side, THREE.Vector3>;
  footPos: Record<Side, THREE.Vector3>;
  swing: Record<Side, Swing | null>;
  footYaw: Record<Side, number>;
  lastBeat: number;
}

export interface RigProps {
  styleKey: string;
  bpm: number;
  amp: number;
  playing: boolean;
  offset: [number, number, number];
  rotationY?: number;
  ghost?: boolean;
  embrace?: boolean;
  phaseOffset?: number;
  pair: React.MutableRefObject<Record<string, any>> | null;
  side: "leader" | "follower" | null;
  showContacts?: boolean;
  travel?: number;
  showTorso?: boolean;
  showMuscles?: boolean;
  sortie?: boolean;
  showAppui?: boolean;
  stats?: React.MutableRefObject<any> | null;
  plant?: boolean;
  corridinho?: boolean;
  torsoOpacity?: number;
  iso?: boolean;
  cadre?: boolean;
  quarts?: boolean;
  reverse?: boolean;
  dir?: number;
  temps3?: boolean;
  ida?: boolean;
}

export default function Rig({
  styleKey,
  bpm,
  amp,
  playing,
  offset,
  rotationY = 0,
  ghost = false,
  embrace = false,
  phaseOffset = 0,
  pair = null,
  side = null,
  showContacts = false,
  travel = 0,
  showTorso = true,
  showMuscles = false,
  sortie = false,
  showAppui = false,
  stats = null,
  plant = true,
  corridinho = false,
  torsoOpacity,
  iso = true,
  cadre = true,
  quarts = false,
  reverse = false,
  dir = 1,
  temps3 = false,
  ida = false,
}: RigProps) {
  const torsoOp = torsoOpacity ?? TORSO_OPACITY;
  const r = useRef({} as RigHandle).current;
  const reg = (n: string) => (el: any) => {
    r[n] = el;
  };
  const t = useRef(0);
  const count = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const trail = useMemo(() => makeTrail(STYLES[styleKey].color), [styleKey]);
  const lastGhost = useRef<boolean | null>(null);
  const ik = useRef<IkState>({
    ready: false,
    L1: { R: 0, L: 0 },
    L2: { R: 0, L: 0 },
    f0: { R: new THREE.Vector3(), L: new THREE.Vector3() },
    t0: { R: new THREE.Vector3(), L: new THREE.Vector3() },
    hipSkel: { R: new THREE.Vector3(), L: new THREE.Vector3() },
    ankleOuterY: 0,
    footZ: { R: 0, L: 0 },
    plant: { R: new THREE.Vector3(), L: new THREE.Vector3() },
    footPos: { R: new THREE.Vector3(), L: new THREE.Vector3() },
    swing: { R: null, L: null },
    footYaw: { R: 0, L: 0 },
    lastBeat: -1,
  });
  const { scene } = useGLTF(ANATOMY_URL);
  const { scene: musclesScene } = useGLTF(MUSCLES_URL, DRACO_DECODER_PATH);
  const muscleMeshes = useRef<THREE.Mesh[]>([]);
  const chainMeshes = useRef<Record<Side, THREE.Mesh[]>>({ R: [], L: [] });
  const chainColor = useMemo(() => new THREE.Color(STYLES[styleKey].color), [styleKey]);
  const skel = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.material = (mesh.material as THREE.Material).clone();
    });
    return s;
  }, [scene]);
  useEffect(() => {
    skel.traverse((o) => {
      if (o.name) r[o.name] = o;
    });
    r.hipR = r["HipPivot_R"];
    r.hipL = r["HipPivot_L"];
    r.kneeR = r["KneePivot_R"];
    r.kneeL = r["KneePivot_L"];
    r.footR = r["AnklePivot_R"];
    r.footL = r["AnklePivot_L"];

    const kneeR = r["KneePivot_R"] as THREE.Object3D;
    const kneeL = r["KneePivot_L"] as THREE.Object3D;
    const ankleR = r["AnklePivot_R"] as THREE.Object3D;
    const ankleL = r["AnklePivot_L"] as THREE.Object3D;
    const state = ik.current;
    state.L1.R = kneeR.position.length();
    state.L1.L = kneeL.position.length();
    state.L2.R = ankleR.position.length();
    state.L2.L = ankleL.position.length();
    state.f0.R = kneeR.position.clone().normalize();
    state.f0.L = kneeL.position.clone().normalize();
    state.t0.R = ankleR.position.clone().normalize();
    state.t0.L = ankleL.position.clone().normalize();
    state.hipSkel.R = (r.hipR as THREE.Object3D).position.clone();
    state.hipSkel.L = (r.hipL as THREE.Object3D).position.clone();
    const ankleRestY =
      (r.hipR as THREE.Object3D).position.y +
      kneeR.position.y +
      ankleR.position.y;
    state.ankleOuterY = HIP_Y + ankleRestY;
    state.footZ.R = (r.hipR as THREE.Object3D).position.z + kneeR.position.z + ankleR.position.z;
    state.footZ.L = (r.hipL as THREE.Object3D).position.z + kneeL.position.z + ankleL.position.z;
    for (const s of ["R", "L"] as Side[]) {
      state.plant[s].set(state.hipSkel[s].x, state.ankleOuterY, state.footZ[s]);
      state.footPos[s].copy(state.plant[s]);
    }
    for (const sd of ["R", "L"] as Side[]) {
      const list: THREE.Mesh[] = [];
      for (const n of ["Femur", "Tibia", "Fibula", "Patella", "Foot", "HipBone"]) {
        const m = r[`${n}_${sd}`] as THREE.Mesh | undefined;
        if (m && m.isMesh) list.push(m);
      }
      chainMeshes.current[sd] = list;
    }
    state.ready = true;
  }, [skel, r]);
  // Greffe de la couche musculaire (GLB BodyParts3D, espace Skeleton) sur les
  // n\u0153uds du rig : chaque maillage `Muscle_<Label>_<R|L|C>` est re-parent\u00e9 vers
  // son pivot osseux et d\u00e9cal\u00e9 de la position du parent en espace Skeleton.
  useEffect(() => {
    for (const m of muscleMeshes.current) m.removeFromParent();
    const list: THREE.Mesh[] = [];
    const src = musclesScene.clone(true);
    const meshes: THREE.Mesh[] = [];
    src.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    for (const mesh of meshes) {
      const parentKey = muscleParent(mesh.name);
      const parent = parentKey ? (r[parentKey] as THREE.Object3D | undefined) : undefined;
      if (!parentKey || !parent) continue;
      mesh.material = makeMuscleMaterial();
      mesh.userData.part = "muscle";
      mesh.position.sub(parentOffsetSkel(parentKey, r));
      mesh.visible = showMuscles;
      parent.add(mesh);
      list.push(mesh);
    }
    muscleMeshes.current = list;
  }, [musclesScene, skel, r, showMuscles]);
  useEffect(() => {
    for (const m of muscleMeshes.current) m.visible = showMuscles;
  }, [showMuscles, musclesScene, skel]);
  useEffect(() => {
    count.current = 0;
    trail.geometry.setDrawRange(0, 0);
    t.current = 0;
    const state = ik.current;
    state.lastBeat = -1;
    state.swing.R = null;
    state.swing.L = null;
    state.footYaw.R = 0;
    state.footYaw.L = 0;
    for (const s of ["R", "L"] as Side[]) {
      state.plant[s].set(state.hipSkel[s].x, state.ankleOuterY, state.footZ[s]);
      state.footPos[s].copy(state.plant[s]);
    }
  }, [styleKey, trail]);
  useEffect(() => {
    if (pair && side) {
      pair.current[side] = { chest: r.contactChest, pelvis: r.contactPelvis, kneeL: r.contactKneeL, kneeR: r.contactKneeR };
      return () => {
        pair.current[side] = null;
      };
    }
  }, [pair, side, r]);

  useFrame((_, delta) => {
    if (!r.root || !r.pelvis || !r.footL) return;
    if (playing) t.current += Math.min(delta, 0.1) * (bpm / 60);
    const b = t.current + phaseOffset;
    resetRig(r);
    STYLES[styleKey].apply(r, b, amp);
    r.root.position.x += travelOffset(travel, dir, b);
    if (sortie && embrace) {
      // Sortie = ligne de danse : déplacement latéral local (axe x, perpendiculaire à la
      // ligne) hors de la ligne puis retour dessus. Le buste/bras restent orientés sur la
      // ligne (contre-rotation) -> dissociation thoraco-pelvienne pendant la sortie.
      r.root.position.x += sortieOffset(b, amp);
      const e = sortieEnvelope(b) * amp;
      r.chest.rotation.y -= 0.22 * e;
      if (r.head) r.head.rotation.y -= 0.12 * e;
    }
    if (corridinho) {
      // 1/4 de tour à droite (0-3), à gauche (4-7), puis cercle au sol autour du repère fixe.
      // En paire, le suiveur (reverse) le fait en marche arrière (trajectoire miroir, ry opposé).
      const cp0 = corridinhoPath(b);
      const cp = reverse ? reversePath(cp0) : cp0;
      r.root.position.x += cp.x;
      r.root.position.z += cp.z;
      r.root.rotation.y += cp.ry;
      r.chest.rotation.z -= 0.06; // épaules vers l'intérieur du cercle
    }
    // Phase 14 — quarts de tour à pas détaillés (vírgula) : 2 demi-pas par quart, le haut du
    // corps suit le pied G, le bas du corps le pied D (dissociation, appliquée après lockUpperTrunk).
    const qs = quarts ? quartTurnStep(b, reverse) : null;
    // Phase 7 — isolation du bas du corps (iso=1 par défaut) : le haut du tronc reste stable et
    // vertical (contre-rotation du pelvis au niveau de la colonne, buste/tête sans bascule
    // latérale) ; les bras prennent le cadre de danseur (coudes pliés, avant-bras G en haut).
    lockUpperTrunk({ spine: r.spine.rotation, chest: r.chest.rotation, head: r.head.rotation }, r.pelvis.rotation, iso);
    if (qs) {
      r.root.rotation.y += qs.lowerYaw; // bas du corps = lacet du pied D
      const dYaw = qs.upperYaw - qs.lowerYaw; // haut du corps = lacet du pied G
      r.chest.rotation.y += dYaw;
      if (r.head) r.head.rotation.y += dYaw;
      // On AVANCE en pivotant avec le pied : le root suit le pied qui avance (sinon la jambe,
      // ~0.83 m verticale, ne peut pas atteindre la cible et le pied « s'arrête à mi-chemin »).
      // Le repère fixe reste au sol : le déplacement se lit dessus.
      const qf0 = qs.stepSide === "L" ? qs.footL : qs.footR;
      r.root.position.x += 0.5 * qf0.x;
      r.root.position.z += qf0.z - 0.09;
    }
    // Phase 15/16 — posture propre à la danse (lean = inclinaison du buste, lockUpperTrunk
    // préserve le pitch) + contraposition ida e volta (bas vs haut opposés, tango).
    // En paire (embrace), le lean est plafonné : le buste s'incline VERS le partenaire (contact
    // poitrine) sans plonger dans son ventre (sinon les estomacs se traversent).
    const posture = STYLES[styleKey].posture;
    const leanEff = embrace ? Math.min(posture.lean, 0.1) : posture.lean;
    r.chest.rotation.x += leanEff;
    if (r.head) r.head.rotation.x += leanEff;
    if (ida) {
      const ic = idaContra(b);
      r.root.rotation.y += ic.lowerYaw;
      r.chest.rotation.y += ic.upperYaw;
      if (r.head) r.head.rotation.y += ic.upperYaw;
    }
    applyDanceFrame(r, cadre);
    // En paire, la suiveuse a son propre cadre (coude G levé, main D en contact avec le guideur).
    if (cadre && pair && side === "follower") applyFollowerFrame(r, cadre);
    r.root.position.y = clampSolY(r.root.position.y, r.root.position.y); // clamp sol root >= 0

    // Appuis : charge pied droit (support) -> pastilles au sol + chaîne pied→genou→hanche
    // emissive côté chargé + stats HUD (charge G/D %, flexion genoux, roll bassin).
    const loadR = Math.max(0, Math.min(1, (supportOf(styleKey, r, b) + 1) / 2));
    const loadL = 1 - loadR;
    if (r.padR && r.padL) {
      const outer = r.root.parent as THREE.Group;
      for (const [sd, pad, load] of [["R", r.padR, loadR], ["L", r.padL, loadL]] as [Side, THREE.Mesh, number][]) {
        const foot = (sd === "R" ? r.footR : r.footL) as THREE.Object3D;
        foot.getWorldPosition(tmp);
        const local = outer.worldToLocal(tmp.clone());
        pad.position.set(local.x, 0.004, local.z);
        const pm = pad.material as THREE.MeshBasicMaterial;
        pm.opacity = 0.12 + 0.78 * load;
        const sc = 0.7 + 0.55 * load;
        pad.scale.set(sc, 1, sc);
      }
    }
    for (const sd of ["R", "L"] as Side[]) {
      const load = sd === "R" ? loadR : loadL;
      const k = showAppui ? Math.max(0, Math.min(1, (load - 0.5) / 0.5)) : 0;
      for (const mesh of chainMeshes.current[sd]) {
        ((mesh.material as THREE.MeshStandardMaterial).emissive as THREE.Color)
          .copy(chainColor)
          .multiplyScalar(0.85 * k);
      }
      if (showMuscles) {
        for (const mm of muscleMeshes.current) {
          if (!mm.name.endsWith("_" + sd)) continue;
          ((mm.material as THREE.MeshStandardMaterial).emissive as THREE.Color)
            .copy(chainColor)
            .multiplyScalar(0.95 * k);
        }
      }
    }
    if (stats) {
      const q = new THREE.Quaternion();
      r.root.getWorldQuaternion(q);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      const wp = new THREE.Vector3();
      r.root.getWorldPosition(wp);
      stats.current = {
        loadR,
        loadL,
        kneeR: (r.kneeR.rotation.x * 180) / Math.PI,
        kneeL: (r.kneeL.rotation.x * 180) / Math.PI,
        roll: (r.pelvis.rotation.z * 180) / Math.PI,
        stab: upperStability({ spine: r.spine.rotation, chest: r.chest.rotation }, r.pelvis.rotation),
        facing: facingSector(Math.atan2(fwd.x, fwd.z)),
        posX: wp.x,
        posZ: wp.z,
      };
    }

    // Cible de lacet monde par pied pour la vírgula (quarts de tour : cible propre à chaque
    // pied ; sinon lacet du corps, voir bloc vírgula ci-dessous).
    const footYawTarget: Record<Side, number> = { R: 0, L: 0 };
    const w = plantBlend(travel, plant);
    if (w > 0.001 && ik.current.ready) {
      r.root.updateWorldMatrix(true, true);
      const outer = r.root.parent as THREE.Group;
      const skelNode = r["Skeleton"] as THREE.Object3D;
      const state = ik.current;
      const beat = swingBeat(b, temps3);
      let swingSide: Side = beat % 2 === 0 ? "L" : "R";
      let stepDir = 0; // ida e volta : pas en avant/arrière (axe z)
      if (ida) {
        const st = idaEVoltaStep(b);
        swingSide = st.side;
        stepDir = st.dir;
      }
      // Phase 14 — quarts de tour : demi-pas de 2 temps, pied = qs.stepSide, cible absolue monde.
      const qf = qs ? (qs.stepSide === "L" ? qs.footL : qs.footR) : null;
      if (qs) swingSide = qs.stepSide;
      const stepIdx = qs ? Math.floor(b / 2) : ida ? Math.floor(b / 2) : beat;
      const stepLen = qs ? 2 : ida ? 2 : temps3 ? 3 : 1;
      const walking = travel > 0.001 || ida || !!qs;
      if (stepIdx !== state.lastBeat) {
        state.lastBeat = stepIdx;
        // sur place planté (travel=0) sans ida ni quarts : pas de pas, les pieds restent plantés
        if (walking) {
        const to = qf
          ? new THREE.Vector3(qf.x, state.ankleOuterY, qf.z)
          : new THREE.Vector3(
              r.root.position.x + state.hipSkel[swingSide].x,
              state.ankleOuterY,
              state.footZ[swingSide] + stepDir * 0.09
            );
        state.swing[swingSide] = { from: state.footPos[swingSide].clone(), to, t: 0, yawFrom: state.footYaw[swingSide], yawTo: qf ? qf.yaw : undefined };
        }
      }
      const lift = travel > 0.001 ? travel : ida ? 0.5 : qs ? 0.04 : 0;
      for (const s of ["R", "L"] as Side[]) {
        let target: THREE.Vector3;
        const sw = state.swing[s];
        if (qs) footYawTarget[s] = s === "L" ? qs.footL.yaw : qs.footR.yaw;
        if (walking && sw && s === swingSide) {
          sw.t = Math.min(1, (b - stepIdx * stepLen) / (0.6 * stepLen));
          const e = sw.t * sw.t * (3 - 2 * sw.t);
          target = sw.from.clone().lerp(sw.to, e);
          target.y = state.ankleOuterY + swingLift(sw.t, lift);
          if (sw.yawTo !== undefined) {
            const yf = sw.yawFrom ?? 0;
            footYawTarget[s] = yf + (sw.yawTo - yf) * e;
          }
          if (sw.t >= 1) {
            state.plant[s].copy(sw.to);
            if (sw.yawTo !== undefined) state.footYaw[s] = sw.yawTo;
            state.swing[s] = null;
          }
        } else {
          if (sw) {
            state.plant[s].copy(sw.to);
            if (sw.yawTo !== undefined) state.footYaw[s] = sw.yawTo;
            state.swing[s] = null;
          }
          target = state.plant[s].clone();
        }
        state.footPos[s] = target;

        const aWorld = outer.localToWorld(target.clone());
        const aSkel = skelNode.worldToLocal(aWorld);
        // Posture (phase 15) : flexion de base des genoux PROPRE À LA DANSE, intégrée DANS la
        // résolution (tibia effectif raccourci) -> le genou plie vraiment et le pied reste sur
        // sa cible (ajouter la flexion après la résolution ferait reculer le pied, la jambe
        // étant déjà à extension max au repos).
        const L2eff = state.L2[s] * (1 - posture.knee * 0.12);
        const sol = solveLeg3D(
          state.hipSkel[s],
          aSkel,
          state.L1[s],
          L2eff,
          state.f0[s],
          state.t0[s]
        );
        const hip = (s === "R" ? r.hipR : r.hipL) as THREE.Object3D;
        const knee = (s === "R" ? r.kneeR : r.kneeL) as THREE.Object3D;
        const foot = (s === "R" ? r.footR : r.footL) as THREE.Object3D;
        const extra = s === "R" ? r.extraR : r.extraL;
        const qStyle = new THREE.Quaternion().setFromEuler(hip.rotation);
        hip.quaternion.copy(qStyle).slerp(sol.qHip, w);
        hip.rotation.setFromQuaternion(hip.quaternion);
        knee.rotation.x = knee.rotation.x * (1 - w) + sol.beta * w;
        foot.rotation.x = -(hip.rotation.x + knee.rotation.x) + extra;
        foot.rotation.z = -hip.rotation.z;
      }
    } else {
      r.kneeL.rotation.x += posture.knee;
      r.kneeR.rotation.x += posture.knee;
      r.footL.rotation.x = -(r.hipL.rotation.x + r.kneeL.rotation.x) + r.extraL;
      r.footR.rotation.x = -(r.hipR.rotation.x + r.kneeR.rotation.x) + r.extraR;
      if (qs) {
        footYawTarget.L = qs.footL.yaw;
        footYawTarget.R = qs.footR.yaw;
      }
    }

    if (qs || corridinho) {
      // Phase 11/14 — vírgula (docs/virgula.md) : le pied pivote sur la boule du pied avec le
      // corps (contact sol constant). Sur les quarts de tour chaque pied a sa propre cible de
      // lacet (qs.footX.yaw, talon G à 90° puis pied D parallèle) ; sinon lacet = lacet du root.
      r.root.updateWorldMatrix(true, true);
      const qR = new THREE.Quaternion();
      r.root.getWorldQuaternion(qR);
      const bodyYaw = new THREE.Euler().setFromQuaternion(qR, "YXZ").y;
      for (const s of ["R", "L"] as Side[]) {
        const foot = (s === "R" ? r.footR : r.footL) as THREE.Object3D;
        const qF = new THREE.Quaternion();
        foot.getWorldQuaternion(qF);
        const fy = new THREE.Euler().setFromQuaternion(qF, "YXZ").y;
        const targetYaw = qs ? footYawTarget[s] : bodyYaw;
        foot.rotation.y += virgulaFootYawDelta(fy, targetYaw);
      }
    }

    const tx = embrace ? -1.05 : -0.25;
    const tf = embrace ? -0.55 : -0.3;
    if (!cadre && r.armUL && r.armUR && r.armFL && r.armFR) {
      [r.armUL, r.armUR].forEach((g: THREE.Group) => {
        g.rotation.x += (tx - g.rotation.x) * 0.08;
      });
      [r.armFL, r.armFR].forEach((g: THREE.Group) => {
        g.rotation.x += (tf - g.rotation.x) * 0.08;
      });
    }
    // Clamp sol renforcé (demande 2026-11-19) : aucun sommet d'os sous y=0 — si un maillage
    // dépasse sous le sol (pied planté, flexion genou), on remonte tout le root d'autant.
    const dip = groundDip(r.root);
    if (dip > 0) r.root.position.y = clampSolY(r.root.position.y + dip, r.root.position.y + dip);
    if (lastGhost.current !== ghost) {
      lastGhost.current = ghost;
      r.root.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh || (o as THREE.Mesh).userData.part === "anchor") return;
        const mesh = o as THREE.Mesh;
        if (mesh.userData.part === "torso") {
          ((mesh.material as THREE.Material) as THREE.MeshStandardMaterial).opacity = ghost
            ? 0.02
            : torsoOp;
        } else if (mesh.userData.part === "muscle") {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = ghost ? 0.06 : MUSCLE_OPACITY;
        } else {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.transparent = ghost;
          mat.opacity = ghost ? 0.1 : 1;
        }
      });
    }
    if (playing) {
      r.pelvis.getWorldPosition(tmp);
      const attr = trail.geometry.attributes.position as THREE.BufferAttribute;
      if (count.current < TRAIL_MAX) {
        attr.setXYZ(count.current, tmp.x, tmp.y, tmp.z);
        count.current += 1;
      } else {
        attr.array.copyWithin(0, 3);
        attr.setXYZ(TRAIL_MAX - 1, tmp.x, tmp.y, tmp.z);
      }
      attr.needsUpdate = true;
      trail.geometry.setDrawRange(0, count.current);
    }
  });

  return (
    <>
      <group position={offset} rotation={[0, rotationY, 0]}>
        <group ref={reg("root")}>
          <group ref={reg("pelvis")} position={[0, HIP_Y, 0]}>
            <primitive object={skel} />
            <mesh
              ref={reg("contactPelvis")}
              userData={{ part: "anchor" }}
              position={[0, 0, 0.14]}
              visible={showContacts}
            >
              <sphereGeometry args={[0.038, 12, 10]} />
              <meshBasicMaterial color="#64748b" />
            </mesh>
            {/* Phase 15 — points de contact des genoux (l'embrace touche aussi cuisses/genoux) */}
            <mesh ref={reg("contactKneeL")} userData={{ part: "anchor" }} position={[0.084, -0.44, 0.135]} visible={showContacts}>
              <sphereGeometry args={[0.034, 12, 10]} />
              <meshBasicMaterial color="#64748b" />
            </mesh>
            <mesh ref={reg("contactKneeR")} userData={{ part: "anchor" }} position={[-0.084, -0.44, 0.135]} visible={showContacts}>
              <sphereGeometry args={[0.034, 12, 10]} />
              <meshBasicMaterial color="#64748b" />
            </mesh>
            <group ref={reg("torso")} visible={showTorso}>
              <group ref={reg("spine")} position={[0, 0.08, 0]}>
                <mesh userData={{ part: "torso" }} position={[0, 0.06, 0]}>
                  <cylinderGeometry args={[0.05, 0.055, 0.14, 10]} />
                  <meshStandardMaterial
                    color={BODY_DARK}
                    roughness={0.6}
                    transparent
                    opacity={torsoOp}
                  />
                </mesh>
                <group ref={reg("lumbar")} position={[0, 0.05, 0]}>
                  <mesh userData={{ part: "torso" }} position={[0, 0.03, 0]}>
                    <cylinderGeometry args={[0.048, 0.05, 0.07, 10]} />
                    <meshStandardMaterial
                      color={BODY_DARK}
                      roughness={0.6}
                      transparent
                      opacity={torsoOp}
                    />
                  </mesh>
                </group>
                <group ref={reg("thoracic")} position={[0, 0.13, 0]}>
                  <mesh userData={{ part: "torso" }} position={[0, 0.05, 0]}>
                    <cylinderGeometry args={[0.05, 0.052, 0.1, 10]} />
                    <meshStandardMaterial
                      color={BODY_DARK}
                      roughness={0.6}
                      transparent
                      opacity={torsoOp}
                    />
                  </mesh>
                </group>
                <group ref={reg("chest")} position={[0, 0.24, 0]}>
                  <mesh userData={{ part: "torso" }}>
                    <boxGeometry args={[0.3, 0.26, 0.18]} />
                    <meshStandardMaterial
                      color={BODY}
                      roughness={0.6}
                      transparent
                      opacity={torsoOp}
                    />
                  </mesh>
                  <mesh userData={{ part: "torso" }} position={[-0.19, 0.1, 0]}>
                    <sphereGeometry args={[0.05, 12, 10]} />
                    <meshStandardMaterial
                      color={BODY_DARK}
                      roughness={0.6}
                      transparent
                      opacity={torsoOp}
                    />
                  </mesh>
                  <mesh userData={{ part: "torso" }} position={[0.19, 0.1, 0]}>
                    <sphereGeometry args={[0.05, 12, 10]} />
                    <meshStandardMaterial
                      color={BODY_DARK}
                      roughness={0.6}
                      transparent
                      opacity={torsoOp}
                    />
                  </mesh>
                  {[-1, 1].map((sxi) => (
                    <group
                      key={sxi}
                      ref={reg(sxi < 0 ? "armUL" : "armUR")}
                      position={[0.19 * sxi, 0.1, 0]}
                      rotation={[0, 0, -0.12 * sxi]}
                    >
                      <mesh userData={{ part: "torso" }} position={[0, -0.13, 0]}>
                        <cylinderGeometry args={[0.034, 0.03, 0.26, 10]} />
                        <meshStandardMaterial
                          color={BODY}
                          roughness={0.6}
                          transparent
                          opacity={torsoOp}
                        />
                      </mesh>
                      <group ref={reg(sxi < 0 ? "armFL" : "armFR")} position={[0, -0.26, 0]}>
                        <mesh userData={{ part: "torso" }} position={[0, -0.11, 0]}>
                          <cylinderGeometry args={[0.028, 0.024, 0.22, 10]} />
                          <meshStandardMaterial
                            color={BODY_DARK}
                            roughness={0.6}
                            transparent
                            opacity={torsoOp}
                          />
                        </mesh>
                        <mesh userData={{ part: "torso" }} position={[0, -0.24, 0]}>
                          <sphereGeometry args={[0.04, 10, 8]} />
                          <meshStandardMaterial
                            color={STYLES[styleKey].color}
                            roughness={0.5}
                            transparent
                            opacity={torsoOp}
                          />
                        </mesh>
                      </group>
                    </group>
                  ))}
                  <mesh
                    ref={reg("contactChest")}
                    userData={{ part: "anchor" }}
                    position={[0, 0, 0.16]}
                    visible={showContacts}
                  >
                    <sphereGeometry args={[0.038, 12, 10]} />
                    <meshBasicMaterial color="#64748b" />
                  </mesh>
                  <group ref={reg("head")} position={[0, 0.28, 0]}>
                    <mesh userData={{ part: "torso" }}>
                      <sphereGeometry args={[0.075, 16, 12]} />
                      <meshStandardMaterial
                        color="#cbd5e1"
                        roughness={0.5}
                        transparent
                        opacity={torsoOp}
                      />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      {showAppui && (
        <>
          <mesh ref={reg("padR")} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.1, 24]} />
            <meshBasicMaterial
              color={STYLES[styleKey].color}
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={reg("padL")} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.1, 24]} />
            <meshBasicMaterial
              color={STYLES[styleKey].color}
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
      </group>
      <primitive object={trail} />
    </>
  );
}
