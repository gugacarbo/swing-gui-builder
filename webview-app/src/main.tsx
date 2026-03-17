import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// biome-ignore lint/style/noNonNullAssertion: <react-root> is guaranteed to be present in the HTML file, so this is safe.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
