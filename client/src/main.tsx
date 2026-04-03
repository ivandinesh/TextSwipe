import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Ensure Lucide icons are loaded
import { Palette, Type, Paintbrush } from "lucide-react";

try {
  createRoot(document.getElementById("root")!).render(<App />);
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("focusfeed:boot-ready"));
  });
} catch (error) {
  window.dispatchEvent(new Event("focusfeed:boot-error"));
  throw error;
}
