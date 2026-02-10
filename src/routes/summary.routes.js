import { authMiddleware } from "../middlewares/auth.js";
import express from "express";
import { rewardsSummaryController } from "../controllers/rewards.controller.js";

const router = express.Router();

router.get("/summary", authMiddleware, rewardsSummaryController);

export default router;