import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.GITHUB_ACTIONS
  ? "/dance-hips-movement-3D-comparison/"
  : "/";

export default defineConfig({
  base,
  plugins: [react()],
});
