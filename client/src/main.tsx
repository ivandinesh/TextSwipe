import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Ensure Lucide icons are loaded
import { Palette, Type, Paintbrush } from "lucide-react";

createRoot(document.getElementById("root")!).render(<App />);
