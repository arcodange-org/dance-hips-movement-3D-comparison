// Filming frame by frame (#155, docs/spec-video-pas-de-base.md): mounted inside a Canvas whose
// `frameloop` is "never", it lets a script (scripts/video/capturer.mjs) ask for each frame.
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type * as THREE from "three";
import { Vector3 } from "three";
import type { DanceClock } from "../clock";
import { FILM_FOLLOW_TAU, filmCamera, filmShiftPixels, followAngle, type FilmView } from "../film";

interface Orbit { target: THREE.Vector3; update: () => void }

export interface FilmApi {
  /** Number of meshes in the scene: the models are loaded once it stops growing. */
  meshes(): number;
  /** Beat of the dance clock. */
  beat(): number;
  /** World position of each dancer's pelvis (metres), in scene order: the film draws its path. */
  pelvis(): [number, number, number][];
  /** Steps the scene to the instant `t` (seconds), frames it, renders it; returns the image (JPEG data URL). */
  frame(t: number, view?: FilmView, quality?: number): string;
}

declare global { interface Window { __film?: FilmApi } }

export default function FilmDriver({ clock, controls, frameYaw }: {
  clock: DanceClock;
  /** Orbit controls of the scene; absent: the default controls of the Canvas. */
  controls?: React.RefObject<Orbit | null>;
  /** Orientation of the couple (radians about +y) at the current beat: a `relative` view follows it. */
  frameYaw?: () => number;
}) {
  const get = useThree(s => s.get);
  useEffect(() => {
    // Smoothed orientation of the couple and the instant it was last updated.
    const follow = { yaw: 0, t: -1 };
    const world = new Vector3();
    window.__film = {
      meshes() {
        let n = 0;
        get().scene.traverse(o => { if ((o as THREE.Mesh).isMesh) n++; });
        return n;
      },
      beat: () => clock.beat,
      pelvis() {
        const out: [number, number, number][] = [];
        get().scene.traverse(o => {
          if (o.userData.film !== "pelvis") return;
          o.getWorldPosition(world);
          out.push([world.x, world.y, world.z]);
        });
        return out;
      },
      frame(t, view, quality = 0.92) {
        const s = get();
        const orbit = controls?.current ?? (s.controls as unknown as Orbit | null);
        if (view) {
          if (view.target && orbit) orbit.target.set(...view.target);
          const target: [number, number, number] = orbit
            ? [orbit.target.x, orbit.target.y, orbit.target.z] : view.target ?? [0, 0.85, 0];
          let az = view.az;
          if (view.relative && frameYaw) {
            follow.yaw = followAngle(follow.yaw, frameYaw(), follow.t < 0 ? 0 : t - follow.t, FILM_FOLLOW_TAU);
            follow.t = t;
            az += follow.yaw * 180 / Math.PI;
          }
          s.camera.position.set(...filmCamera({ ...view, az }, target));
          s.camera.lookAt(...target);
          const shift = filmShiftPixels(view.shift, s.size.width);
          const cam = s.camera as THREE.PerspectiveCamera;
          if (view.fov && view.fov !== cam.fov) { cam.fov = view.fov; cam.updateProjectionMatrix(); }
          if (shift) cam.setViewOffset(s.size.width, s.size.height, shift, 0, s.size.width, s.size.height);
          else cam.clearViewOffset();
        }
        s.advance(t);
        return s.gl.domElement.toDataURL("image/jpeg", quality);
      },
    };
    return () => { delete window.__film; };
  }, [get, clock, controls, frameYaw]);
  return null;
}
