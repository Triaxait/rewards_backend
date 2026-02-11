import express from "express";
import { getCustomerHistory } from "../controllers/customer.controller.js";
import { rewardsSummaryController } from "../controllers/rewards.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRoles.js";

const router = express.Router();

router.get(
  "/history",
  authMiddleware,
    requireRole("CUSTOMER"),
  getCustomerHistory
);

router.get("/summary", authMiddleware, requireRole("CUSTOMER"), rewardsSummaryController);

export default router;