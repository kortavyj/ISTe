import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import AutoTranslate from "./i18n/AutoTranslate.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import "./index.css";

const legacyHashPath = window.location.hash.startsWith("#/")
  ? window.location.hash.slice(1)
  : "";

if (legacyHashPath) {
  const migratedUrl = `${legacyHashPath}${window.location.search}`;
  window.history.replaceState(null, "", migratedUrl);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AutoTranslate />
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
