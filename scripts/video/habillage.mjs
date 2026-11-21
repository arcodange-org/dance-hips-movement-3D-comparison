// L'habillage du film (#155) : titres, cartouches, repères, sous-titres, étiquettes et générique, rendus en
// images transparentes par le navigateur (une image par élément, posée par le montage avec un fondu).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { dossier, ecrireJson, empreinte, lireJson } from "./outils.mjs";

/** Échappe un texte pour le HTML ; les guillemets et la ponctuation double gardent leur espace insécable. */
const echapper = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
  .replace(/« /g, "«\u00a0").replace(/ »/g, "\u00a0»").replace(/ ([:;!?])/g, "\u00a0$1");

/** Feuille de style commune : fond transparent, typographie du système. */
const STYLE = (l, h) => `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${l}px; background: transparent; }
  body { font-family: "Avenir Next", "Helvetica Neue", "DejaVu Sans", system-ui, sans-serif; color: #f1f5f9; -webkit-font-smoothing: antialiased; }
  .cadre { position: relative; width: ${l}px; height: ${h}px; overflow: hidden; }
  .ombre { text-shadow: 0 2px 14px rgba(2, 6, 23, .9), 0 0 2px rgba(2, 6, 23, .9); }

  .titre { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; padding: 0 150px;
    background: linear-gradient(90deg, rgba(2,6,23,.86) 0%, rgba(2,6,23,.62) 46%, rgba(2,6,23,0) 78%); }
  .titre .sur { font-size: 30px; letter-spacing: .32em; text-transform: uppercase; color: #5eead4; font-weight: 600; margin-bottom: 26px; }
  .titre h1 { font-size: 112px; line-height: 1.04; font-weight: 700; letter-spacing: -.02em; max-width: 1000px; text-wrap: balance; }
  .titre .sous { font-size: 42px; font-weight: 400; color: #cbd5e1; margin-top: 30px; max-width: 900px; line-height: 1.25; text-wrap: balance; }
  .titre .pied { font-size: 23px; color: #94a3b8; margin-top: 34px; max-width: 900px; }

  .chapitre { position: absolute; left: 100px; top: 290px; width: 760px; }
  .chapitre .num { font-size: 30px; letter-spacing: .3em; text-transform: uppercase; font-weight: 600; margin-bottom: 14px; }
  .chapitre h2 { font-size: 138px; line-height: 1; font-weight: 700; letter-spacing: -.02em; }
  .chapitre h2.long { font-size: 100px; }
  .chapitre .trait { width: 150px; height: 8px; border-radius: 4px; margin-top: 30px; }
  .chapitre .ou { font-size: 38px; color: #e2e8f0; margin-top: 26px; font-weight: 500; max-width: 640px; line-height: 1.25; text-wrap: balance; }

  .cartouche { position: absolute; left: 100px; top: 60px; display: flex; align-items: stretch; gap: 20px; max-width: 700px; }
  .cartouche .barre { width: 8px; border-radius: 4px; }
  .cartouche .nom { font-size: 46px; font-weight: 700; line-height: 1.1; }
  .cartouche .infos { font-size: 25px; color: #cbd5e1; margin-top: 6px; font-weight: 500; line-height: 1.3; text-wrap: balance; }

  .repere { position: absolute; left: 100px; top: 330px; max-width: 600px; padding: 20px 30px 22px; border-radius: 16px;
    background: rgba(2, 6, 23, .7); border-left: 8px solid; }
  .repere .mot { font-size: 21px; letter-spacing: .24em; text-transform: uppercase; font-weight: 600; margin-bottom: 10px; }
  .repere .texte { font-size: 44px; font-weight: 600; line-height: 1.18; text-wrap: balance; }

  .bande { position: absolute; left: 0; right: 0; bottom: 0; height: 250px;
    background: linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(2,6,23,.78) 46%, rgba(2,6,23,.92) 100%); }
  .soustitre { position: absolute; left: 300px; right: 300px; bottom: 44px; text-align: center; }
  .soustitre .role { display: inline-block; font-size: 20px; letter-spacing: .22em; text-transform: uppercase; font-weight: 700; margin-bottom: 10px; }
  .soustitre .texte { font-size: 40px; line-height: 1.3; font-weight: 500; color: #f8fafc; text-wrap: balance; }
  .intertitre { position: absolute; left: 0; right: 0; bottom: 70px; text-align: center; font-size: 52px; font-weight: 700; letter-spacing: -.01em; }

  .etiquettes { position: absolute; left: 0; right: 0; display: grid; }
  .etiquettes .e { text-align: center; font-size: 30px; font-weight: 700; }
  .etiquettes .e small { display: block; font-size: 21px; font-weight: 500; color: #cbd5e1; margin-top: 2px; }
  .voile { position: absolute; background: rgba(2, 6, 23, .72); }
  .lisere { position: absolute; border: 4px solid; border-radius: 6px; }

  .points { position: absolute; left: 100px; top: 150px; max-width: 880px; }
  .points h2 { font-size: 64px; font-weight: 700; margin-bottom: 34px; }
  .points li { list-style: none; font-size: 37px; line-height: 1.3; font-weight: 500; margin-bottom: 22px; padding-left: 44px; position: relative; text-wrap: balance; }
  .points li::before { content: ""; position: absolute; left: 0; top: 18px; width: 18px; height: 18px; border-radius: 50%; background: #fbbf24; }

  .degrade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(2,6,23,0) 28%, rgba(2,6,23,.84) 50%, rgba(2,6,23,.94) 100%); }
  .degrade .haut, .degrade .bas { position: absolute; left: 40%; right: 0; height: 130px; }
  .degrade .haut { top: 0; background: linear-gradient(180deg, rgba(4,9,24,1) 0%, rgba(4,9,24,0) 100%); }
  .degrade .bas { bottom: 0; background: linear-gradient(0deg, rgba(4,9,24,1) 0%, rgba(4,9,24,0) 100%); }
  .vignette { position: absolute; border-radius: 14px; background: rgba(2, 6, 23, .74); }
  .vignette .legende { position: absolute; left: 16px; top: 10px; font-size: 16px; font-weight: 600; color: #cbd5e1; }
  .vignette.grande .legende { font-size: 23px; top: 12px; left: 18px; }
  .vignette .mesure { position: absolute; right: 18px; bottom: 12px; font-size: 22px; color: #e2e8f0; text-align: right; line-height: 1.3; }
  .vignette svg { position: absolute; left: 0; top: 0; }
  #generique { width: ${l}px; padding: 0 90px 0 ${Math.round(l * 0.46)}px; }
  #generique h2 { font-size: 52px; font-weight: 700; margin-bottom: 14px; }
  #generique .accroche { font-size: 26px; color: #cbd5e1; line-height: 1.35; margin-bottom: 44px; }
  #generique h3 { font-size: 21px; letter-spacing: .26em; text-transform: uppercase; color: #5eead4; font-weight: 700; margin: 44px 0 14px; }
  #generique p { font-size: 23px; line-height: 1.34; color: #e2e8f0; margin-bottom: 9px; }
  #generique p small { display: block; font-size: 18px; color: #94a3b8; line-height: 1.3; }
  #generique p.flux { font-size: 15.5px; line-height: 1.34; color: #cbd5e1; text-align: left; }
  #generique p.flux b { color: #64748b; font-weight: 400; padding: 0 5px; }
  #generique .fin { font-size: 30px; font-weight: 600; margin-top: 90px; color: #f8fafc; }
`;

