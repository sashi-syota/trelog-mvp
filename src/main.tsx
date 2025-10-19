import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { initPWA } from './pwa';

initPWA()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// File: src/main.tsx （追記）
import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });
