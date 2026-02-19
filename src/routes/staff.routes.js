// routes/auth.routes.js
import express from "express";
import { scanQrController,handleCupsController,getStaffSitesController} from "../controllers/staff.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRoles.js";

const router = express.Router();



router.post(
  "/scan-qr",
  authMiddleware,
  requireRole("STAFF"),
  scanQrController
);

router.post(
  "/transact-cups",
  authMiddleware,
  requireRole("STAFF"),
  handleCupsController
);

router.get(
  "/sites",
  authMiddleware,
  requireRole("STAFF"),
  getStaffSitesController
);

export default router;
