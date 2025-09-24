// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "react-hot-toast";
import { PetsProvider } from "./context/PetsContext";
import { AuthProvider } from "./context/AuthContext"; // ⬅️ new

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <PetsProvider>
        <App />
        <Toaster position="top-center" />
      </PetsProvider>
    </AuthProvider>
  </StrictMode>
);
