import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// #69: guide mode proof of concept (docs/spec-mode-guidage-poc.md), a separate view.
const params = new URLSearchParams(window.location.search);
const guidage = params.get("guidage") === "1";
// #132: anatomical atlas plates (docs/spec-atlas-anatomique.md), a separate view: `?atlas=<id>`.
const atlas = params.has("atlas");
// #31: each view is its own chunk; only the one opened is downloaded.
const View = guidage ? lazy(() => import("./components/GuidageApp"))
  : atlas ? lazy(() => import("./components/AtlasApp")) : lazy(() => import("./App"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<p className="p-4 text-sm text-slate-400">Chargement…</p>}>
      <View />
    </Suspense>
  </StrictMode>
);
