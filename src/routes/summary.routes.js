import { Router } from "express";
import { getLiveAnalytics } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRoles.js";
import { getDashboardAnalytics } from "../controllers/dashboard.controller.js";

const router = Router();

// later you can protect this with ADMIN auth
router.get("/live",authMiddleware,requireRole("ADMIN"), getLiveAnalytics);
router.get("/dashboard",authMiddleware,requireRole("ADMIN"), getDashboardAnalytics);

export default router;