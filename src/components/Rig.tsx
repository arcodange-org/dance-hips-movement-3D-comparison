import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ANATOMY_URL, HIP_Y, TRAIL_MAX, BODY, BODY_DARK, TORSO_OPACITY, makeTrail, type RigHandle } from "../anatomy";
import { STYLES, type MovementKey } from "../styles";
import { applyPose, bindSkeleton, createPoseModel, type PoseModel, type Side } from "../pose";
import { type DanceClock } from "../clock";
import type { GuideSession } from "../guidage";
import { applyGuidePose, type PelvisCache } from "../guidagePose";
import { TORSO_JOINTS } from "../rigJoints";
import type { SortieFilleVariant } from "../sortieFille";
import type { CouplePlacement } from "../placement";
import { DEFAULT_SORTIE_CONTRA, type SortieVariant } from "../sortieGarcon";
import {
  MUSCLES_URL,
  DRACO_DECODER_PATH,
  MUSCLE_OPACITY,
  muscleParent,
  parentOffsetSkel,
  makeMuscleMaterial,
} from "../muscles";

export interface RigProps {
  styleKey: string;
  bpm: number;
  clock: DanceClock;
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
  movement?: MovementKey; // phase 17 : option de déplacement exclusive (inclut les sorties)
  sortieFilleVariant?: SortieFilleVariant;
  placement?: CouplePlacement; // five-action figures only; undefined = validated spacing
  contraposition?: number; // #51: 1 = chest faces the partner, 0 = aligned with the pelvis
  sortieVariant?: SortieVariant;
  sortieContra?: number;
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
  /** #69 guide mode: the session picks the pair figure and its local beat (docs/spec-mode-guidage-poc.md). */
  guide?: GuideSession | null;
}

export default function Rig({
  styleKey,
  bpm,
  clock,
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
  movement = "none" as MovementKey,
  sortieFilleVariant = "hook",
  placement,
  contraposition,
  sortieVariant = "line",
  sortieContra = DEFAULT_SORTIE_CONTRA,
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
  guide = null,
}: RigProps) {
  const torsoOp = torsoOpacity ?? TORSO_OPACITY;
  const r = useRef({} as RigHandle).current;
  const reg = (n: string) => (el: any) => {
    r[n] = el;
  };
  const poseModel = useRef<PoseModel | null>(null);
  const guideHeights = useRef<PelvisCache>(new Map());
  const count = useRef(0);
  const trailRevision = useRef(clock.revision);
  const trailExporting = useRef(false);
  const trailExportFrame = useRef<number | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const trail = useMemo(() => makeTrail(STYLES[styleKey].color), [styleKey]);
  const lastGhost = useRef<boolean | null>(null);
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
    bindSkeleton(r, skel);
    poseModel.current = createPoseModel(r);
    for (const sd of ["R", "L"] as Side[]) {
      const list: THREE.Mesh[] = [];
      for (const n of ["Femur", "Tibia", "Fibula", "Patella", "Foot", "HipBone"]) {
        const m = r[`${n}_${sd}`] as THREE.Mesh | undefined;
        if (m && m.isMesh) list.push(m);
      }
      chainMeshes.current[sd] = list;
    }
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
  }, [styleKey, trail]);
  useEffect(() => {
    if (embrace && (movement === "sortieG" || movement === "sortieF")) {
      count.current = 0; trail.geometry.setDrawRange(0, 0);
    }
  }, [embrace, movement, placement, sortieFilleVariant, sortieVariant, trail]);
  useEffect(() => {
    if (pair && side) {
      pair.current[side] = { chest: r.contactChest, pelvis: r.contactPelvis, kneeL: r.contactKneeL, kneeR: r.contactKneeR,
        hipR: r.hipR, femurKneeR: r.kneeR };
      return () => {
        pair.current[side] = null;
      };
    }
  }, [pair, side, r]);

  useFrame(() => {
    if (!poseModel.current || !r.footL) return;
    if (embrace && (movement === "sortieG" || movement === "sortieF") && trailRevision.current !== clock.revision) {
      count.current = 0; trail.geometry.setDrawRange(0, 0);
    }
    trailRevision.current = clock.revision;
    // #69 guide mode: the session chooses the figure (through the neutral quinconce) and its local beat;
    // the leader binds the session to the GLB's rest stance once.
    const model = poseModel.current;
    if (guide && side === "leader") {
      const key = `${placement ?? "reference"}:${amp}`;
      if (guide.boundKey !== key) {
        const rest = { L: model.legs.L.rest, R: model.legs.R.rest };
        const stance = (model.legs.L.hipX - rest.L.x + rest.R.x - model.legs.R.hipX) / 2;
        guide.bind({ rest, stance, placement: placement ?? "quinconce", amp }, key);
      }
    }
    const guided = guide && side && placement !== undefined ? guide.sample(clock.beat) : null;
    const result = guided
      ? applyGuidePose(r, model, guided, { styleKey, amp, iso, cadre, placement, contraposition: contraposition ?? 1 },
        side === "follower", guideHeights.current)
      : applyPose(r, model, clock.beat + phaseOffset, {
        styleKey, amp, travel, dir, movement, embrace, corridinho, reverse, quarts,
        iso, ida, cadre, plant, temps3, follower: side === "follower", sortieVariant, sortieContra, sortieFilleVariant,
        placement: placement ?? "reference",
        // #37: in pair, the quarter turns use the couple model (placement given by the app).
        quartsPaire: embrace && movement === "quarts" && placement !== undefined,
        // #54: in pair, the ida e volta uses the couple model (leader forward, follower back).
        idaPaire: embrace && movement === "ida" && placement !== undefined,
        // #51: plexus-to-plexus contact in the pair figures.
        plexus: embrace && placement !== undefined && (movement === "sortieG" || movement === "sortieF" || movement === "quarts" || movement === "ida"),
        contraposition: contraposition ?? 1,
      });
    if (stats) stats.current = result;
    const { loadL, loadR } = result;
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
    const exporting = clock.exportFrame !== null;
    if (exporting !== trailExporting.current) {
      count.current = 0;
      trail.geometry.setDrawRange(0, 0);
      trailExportFrame.current = null;
      trailExporting.current = exporting;
    }
    if (exporting ? clock.exportFrame !== trailExportFrame.current : playing) {
      trailExportFrame.current = clock.exportFrame;
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
  }, -10);

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
              <group ref={reg("spine")} position={TORSO_JOINTS.spine}>
                <mesh userData={{ part: "torso" }} position={[0, 0.06, 0]}>
                  <cylinderGeometry args={[0.05, 0.055, 0.14, 10]} />
                  <meshStandardMaterial
                    color={BODY_DARK}
                    roughness={0.6}
                    transparent
                    opacity={torsoOp}
                  />
                </mesh>
                <group ref={reg("lumbar")} position={TORSO_JOINTS.lumbar}>
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
                <group ref={reg("thoracic")} position={TORSO_JOINTS.thoracic}>
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
                <group ref={reg("chest")} position={TORSO_JOINTS.chest}>
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
                  <group ref={reg("head")} position={TORSO_JOINTS.head}>
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
      {/* #69: the guide mode moves the couple frame; a world-space trail would be transformed twice. */}
      {!guide && <primitive object={trail} />}
    </>
  );
}
