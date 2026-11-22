// Tête et pieds chaussés d'une mascotte de ReCoDanse posés sur un danseur du moteur. three.js pur.
//
// Le moteur prime : rien ici ne déplace un os. La tête suit le nœud `head` du moteur ; chaque pied chaussé
// suit le nœud de cheville (`AnklePivot`), sa semelle dans le plan de la semelle anatomique : un pied à plat
// pour le moteur est une chaussure à plat sur le sol.
import * as THREE from "three";
import type { RigHandle } from "@moteur/anatomy";
import type { Cote } from "./haut";

type V3 = [number, number, number];
/** Repère des pièces : celui du glTF exporté (mètres, +y haut, +z vers l'avant du personnage, sol à y = 0). */
export interface ManifesteMascotte {
  nom: string; source: string; date: string;
  /** Échelle des pièces sur le squelette du moteur (1 : les mascottes sont déjà à ses proportions). */
  echelle?: number;
  /** Épaisseur du trait d'encre (m). */
  encre?: number;
  pieces: {
    /** `pivot` : l'articulation de la tête sur le cou. */
    tete?: { glb: string; pivot: V3 };
    /** `cheville` : l'articulation de la cheville ; `sol` : la hauteur du dessous de la semelle. */
    piedL?: Pied;
    piedR?: Pied;
    /** Autres jeux de pieds : `piedL_<jeu>`, `piedR_<jeu>`. */
    [autre: string]: Pied | { glb: string; pivot: V3 } | undefined;
  };
  /** Mesures relevées à l'export (longueurs, angle du pied…), pour le rapport. */
  mesures?: Record<string, number>;
}
export interface Pied { glb: string; cheville: V3; sol: number }
export interface ModeleMascotte { manifeste: ManifesteMascotte; pieces: Record<string, THREE.Object3D> }

