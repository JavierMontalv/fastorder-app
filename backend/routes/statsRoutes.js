// backend/routes/statsRoutes.js
// ======================================================
// 📊 Rutas de Dashboard / Estadísticas – FASTORDER (2026)
// ------------------------------------------------------
// Exponen KPIs para el panel administrativo: ventas,
// pedidos, productos top, desempeño del día, etc.
// Solo accesibles para administradores.
// ======================================================

import { Router } from "express";
import auth from "../middlewares/auth.js";     // ✔ CORREGIDO (default import)
import { rol } from "../middlewares/rol.js";

import { obtenerStatsDashboard } from "../controllers/statsController.js";

const router = Router();

// ======================================================
// GET /api/stats/dashboard
// Dashboard completo del negocio (solo ADMIN)
// ======================================================
router.get("/dashboard", auth, rol("admin"), obtenerStatsDashboard);

export default router;
