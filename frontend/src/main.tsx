import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { WindowSizeProvider } from "./contexts/WindowSizeContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WindowSizeProvider>
      <App />
    </WindowSizeProvider>
  </StrictMode>
);
