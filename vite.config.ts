import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.GITHUB_ACTIONS
  ? "/dance-hips-movement-3D-comparison/"
  : "/";

// #31: the libraries change rarely, the app often; separate chunks stay cached across deploys.
const VENDOR_CHUNKS: Record<string, string[]> = {
  three: ["three"],
  r3f: ["@react-three/fiber", "@react-three/drei"],
  react: ["react", "react-dom", "scheduler"],
};

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    // three.js alone is ≈ 750 kB minified (≈ 190 kB gzip) and does not split further: warn above it.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          for (const [chunk, packages] of Object.entries(VENDOR_CHUNKS))
            if (packages.some(p => id.includes(`/node_modules/${p}/`))) return chunk;
          return "vendor";
        },
      },
    },
  },
});