const page = (l, h, corps) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${STYLE(l, h)}</style></head><body>${corps}</body></html>`;
const cadre = corps => `<div class="cadre">${corps}</div>`;

/** Les éléments : chacun rend le HTML d'une image de la taille du film. */
export const ELEMENTS = {
  titre: ({ sur, titre, sous, pied }) => cadre(`<div class="titre ombre">
    <div class="sur">${echapper(sur)}</div><h1>${echapper(titre)}</h1><div class="sous">${echapper(sous)}</div>
    ${pied ? `<div class="pied">${echapper(pied)}</div>` : ""}</div>`),
  chapitre: ({ numero, nom, ou, couleur }) => cadre(`<div class="chapitre ombre">
    <div class="num" style="color:${couleur}">${echapper(numero)}</div><h2${nom.length > 10 ? ' class="long"' : ""}>${echapper(nom)}</h2>
    <div class="trait" style="background:${couleur}"></div>${ou ? `<div class="ou">${echapper(ou)}</div>` : ""}</div>`),
  cartouche: ({ nom, infos, couleur }) => cadre(`<div class="cartouche ombre"><div class="barre" style="background:${couleur}"></div>
    <div><div class="nom">${echapper(nom)}</div>${infos.map(i => `<div class="infos">${echapper(i)}</div>`).join("")}</div></div>`),
  repere: ({ texte, couleur }) => cadre(`<div class="repere" style="border-color:${couleur}"><div class="texte">${echapper(texte)}</div></div>`),
  intertitre: ({ texte }) => cadre(`<div class="intertitre ombre">${echapper(texte)}</div>`),
  bande: () => cadre(`<div class="bande"></div>`),
  soustitre: ({ role, texte, couleur }) => cadre(`<div class="soustitre ombre">
    ${role ? `<div class="role" style="color:${couleur}">${echapper(role)}</div>` : ""}<div class="texte">${echapper(texte)}</div></div>`),
  /** Étiquettes sous une rangée de cases : `cases` = [{x, largeur, nom, detail, couleur}], `y` = haut du texte. */
  etiquettes: ({ cases, y, gauche }) => cadre(cases.map(c => `<div class="etiquettes ombre" style="left:${c.x}px; width:${c.largeur}px; top:${y}px">
    <div class="e" style="color:${c.couleur}${gauche ? "; text-align:left; padding-left:22px" : ""}">${echapper(c.nom)}${c.detail ? `<small>${echapper(c.detail)}</small>` : ""}</div></div>`).join("")),
  /** Voile sur les cases qui ne sont pas l'objet de la phrase, liseré sur celles qui le sont. */
  accent: ({ voiles, liseres }) => cadre(
    voiles.map(v => `<div class="voile" style="left:${v.x}px; top:${v.y}px; width:${v.largeur}px; height:${v.hauteur}px"></div>`).join("") +
    liseres.map(v => `<div class="lisere" style="left:${v.x + 4}px; top:${v.y + 4}px; width:${v.largeur - 8}px; height:${v.hauteur - 8}px; border-color:${v.couleur}"></div>`).join("")),
  points: ({ titre, points }) => cadre(`<div class="points ombre"><h2>${echapper(titre)}</h2><ul>${points.map(p => `<li>${echapper(p)}</li>`).join("")}</ul></div>`),
  degrade: ({ bandes } = {}) => cadre(`<div class="degrade">${bandes ? `<div class="haut"></div><div class="bas"></div>` : ""}</div>`),
  /**
   * Trajets du bassin vus de dessus. `vignettes` = [{x, y, largeur, hauteur, echelle (pixels par centimètre),
   * points: [[x, z] en centimètres], hauteur du rebond en centimètres, couleur}] ; toutes à la même échelle
   * dans un même élément. `detail` ajoute la légende et les mesures.
   */
  traces: ({ vignettes, legende, detail }) => cadre(vignettes.map((v, k) => {
    const cx = v.largeur / 2, cy = v.hauteur / 2 + (detail ? 8 : 0);
    // Vu de dessus : la droite du danseur à droite de l'image quand on le regarde de face, l'avant vers le bas.
    const chemin = v.points.map(([x, z], i) => `${i ? "L" : "M"}${(cx + x * v.echelle).toFixed(1)} ${(cy + z * v.echelle).toFixed(1)}`).join(" ");
    const largeurCm = Math.max(...v.points.map(q => q[0])) - Math.min(...v.points.map(q => q[0]));
    const barre = 5 * v.echelle;
    return `<div class="vignette${detail ? " grande" : ""}" style="left:${v.x}px; top:${v.y}px; width:${v.largeur}px; height:${v.hauteur}px">
      <svg width="${v.largeur}" height="${v.hauteur}" viewBox="0 0 ${v.largeur} ${v.hauteur}">
        <line x1="${cx - 8}" y1="${cy}" x2="${cx + 8}" y2="${cy}" stroke="#64748b" stroke-width="1.5"/><line x1="${cx}" y1="${cy - 8}" x2="${cx}" y2="${cy + 8}" stroke="#64748b" stroke-width="1.5"/>
        <path d="${chemin}" fill="none" stroke="${v.couleur}" stroke-width="${detail ? 4 : 3}" stroke-linejoin="round" stroke-linecap="round"/>
        <line x1="14" y1="${v.hauteur - 14}" x2="${14 + barre}" y2="${v.hauteur - 14}" stroke="#e2e8f0" stroke-width="3"/>
        <text x="${14 + barre + 8}" y="${v.hauteur - 9}" fill="#e2e8f0" font-size="${detail ? 20 : 16}" font-family="inherit">5 cm</text>
      </svg>
      <div class="legende">${echapper(legende)}</div>
      ${detail ? `<div class="mesure">largeur ${largeurCm.toFixed(0)} cm<br>rebond ${v.hauteur_rebond.toFixed(1).replace(".", ",")} cm</div>` : ""}
    </div>`;
  }).join("")),
};

/** Le générique : une colonne à droite, aussi haute que nécessaire. `blocs` = [{titre, lignes: [texte | {texte, detail}], flux: [texte]}] ;
 * `flux` : des mentions courtes mises à la suite (les sources). */
export const generiqueHtml = ({ titre, accroche, blocs, fin }) => `<div id="generique" class="ombre">
  <h2>${echapper(titre)}</h2><div class="accroche">${echapper(accroche)}</div>
  ${blocs.map(b => `<h3>${echapper(b.titre)}</h3>${(b.lignes ?? []).map(l => typeof l === "string" ? `<p>${echapper(l)}</p>`
    : `<p>${echapper(l.texte)}${l.detail ? `<small>${echapper(l.detail)}</small>` : ""}</p>`).join("")}${
    b.flux ? `<p class="flux">${b.flux.map(echapper).join("<b>·</b>")}</p>` : ""}`).join("")}
  <div class="fin">${echapper(fin)}</div></div>`;

/**
 * Rend un élément en image ; le cache évite de refaire une image inchangée.
 * @returns {Promise<{fichier: string, largeur: number, hauteur: number}>}
 */
export async function rendre(navigateurOuvert, { type, donnees, largeur, hauteur }, { refaire = false } = {}) {
  const dir = dossier("habillage");
  const html = type === "generique" ? page(largeur, hauteur, generiqueHtml(donnees)) : page(largeur, hauteur, ELEMENTS[type](donnees));
  const cle = empreinte(html);
  const fichier = join(dir, `${type}-${cle}.png`), fiche = join(dir, `${type}-${cle}.json`);
  const connu = lireJson(fiche);
  if (!refaire && connu && existsSync(fichier)) return { fichier, ...connu };
  const p = await navigateurOuvert.newPage({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: 1 });
  try {
    await p.setContent(html, { waitUntil: "load" });
    const cible = p.locator(type === "generique" ? "#generique" : ".cadre");
    const boite = await cible.boundingBox();
    await cible.screenshot({ path: fichier, omitBackground: true });
    const taille = { largeur: Math.round(boite.width), hauteur: Math.round(boite.height) };
    ecrireJson(fiche, taille);
    return { fichier, ...taille };
  } finally {
    await p.close();
  }
}
