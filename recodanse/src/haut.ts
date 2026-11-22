// Haut du corps anatomique d'un danseur du moteur : thorax, colonne, cou, ceinture scapulaire, bras,
// avant-bras et mains (os et muscles BodyParts3D, actifs/anatomie_haut.glb). three.js pur, sans React :
// le même code sert à la vue et aux tests en node.
//
// Le moteur prime : le bassin, la colonne, le thorax et la tête sont SES nœuds ; la main anatomique vient
// là où il pose la sienne. Le pont ajoute ce que le moteur ne décrit pas : le coude aux longueurs
// anatomiques, la pronation de l'avant-bras (le radius tourne autour de l'ulna) et l'orientation de la paume.
// Rien ici ne dépend du temps : la pose est une fonction de la pose du moteur.
import * as THREE from "three";
import type { RigHandle } from "@moteur/anatomy";
import { ARM_JOINTS, TORSO_JOINTS } from "@moteur/rigJoints";
import { CADRE_SITES, solveArm } from "@moteur/cadre";

export type Cote = "L" | "R";
type V3 = [number, number, number];
export interface ManifesteHaut {
  attribution: string;
  segments: string[];
  moteur: Record<"bassin" | "colonne" | "thorax" | "tete", V3>;
  articulations: Record<string, V3>;
  axes: Record<Cote, { bras: V3; charniere: V3; pronation: V3; teteRadiale: V3; paume: V3; normalePaume: V3; doigts: V3; boutMajeur: V3 }>;
  mesures: Record<Cote, { bras: number; avantBras: number; coudePaume: number }>;
  pieces: { nom: string; type: "os" | "muscle"; groupe: string; cote: Cote | "C" }[];
}
export interface PieceHaut { nom: string; type: "os" | "muscle"; groupe: string; cote: Cote | "C"; geometrie: THREE.BufferGeometry }
export interface ModeleHaut { manifeste: ManifesteHaut; pieces: PieceHaut[] }

/** Lit les pièces d'un GLB chargé (GLTFLoader) : géométries pesées, partagées entre les danseurs. */
export function lireModele(scene: THREE.Object3D, manifeste: ManifesteHaut): ModeleHaut {
  const pieces: PieceHaut[] = [];
  scene.traverse(o => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isMesh || !m.geometry.getAttribute("skinIndex")) return;
    const decl = manifeste.pieces.find(p => p.nom === m.name);
    if (decl) pieces.push({ ...decl, geometrie: m.geometry });
  });
  return { manifeste, pieces };
}

/** Amplitude de pronation retenue (rad, depuis la position anatomique, paume vers l'avant) : paramètre
 * d'animation du pont, pas une limite clinique. */
export const PRONATION = { min: -0.17, max: 2.97 };
const HAND = new THREE.Vector3(...ARM_JOINTS.hand);
const v = (a: V3) => new THREE.Vector3(...a);
const AUTRE: Record<Cote, Cote> = { L: "R", R: "L" };

interface Bras {
  cote: Cote; signe: number;
  bras: THREE.Object3D; av: THREE.Object3D[]; main: THREE.Object3D;
  dU: THREE.Vector3; h0: THREE.Vector3; axe: THREE.Vector3; pivot: THREE.Vector3; coude: THREE.Vector3;
  paume0: THREE.Vector3; normale0: THREE.Vector3; a: number;
}
export interface EtatBras { cible: THREE.Vector3; paume: THREE.Vector3; coude: THREE.Vector3; pronation: number; ecart: number; prise: "dos" | "mains" | "libre" }

export interface OptionsHaut {
  /** Matière des os (celle des os du moteur, pour le même aspect). */
  matiereOs: THREE.Material;
  /** Fabrique de la matière des muscles (celle du moteur). */
  matiereMuscle: () => THREE.Material;
  /** Nœud qui porte la tête (enfant du nœud `head` du moteur, à son origine) : le pont y pose le port de
   * tête du couple. Par défaut le nœud `head` lui-même. */
  porteTete?: THREE.Object3D;
}

