import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import GuidageApp from "./components/GuidageApp";

// #69: guide mode proof of concept (docs/spec-mode-guidage-poc.md), a separate view.
const guidage = new URLSearchParams(window.location.search).get("guidage") === "1";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {guidage ? <GuidageApp /> : <App />}
  </StrictMode>
);
