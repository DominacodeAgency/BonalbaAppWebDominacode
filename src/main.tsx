import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { AuthProvider } from "./auth/AuthContext";
import { Toaster } from "sonner";
import { BrowserRouter } from "react-router-dom";

/**
 * Entry point: monta React y envuelve la app con AuthProvider.
 */
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  </BrowserRouter>
);
