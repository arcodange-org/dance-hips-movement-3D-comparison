// Vue du pont ReCoDanse : l'application du moteur, telle quelle, avec ses danseurs habillés.
// Le moteur n'est pas modifié : un greffon remplace `components/Rig` par `src/RigMascotte.tsx`, qui rend le
// Rig d'origine et lui ajoute le haut du corps anatomique, la tête et les pieds chaussés des mascottes.
//   MOTEUR=<chemin d'un autre checkout du moteur>  pour danser avec une autre version du moteur.
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const ici = path.dirname(fileURLToPath(import.meta.url));
const moteur = path.resolve(ici, process.env.MOTEUR ?? "..");
const rigDuMoteur = path.join(moteur, "src/components/Rig.tsx");
const rigDuPont = path.join(ici, "src/RigMascotte.tsx");

/** Le Rig d'origine se demande avec ce suffixe (`…/Rig.tsx?moteur`) : il garde ainsi son propre module,
 * que le remplacement ne touche jamais, même après un rechargement à chaud. */
const ORIGINE = "?moteur";
const sansRequete = (id: string) => path.normalize(id.split("?")[0]);

function habillerLeRig(): Plugin {
  return {
    name: "pont-recodanse:rig",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (source.endsWith(ORIGINE)) {
        const origine = await this.resolve(source.slice(0, -ORIGINE.length), importer, { ...options, skipSelf: true });
        return origine ? sansRequete(origine.id) + ORIGINE : null;
      }
      if (!importer) return null;
      const resolu = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolu && !resolu.id.endsWith(ORIGINE) && sansRequete(resolu.id) === rigDuMoteur ? rigDuPont : null;
    },
  };
}

// Les styles du moteur : sa configuration Tailwind, avec des chemins absolus (la racine de Vite est ce dossier).
const tailwindDuMoteur = (await import(pathToFileURL(path.join(moteur, "tailwind.config.js")).href)).default;
const styles = tailwindcss({
  ...tailwindDuMoteur,
  content: [path.join(moteur, "index.html"), path.join(moteur, "src/**/*.{ts,tsx}"), path.join(ici, "src/**/*.{ts,tsx}")],
});

export default defineConfig({
  root: ici,
  css: { postcss: { plugins: [styles, autoprefixer()] } },
  base: process.env.BASE ?? "/",
  publicDir: path.join(moteur, "public"),
  plugins: [habillerLeRig(), react()],
  resolve: {
    alias: { "@moteur": path.join(moteur, "src") },
    dedupe: ["three", "react", "react-dom", "@react-three/fiber", "@react-three/drei"],
  },
  server: { fs: { allow: [moteur, ici] } },
  build: { outDir: path.join(ici, "dist"), emptyOutDir: true, chunkSizeWarningLimit: 900 },
});
