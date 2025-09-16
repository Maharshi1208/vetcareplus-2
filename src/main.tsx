import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "react-hot-toast";
import { PetsProvider } from "./context/PetsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PetsProvider>
      <App />
      <Toaster position="top-center" />
    </PetsProvider>
  </StrictMode>
);