/** Port de tête en danse serrée (paramètres d'animation du pont, à valider à l'œil) : quand les deux têtes
 * sont proches, chacun tourne la sienne vers sa gauche, joue contre joue ; au-delà de `loin`, face à face. */
export const PORT_DE_TETE = { angle: 0.73, pres: 0.34, loin: 0.55 };
/** Lacet de la tête (rad, vers la gauche du danseur) pour une distance entre les deux têtes (m). */
export function portDeTete(distance: number): number {
  const t = Math.max(0, Math.min(1, (distance - PORT_DE_TETE.pres) / (PORT_DE_TETE.loin - PORT_DE_TETE.pres)));
  return PORT_DE_TETE.angle * (1 - t * t * (3 - 2 * t));
}

export class Haut {
  readonly groupe = new THREE.Group();
  readonly os: THREE.SkinnedMesh[] = [];
  readonly muscles: THREE.SkinnedMesh[] = [];
  readonly etat = {} as Record<Cote, EtatBras>;
  private readonly bras = {} as Record<Cote, Bras>;
  private readonly ajouts: THREE.Object3D[] = [];
  private readonly parGroupe = new Map<string, THREE.SkinnedMesh[]>();

  constructor(private readonly r: RigHandle, modele: ModeleHaut, options: OptionsHaut) {
    const { manifeste: m } = modele, A = m.articulations;
    // Repos des nœuds du moteur dans le repère du squelette (celui du groupe `pelvis`), lu sur le moteur.
    const colonne = v(TORSO_JOINTS.spine as V3), thorax = colonne.clone().add(v(TORSO_JOINTS.chest as V3)), tete = thorax.clone().add(v(TORSO_JOINTS.head as V3));
    const repos = new Map<string, THREE.Vector3>([["bassin", new THREE.Vector3()], ["colonne", colonne], ["thorax", thorax], ["tete", tete]]);
    const noeud = new Map<string, THREE.Object3D>([["bassin", r.pelvis], ["colonne", r.spine], ["thorax", r.chest], ["tete", options.porteTete ?? r.head]]);
    const enfant = (nom: string, parent: THREE.Object3D, local: THREE.Vector3) => {
      const o = new THREE.Object3D();
      o.name = `pont_${nom}`; o.position.copy(local);
      parent.add(o); this.ajouts.push(o);
      return o;
    };
    for (const s of ["L", "R"] as Cote[]) {
      const E = v(A["bras" + s]), C = v(A["av0" + s]), R = v(A["av1" + s]), W = v(A["main" + s]), ax = m.axes[s];
      const bras = enfant("bras" + s, r.chest, E.clone().sub(thorax));
      const av0 = enfant("av0" + s, bras, C.clone().sub(E));
      const av = [av0, ...[1, 2, 3, 4].map(k => enfant(`av${k}${s}`, av0, R.clone().sub(C)))];
      const main = enfant("main" + s, av[4], W.clone().sub(R));
      repos.set("bras" + s, E); repos.set("main" + s, W);
      av.forEach((o, k) => { repos.set(`av${k}${s}`, k ? R : C); noeud.set(`av${k}${s}`, o); });
      noeud.set("bras" + s, bras); noeud.set("main" + s, main);
      const dU = C.clone().sub(E).normalize(), h0 = v(ax.charniere);
      h0.addScaledVector(dU, -h0.dot(dU)).normalize();
      this.bras[s] = {
        cote: s, signe: s === "L" ? 1 : -1, bras, av, main, dU, h0, axe: v(ax.pronation).normalize(), pivot: R.clone().sub(C), coude: C,
        paume0: v(ax.paume).sub(C), normale0: v(ax.normalePaume).normalize(), a: C.distanceTo(E),
      };
    }
    const os = m.segments.map(n => noeud.get(n)!);
    const inverses = m.segments.map(n => new THREE.Matrix4().makeTranslation(repos.get(n)!.clone().negate()));
    const squelette = new THREE.Skeleton(os as THREE.Bone[], inverses);
    for (const p of modele.pieces) {
      const mesh = new THREE.SkinnedMesh(p.geometrie, p.type === "os" ? options.matiereOs : options.matiereMuscle());
      mesh.name = p.nom;
      mesh.userData.part = "anchor"; // ignoré par le moteur (semelles, sol, fantôme)
      mesh.frustumCulled = false;
      mesh.bind(squelette, new THREE.Matrix4());
      (p.type === "os" ? this.os : this.muscles).push(mesh);
      if (!this.parGroupe.has(p.groupe)) this.parGroupe.set(p.groupe, []);
      this.parGroupe.get(p.groupe)!.push(mesh);
      this.groupe.add(mesh);
    }
    this.groupe.name = "pont_haut";
    r.pelvis.add(this.groupe);
  }

