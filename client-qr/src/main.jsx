// ===================================================================
// 📌 main.jsx – FASTORDER QR Client (2026)
// -------------------------------------------------------------------
// Punto de entrada React con:
//  • StrictMode
//  • Router
//  • Contexto global de Carrito
//  • Mobile-first optimizado
// ===================================================================

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { CarritoProvider } from "./context/CarritoContext";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CarritoProvider>
        <App />
      </CarritoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
