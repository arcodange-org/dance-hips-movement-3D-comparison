// Filming frame by frame (#155, docs/spec-video-pas-de-base.md): mounted inside a Canvas whose
// `frameloop` is "never", it lets a script (scripts/video/capturer.mjs) ask for each frame.
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type * as THREE from "three";
import type { DanceClock } from "../clock";
import { filmCamera, filmShiftPixels, type FilmView } from "../film";

interface Orbit { target: THREE.Vector3; update: () => void }

export interface FilmApi {
  /** Number of meshes in the scene: the models are loaded once it stops growing. */
  meshes(): number;
  /** Beat of the dance clock. */
  beat(): number;
  /** Steps the scene to the instant `t` (seconds), frames it, renders it; returns the image (JPEG data URL). */
  frame(t: number, view?: FilmView, quality?: number): string;
}

declare global { interface Window { __film?: FilmApi } }

export default function FilmDriver({ clock, controls }: {
  clock: DanceClock;
  /** Orbit controls of the scene; absent: the default controls of the Canvas. */
  controls?: React.RefObject<Orbit | null>;
}) {
  const get = useThree(s => s.get);
  useEffect(() => {
    window.__film = {
      meshes() {
        let n = 0;
        get().scene.traverse(o => { if ((o as THREE.Mesh).isMesh) n++; });
        return n;
      },
      beat: () => clock.beat,
      frame(t, view, quality = 0.92) {
        const s = get();
        const orbit = controls?.current ?? (s.controls as unknown as Orbit | null);
        if (view) {
          if (view.target && orbit) orbit.target.set(...view.target);
          const target: [number, number, number] = orbit
            ? [orbit.target.x, orbit.target.y, orbit.target.z] : view.target ?? [0, 0.85, 0];
          s.camera.position.set(...filmCamera(view, target));
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
  }, [get, clock, controls]);
  return null;
}