  /** Affiche ou masque les os, les muscles, et des groupes entiers (« crane », « cou »…). */
  afficher(os: boolean, muscles: boolean, masques: readonly string[] = []) {
    for (const m of this.os) m.visible = os;
    for (const m of this.muscles) m.visible = muscles;
    for (const g of masques) for (const m of this.parGroupe.get(g) ?? []) m.visible = false;
  }

  /** Pose les deux bras d'après la pose courante du moteur. `partenaire` : son rig, s'il y en a un ;
   * `suiveur` : ce danseur est la suiveuse. */
  maj(partenaire: RigHandle | null, suiveur: boolean) {
    const r = this.r;
    r.chest.updateWorldMatrix(true, false);
    for (const s of ["L", "R"] as Cote[]) {
      const armF = r["armF" + s] as THREE.Object3D | undefined;
      if (!armF) continue;
      armF.updateWorldMatrix(true, false);
      const cible = armF.localToWorld(HAND.clone()), coudeMoteur = armF.getWorldPosition(new THREE.Vector3());
      const { prise, normale } = this.paume(s, cible, partenaire, suiveur);
      this.etat[s] = { ...this.poser(this.bras[s], cible, coudeMoteur, normale), prise };
    }
  }

  /** Vers où la paume se tourne, d'après ce que la main du moteur touche. */
  private paume(s: Cote, cible: THREE.Vector3, partenaire: RigHandle | null, suiveur: boolean) {
    const axe = (o: THREE.Object3D, x: number, y: number, z: number) => new THREE.Vector3(x, y, z).transformDirection(o.matrixWorld);
    const signe = s === "L" ? 1 : -1;
    if (partenaire?.chest) {
      partenaire.chest.updateWorldMatrix(true, false);
      // Main posée sur l'omoplate du partenaire : la paume regarde son dos.
      const site = partenaire.chest.localToWorld(v((s === "R" ? CADRE_SITES.scapulaL : CADRE_SITES.scapulaR) as V3));
      const glisse = partenaire.chest.worldToLocal(cible.clone());
      if (s === (suiveur ? "L" : "R") && (site.distanceTo(cible) < 0.03 || (Math.abs(glisse.z + 0.1) < 0.02 && Math.abs(glisse.y - 0.03) < 0.02)))
        return { prise: "dos" as const, normale: axe(partenaire.chest, 0, 0, 1) };
      // Mains jointes : la paume du guideur regarde sa partenaire, un peu vers le haut et l'intérieur ;
      // celle de la suiveuse lui fait face.
      const autre = partenaire["armF" + AUTRE[s]] as THREE.Object3D | undefined;
      if (autre && s === (suiveur ? "R" : "L")) {
        autre.updateWorldMatrix(true, false);
        if (autre.localToWorld(HAND.clone()).distanceTo(cible) < 0.04) {
          const guideur = suiveur ? partenaire.chest : this.r.chest;
          const n = axe(guideur, -0.3, 0.45, 0.75).normalize();
          return { prise: "mains" as const, normale: suiveur ? n.negate() : n };
        }
      }
    }
    // Main libre : la paume vers le corps.
    return { prise: "libre" as const, normale: axe(this.r.chest, -0.7 * signe, 0, -0.7).normalize() };
  }

