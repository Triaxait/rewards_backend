import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { qrtoken } from "../controllers/qr.controller.js";

const router = express.Router();

router.get("/qr-token", authMiddleware, qrtoken);

export default router;