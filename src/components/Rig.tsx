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
  BODY,
  BODY_DARK,
  TORSO_OPACITY,
  makeTrail,
  resetRig,
  type RigHandle,
} from "../anatomy";
import { STYLES } from "../styles";
import { solveLeg3D } from "../ik";

type Side = "R" | "L";

interface Swing {
  from: THREE.Vector3;
  to: THREE.Vector3;
  t: number;
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
}: RigProps) {
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
    lastBeat: -1,
  });
  const { scene } = useGLTF(ANATOMY_URL);
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
    state.ready = true;
  }, [skel, r]);
  useEffect(() => {
    count.current = 0;
    trail.geometry.setDrawRange(0, 0);
    t.current = 0;
    const state = ik.current;
    state.lastBeat = -1;
    state.swing.R = null;
    state.swing.L = null;
    for (const s of ["R", "L"] as Side[]) {
      state.plant[s].set(state.hipSkel[s].x, state.ankleOuterY, state.footZ[s]);
      state.footPos[s].copy(state.plant[s]);
    }
  }, [styleKey, trail]);
  useEffect(() => {
    if (pair && side) {
      pair.current[side] = { chest: r.contactChest, pelvis: r.contactPelvis };
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
    r.root.position.x += travel * (HIP_WIDTH / 2) * Math.tanh(2.2 * S2(b));
    if (r.root.position.y < 0) r.root.position.y = 0;

    const w = Math.min(1, travel / 0.2);
    if (w > 0.001 && ik.current.ready) {
      r.root.updateWorldMatrix(true, true);
      const outer = r.root.parent as THREE.Group;
      const skelNode = r["Skeleton"] as THREE.Object3D;
      const state = ik.current;
      const beat = Math.floor(b);
      const swingSide: Side = beat % 2 === 0 ? "L" : "R";
      if (beat !== state.lastBeat) {
        state.lastBeat = beat;
        const to = new THREE.Vector3(
          r.root.position.x + state.hipSkel[swingSide].x,
          state.ankleOuterY,
          state.footZ[swingSide]
        );
        state.swing[swingSide] = { from: state.footPos[swingSide].clone(), to, t: 0 };
      }
      for (const s of ["R", "L"] as Side[]) {
        let target: THREE.Vector3;
        const sw = state.swing[s];
        if (sw && s === swingSide) {
          sw.t = Math.min(1, (b - beat) / 0.6);
          const e = sw.t * sw.t * (3 - 2 * sw.t);
          target = sw.from.clone().lerp(sw.to, e);
          target.y = state.ankleOuterY + 0.05 * travel * Math.sin(Math.PI * sw.t);
          if (sw.t >= 1) {
            state.plant[s].copy(sw.to);
            state.swing[s] = null;
          }
        } else {
          if (sw) {
            state.plant[s].copy(sw.to);
            state.swing[s] = null;
          }
          target = state.plant[s].clone();
        }
        state.footPos[s] = target;

        const aWorld = outer.localToWorld(target.clone());
        const aSkel = skelNode.worldToLocal(aWorld);
        const sol = solveLeg3D(
          state.hipSkel[s],
          aSkel,
          state.L1[s],
          state.L2[s],
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
      r.footL.rotation.x = -(r.hipL.rotation.x + r.kneeL.rotation.x) + r.extraL;
      r.footR.rotation.x = -(r.hipR.rotation.x + r.kneeR.rotation.x) + r.extraR;
    }

    const tx = embrace ? -1.05 : -0.25;
    const tf = embrace ? -0.55 : -0.3;
    if (r.armUL && r.armUR && r.armFL && r.armFR) {
      [r.armUL, r.armUR].forEach((g: THREE.Group) => {
        g.rotation.x += (tx - g.rotation.x) * 0.08;
      });
      [r.armFL, r.armFR].forEach((g: THREE.Group) => {
        g.rotation.x += (tf - g.rotation.x) * 0.08;
      });
    }
    if (lastGhost.current !== ghost) {
      lastGhost.current = ghost;
      r.root.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh || (o as THREE.Mesh).userData.part === "anchor") return;
        const mesh = o as THREE.Mesh;
        if (mesh.userData.part === "torso") {
          ((mesh.material as THREE.Material) as THREE.MeshStandardMaterial).opacity = ghost
            ? 0.02
            : TORSO_OPACITY;
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
              position={[0, 0, 0.12]}
              visible={showContacts}
            >
              <sphereGeometry args={[0.038, 12, 10]} />
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
                    opacity={TORSO_OPACITY}
                  />
                </mesh>
                <group ref={reg("lumbar")} position={[0, 0.05, 0]}>
                  <mesh userData={{ part: "torso" }} position={[0, 0.03, 0]}>
                    <cylinderGeometry args={[0.048, 0.05, 0.07, 10]} />
                    <meshStandardMaterial
                      color={BODY_DARK}
                      roughness={0.6}
                      transparent
                      opacity={TORSO_OPACITY}
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
                      opacity={TORSO_OPACITY}
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
                      opacity={TORSO_OPACITY}
                    />
                  </mesh>
                  <mesh userData={{ part: "torso" }} position={[-0.19, 0.1, 0]}>
                    <sphereGeometry args={[0.05, 12, 10]} />
                    <meshStandardMaterial
                      color={BODY_DARK}
                      roughness={0.6}
                      transparent
                      opacity={TORSO_OPACITY}
                    />
                  </mesh>
                  <mesh userData={{ part: "torso" }} position={[0.19, 0.1, 0]}>
                    <sphereGeometry args={[0.05, 12, 10]} />
                    <meshStandardMaterial
                      color={BODY_DARK}
                      roughness={0.6}
                      transparent
                      opacity={TORSO_OPACITY}
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
                          opacity={TORSO_OPACITY}
                        />
                      </mesh>
                      <group ref={reg(sxi < 0 ? "armFL" : "armFR")} position={[0, -0.26, 0]}>
                        <mesh userData={{ part: "torso" }} position={[0, -0.11, 0]}>
                          <cylinderGeometry args={[0.028, 0.024, 0.22, 10]} />
                          <meshStandardMaterial
                            color={BODY_DARK}
                            roughness={0.6}
                            transparent
                            opacity={TORSO_OPACITY}
                          />
                        </mesh>
                        <mesh userData={{ part: "torso" }} position={[0, -0.24, 0]}>
                          <sphereGeometry args={[0.04, 10, 8]} />
                          <meshStandardMaterial
                            color={STYLES[styleKey].color}
                            roughness={0.5}
                            transparent
                            opacity={TORSO_OPACITY}
                          />
                        </mesh>
                      </group>
                    </group>
                  ))}
                  <mesh
                    ref={reg("contactChest")}
                    userData={{ part: "anchor" }}
                    position={[0, 0, 0.13]}
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
                        opacity={TORSO_OPACITY}
                      />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
      <primitive object={trail} />
    </>
  );
}