/** Trait d'encre : la coque du maillage, retournée et gonflée le long des normales. */
function matiereEncre(epaisseur: number) {
  const m = new THREE.MeshBasicMaterial({ color: "#16121a", side: THREE.BackSide });
  m.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\n  transformed += normalize(objectNormal) * ${epaisseur.toFixed(5)};`);
  };
  m.customProgramCacheKey = () => `encre-${epaisseur.toFixed(5)}`;
  return m;
}

/** Copie d'une pièce dans ses aplats (couleurs cuites dans les sommets à l'export, sans éclairage : la
 * palette est celle du personnage), avec son trait d'encre (coque inversée). */
function aplats(source: THREE.Object3D, encre: number): THREE.Object3D {
  const ENCRE = encre > 0 ? matiereEncre(encre) : null;
  const copie = source.clone(true);
  const traits: [THREE.Mesh, THREE.Object3D][] = [];
  copie.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.userData.part = "anchor"; // ignoré par le moteur (semelles, sol, fantôme)
    const peint = !!mesh.geometry.getAttribute("color");
    mesh.material = new THREE.MeshBasicMaterial({ vertexColors: peint, color: peint ? "#ffffff" : "#8b8b8b", side: THREE.DoubleSide });
    if (ENCRE && mesh.geometry.getAttribute("normal")) traits.push([mesh, mesh.parent!]);
  });
  for (const [mesh, parent] of traits) {
    const trait = new THREE.Mesh(mesh.geometry, ENCRE!);
    trait.position.copy(mesh.position); trait.quaternion.copy(mesh.quaternion); trait.scale.copy(mesh.scale);
    trait.userData.part = "anchor";
    parent.add(trait);
  }
  return copie;
}

/** Plan de la semelle et axe du pied anatomique, dans le repère de la cheville (pied au repos). */
function semelle(pied: THREE.Object3D) {
  pied.updateWorldMatrix(true, true);
  const inverse = pied.matrixWorld.clone().invert(), pts: THREE.Vector3[] = [];
  pied.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.part === "anchor" || mesh.userData.part === "muscle") return;
    const p = mesh.geometry.getAttribute("position"), m = inverse.clone().multiply(mesh.matrixWorld);
    for (let i = 0; i < p.count; i++) pts.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(m));
  });
  const zs = pts.map(p => p.z), orteil = Math.max(...zs), talon = Math.min(...zs), longueur = orteil - talon;
  const centre = (de: number, a: number) => {
    const bande = pts.filter(p => p.z <= orteil - de * longueur && p.z >= orteil - a * longueur);
    return { x: bande.reduce((s, p) => s + p.x, 0) / bande.length, z: bande.reduce((s, p) => s + p.z, 0) / bande.length };
  };
  const t = centre(0.8, 1), b = centre(0.15, 0.33);
  return { y: Math.min(...pts.map(p => p.y)), lacet: Math.atan2(b.x - t.x, b.z - t.z), longueur };
}

export interface OptionsMascotte {
  tete: boolean; pieds: boolean; jeuPieds?: string; encre?: boolean; echelle?: number;
  /** Nœud qui porte la tête (voir `OptionsHaut.porteTete`). Par défaut le nœud `head` du moteur. */
  porteTete?: THREE.Object3D;
}

/** Une pièce de pied a une tige quand elle monte nettement au-dessus de sa cheville (la jambe de Corinne). */
const TIGE = { seuil: 0.06, debut: 0.025, fin: 0.085, coupe: 0.02 };
const lisse = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

interface PiedPose { groupe: THREE.Object3D; plan: THREE.Plane | null; repere: THREE.Vector3; coupes: THREE.Material[] }

export class Mascotte {
  readonly tete: THREE.Group | null = null;
  readonly pieds: Partial<Record<Cote, PiedPose>> = {};
  readonly echelle: number;
  private readonly caches: THREE.Object3D[] = [];

  constructor(private readonly r: RigHandle, modele: ModeleMascotte, o: OptionsMascotte) {
    const { manifeste: m, pieces } = modele;
    const k = this.echelle = o.echelle ?? m.echelle ?? 1, encre = o.encre === false ? 0 : m.encre ?? 0.0016;
    if (o.tete && m.pieces.tete && pieces.tete) {
      const g = this.tete = new THREE.Group();
      g.name = `pont_tete_${m.nom}`;
      g.add(aplats(pieces.tete, encre));
      g.scale.setScalar(k);
      g.position.set(...(m.pieces.tete as { pivot: V3 }).pivot).multiplyScalar(-k);
      (o.porteTete ?? r.head).add(g);
    }
    for (const s of ["L", "R"] as Cote[]) {
      const jeu = o.jeuPieds && pieces[`pied${s}_${o.jeuPieds}`] ? `pied${s}_${o.jeuPieds}` : `pied${s}`;
      const decl = m.pieces[jeu] as Pied | undefined, piece = pieces[jeu], cheville = r[`foot${s}`] as THREE.Object3D | undefined;
      if (!o.pieds || !decl || !piece || !cheville) continue;
      const sol = semelle(cheville), haut = new THREE.Box3().setFromObject(piece).max.y;
      const tige = haut - decl.sol - (decl.cheville[1] - decl.sol) > TIGE.seuil;
      // La jambe de la mascotte (sa tige) à l'aplomb de la cheville anatomique, le dessous de sa semelle dans
      // le plan de la semelle anatomique. Sans tige (un soulier bas), c'est la cheville qui sert de repère.
      const axe = tige ? axeDeTige(piece, haut) : new THREE.Vector3(decl.cheville[0], 0, decl.cheville[2]);
      const pose = new THREE.Matrix4().compose(new THREE.Vector3(), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), sol.lacet), new THREE.Vector3(k, k, k));
      const ancre = new THREE.Vector3(axe.x, decl.sol, axe.z).applyMatrix4(pose);
      pose.setPosition(-ancre.x, sol.y - ancre.y, -ancre.z);
      const copie = aplats(piece, encre);
      copie.name = `pont_pied${s}_${m.nom}`;
      let plan: THREE.Plane | null = null;
      const coupes: THREE.Material[] = [];
      if (tige) {
        // La tige suit le tibia, la chaussure suit le pied : peau à deux os, pesée par la hauteur.
        const tibia = cheville.parent!, a = cheville.position;
        const os = [cheville, tibia] as unknown as THREE.Bone[];
        const squelette = new THREE.Skeleton(os, [pose.clone(), new THREE.Matrix4().makeTranslation(a.x, a.y, a.z).multiply(pose)]);
        const hCheville = decl.cheville[1];
        copie.traverse(obj => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          if (!mesh.geometry.getAttribute("skinIndex")) {
            const p = mesh.geometry.getAttribute("position"), indices = new Uint16Array(p.count * 4), poids = new Float32Array(p.count * 4);
            for (let i = 0; i < p.count; i++) {
              const w = lisse(hCheville + TIGE.debut, hCheville + TIGE.fin, p.getY(i));
              indices[i * 4 + 1] = 1; poids[i * 4] = 1 - w; poids[i * 4 + 1] = w;
            }
            mesh.geometry.setAttribute("skinIndex", new THREE.BufferAttribute(indices, 4));
            mesh.geometry.setAttribute("skinWeight", new THREE.BufferAttribute(poids, 4));
          }
          const peau = new THREE.SkinnedMesh(mesh.geometry, mesh.material);
          peau.userData.part = "anchor"; peau.frustumCulled = false; peau.name = mesh.name;
          peau.bind(squelette, new THREE.Matrix4());
          mesh.visible = false;
          mesh.parent!.add(peau);
        });
        // Sous le haut de la tige, les os et les muscles de la jambe anatomique ne sont plus dessinés : ils
        // entrent dans la tige et s'y arrêtent. Le plan suit le tibia.
        plan = new THREE.Plane();
        for (const enfant of tibia.children) {
          const mesh = enfant as THREE.Mesh;
          if (!mesh.isMesh || mesh.userData.part === "anchor") continue;
          const mat = mesh.material as THREE.Material;
          mat.clippingPlanes = [plan]; mat.needsUpdate = true;
          coupes.push(mat);
        }
      } else copie.applyMatrix4(pose);
      cheville.add(copie);
      // Repère de la coupe dans le repère du tibia : le haut de la tige, un peu en dessous.
      const repere = new THREE.Vector3(axe.x, haut - TIGE.coupe, axe.z).applyMatrix4(pose).add(cheville.position);
      this.pieds[s] = { groupe: copie, plan, repere, coupes };
      // Les os du pied anatomique restent dans le moteur (ses appuis en dépendent) ; ils ne sont plus dessinés.
      cheville.traverse(os => {
        const mesh = os as THREE.Mesh;
        if (mesh.isMesh && mesh.userData.part !== "anchor" && mesh.visible) { mesh.visible = false; this.caches.push(mesh); }
      });
    }
  }

  /** À chaque image : les plans de coupe suivent les tibias. */
  maj() {
    for (const s of ["L", "R"] as Cote[]) {
      const p = this.pieds[s];
      if (!p?.plan) continue;
      const tibia = (this.r[`foot${s}`] as THREE.Object3D).parent!;
      tibia.updateWorldMatrix(true, false);
      const point = p.repere.clone().applyMatrix4(tibia.matrixWorld), haut = new THREE.Vector3(0, 1, 0).transformDirection(tibia.matrixWorld);
      p.plan.setFromNormalAndCoplanarPoint(haut, point);
    }
  }

  liberer() {
    this.tete?.removeFromParent();
    for (const p of Object.values(this.pieds)) {
      p?.groupe.removeFromParent();
      for (const mat of p?.coupes ?? []) { mat.clippingPlanes = null; mat.needsUpdate = true; }
    }
    for (const o of this.caches) o.visible = true;
  }
}

/** Axe de la tige d'une pièce de pied : le centre de sa tranche haute (dans le repère de la pièce). */
function axeDeTige(piece: THREE.Object3D, haut: number): THREE.Vector3 {
  piece.updateWorldMatrix(true, true);
  const c = new THREE.Vector3(), v = new THREE.Vector3();
  let n = 0;
  piece.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const p = mesh.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
      if (v.y > haut - 0.06) { c.add(v); n++; }
    }
  });
  return n ? c.divideScalar(n) : c;
}
