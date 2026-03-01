import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// In direct mode (lovable.ai), load the Google Maps JS API so Places autocomplete works
const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
if (googleKey && !document.querySelector('script[src*="maps.googleapis.com"]')) {
  const s = document.createElement("script");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&libraries=places`;
  s.async = true;
  document.head.appendChild(s);
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Ensure there is a <div id='root'> in your HTML.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
