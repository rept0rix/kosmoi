import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./i18n";
import { HelmetProvider } from "react-helmet-async";
import { AnalyticsService } from "./services/AnalyticsService.js";
import SentryService from "./services/SentryService.js";

// Initialize Monitoring (Sentry) - first to catch init errors
SentryService.init();

// Initialize Analytics (PostHog)
AnalyticsService.init();

// console.log("MAIN JSX EXECUTING -- BEFORE RENDER. Root Element:", document.getElementById("root"));
try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <SentryService.ErrorBoundary
        fallback={
          <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
              <p className="text-slate-400">
                Please refresh the page or contact support.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 rounded"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }
      >
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </SentryService.ErrorBoundary>
    </React.StrictMode>,
  );
  // console.log("MAIN JSX RENDER TRIGGERED SUCCESS");
} catch (err) {
  console.error("FATAL ERROR IN main.jsx RENDER:", err);
  SentryService.captureError(err, { location: "main.jsx render" });
}

// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        // console.log("SW registered:", reg);
      })
      .catch((err) => {
        // console.log("SW registration failed:", err);
      });
  });
}

if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", () => {
    window.parent?.postMessage({ type: "sandbox:beforeUpdate" }, "*");
  });
  import.meta.hot.on("vite:afterUpdate", () => {
    window.parent?.postMessage({ type: "sandbox:afterUpdate" }, "*");
  });
}
