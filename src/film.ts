/** Filming the app frame by frame (#155, docs/spec-video-pas-de-base.md). Pure.
 *
 * With `film=1` the 3D scene no longer animates by itself: a script asks for each frame
 * (`window.__film.frame(t, view)`, src/components/FilmDriver.tsx). The dance clock stays the app's own
 * (DanceTransport), stepped by exactly one frame each time: what the film shows is what the app shows. */

/** A camera framing around a target: azimuth and elevation in degrees (0 = camera on the +Z side,
 * 90 = on the +X side, as `posFromView` in src/cameras.ts), distance in metres. */
export interface FilmView {
  az: number;
  el: number;
  dist: number;
  /** Point looked at; absent: the orbit target in force (the game view keeps it on the couple). */
  target?: [number, number, number];
  /** Vertical field of view in degrees; absent: the view's own. Zooms without moving the camera (the orbit
   * controls keep the camera at least 1.8 m away). */
  fov?: number;
  /** Lens shift, as a fraction of the frame width: 0.2 slides the subject 20 % of the frame to the left.
   * The camera itself does not move, so nothing fights the views that follow the couple. */
  shift?: number;
}

export const filmEnabled = (p: URLSearchParams): boolean => p.get("film") === "1";

/** Instant of a frame, in seconds from the start of the shot. */
export const frameTime = (frame: number, fps: number): number => frame / fps;

/** Beat reached at a frame when the dance runs at `bpm` from `startBeat`. */
export const frameBeat = (frame: number, fps: number, bpm: number, startBeat = 0): number =>
  startBeat + frame * bpm / (60 * fps);

/** Camera position for a view around `target`. */
export function filmCamera(view: Pick<FilmView, "az" | "el" | "dist">, target: readonly [number, number, number]): [number, number, number] {
  const az = view.az * Math.PI / 180, el = view.el * Math.PI / 180;
  const ground = view.dist * Math.cos(el);
  return [target[0] + ground * Math.sin(az), target[1] + view.dist * Math.sin(el), target[2] + ground * Math.cos(az)];
}

/** Horizontal offset of the rendered window for a lens shift, in pixels (`camera.setViewOffset`). */
export const filmShiftPixels = (shift: number | undefined, width: number): number => Math.round((shift ?? 0) * width);
