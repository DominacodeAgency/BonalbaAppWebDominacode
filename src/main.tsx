import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { AuthProvider } from "./auth/AuthContext";
import { Toaster } from "sonner";

/**
 * Entry point: monta React y envuelve la app con AuthProvider.
 */
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
    <Toaster richColors position="top-right" />
  </AuthProvider>
);