  /** Bras à deux segments aux longueurs anatomiques : la paume vient sur `cible`, le coude plie du côté du
   * coude du moteur, le radius tourne pour présenter la paume vers `normale`. */
  private poser(b: Bras, cible: THREE.Vector3, pole: THREE.Vector3, normale: THREE.Vector3): Omit<EtatBras, "prise"> {
    const S = b.bras.getWorldPosition(new THREE.Vector3());
    const parent = b.bras.parent!.getWorldQuaternion(new THREE.Quaternion());
    const base = (x: THREE.Vector3, y: THREE.Vector3) => new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y));
    const depuis = (d0: THREE.Vector3, h0: THREE.Vector3, d: THREE.Vector3, h: THREE.Vector3) => {
      const hp = h0.clone().addScaledVector(d0, -h0.dot(d0)).normalize(), hq = h.clone().addScaledVector(d, -h.dot(d)).normalize();
      return new THREE.Quaternion().setFromRotationMatrix(base(d, hq).multiply(base(d0, hp).transpose()));
    };
    let phi = b.signe * 1.4, coude = new THREE.Vector3();
    const tourne = new THREE.Quaternion(), TOURS = 4;
    for (let tour = 0; tour < TOURS; tour++) {
      // La paume au repos, tournée de phi autour de l'axe de pronation, dans le repère du coude.
      const q = b.paume0.clone().sub(b.pivot).applyQuaternion(tourne.setFromAxisAngle(b.axe, phi)).add(b.pivot);
      const solution = solveArm(S, cible, b.a, q.length(), pole);
      coude = solution.elbow;
      const u = coude.clone().sub(S).normalize(), f = solution.hand.clone().sub(coude).normalize();
      // Normale du plan du bras : l'avant-bras fléchit autour d'elle, vers l'avant de l'humérus.
      const cote = pole.clone().sub(S), versMain = solution.hand.clone().sub(S).normalize();
      cote.addScaledVector(versMain, -cote.dot(versMain));
      const n = cote.lengthSq() > 1e-10 ? cote.cross(versMain).normalize() : b.h0.clone().applyQuaternion(parent);
      const haut = depuis(b.dU, b.h0, u, n), avant = depuis(q.clone().normalize(), b.h0, f, n);
      b.bras.quaternion.copy(parent.clone().invert().multiply(haut));
      b.av[0].quaternion.copy(haut.clone().invert().multiply(avant));
      for (let k = 1; k <= 4; k++) b.av[k].quaternion.setFromAxisAngle(b.axe, (phi * k) / 4);
      // Le dernier tour pose le bras avec la pronation trouvée : la paume est alors exactement sur la cible.
      if (tour === TOURS - 1) break;
      // Pronation : l'angle qui tourne la normale de la paume vers la direction voulue, dans l'amplitude.
      const t = normale.clone().applyQuaternion(avant.clone().invert());
      const n0 = b.normale0.clone().addScaledVector(b.axe, -b.normale0.dot(b.axe)), t0 = t.addScaledVector(b.axe, -t.dot(b.axe));
      if (t0.lengthSq() > 1e-6) {
        let angle = Math.atan2(new THREE.Vector3().crossVectors(n0, t0).dot(b.axe), n0.dot(t0)) * b.signe;
        // Hors amplitude : la borne la plus proche (l'angle est pris dans ]-π, π]).
        const milieu = (PRONATION.min + PRONATION.max) / 2;
        if (angle < milieu - Math.PI) angle += 2 * Math.PI;
        phi = b.signe * Math.max(PRONATION.min, Math.min(PRONATION.max, angle));
      }
    }
    b.bras.updateWorldMatrix(false, true);
    const paume = b.av[4].localToWorld(b.paume0.clone().sub(b.pivot));
    return { cible, paume, coude, pronation: phi * b.signe, ecart: paume.distanceTo(cible) };
  }

  liberer() {
    this.groupe.removeFromParent();
    for (const o of this.ajouts) o.removeFromParent();
    for (const m of this.muscles) (m.material as THREE.Material).dispose();
  }
}
