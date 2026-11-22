// Réglages du pont, lus dans l'URL (les paramètres du moteur restent les siens).
//   pont=0        la vue du moteur seule, sans habillage (pour comparer)
//   haut=0        sans le haut du corps anatomique (les volumes gris du moteur reviennent)
//   mascottes=0   sans tête ni pieds des mascottes (crâne et pieds anatomiques)
//   tete=0, pieds=0   l'un sans l'autre ; pieds=<jeu> : un autre jeu de pieds exporté (ex. pieds=v16)
//   regard=0      sans le port de tête du couple (têtes face à face, comme le moteur les pose)
//   solo=remi|corinne  la mascotte d'un danseur seul (défaut : corinne)
export type NomMascotte = "remi" | "corinne";
export interface Reglages { pont: boolean; haut: boolean; tete: boolean; pieds: boolean; jeuPieds: string; regard: boolean; solo: NomMascotte }

export function lireReglages(p: URLSearchParams): Reglages {
  const oui = (nom: string) => p.get(nom) !== "0";
  const mascottes = oui("mascottes");
  return {
    pont: oui("pont"), haut: oui("haut"), tete: mascottes && oui("tete"), pieds: mascottes && oui("pieds"), regard: oui("regard"),
    jeuPieds: /^[a-z0-9]+$/.test(p.get("pieds") ?? "") && !["0", "1"].includes(p.get("pieds")!) ? p.get("pieds")! : "",
    solo: p.get("solo") === "remi" ? "remi" : "corinne",
  };
}
export const reglages: Reglages = lireReglages(new URLSearchParams(typeof window === "undefined" ? "" : window.location.search));
/** Le guideur est Rémi, la suiveuse est Corinne. */
export const mascotteDe = (role: "leader" | "follower" | null, r: Reglages = reglages): NomMascotte =>
  role === "leader" ? "remi" : role === "follower" ? "corinne" : r.solo;
