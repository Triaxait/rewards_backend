import express from "express";

import { authMiddleware } from "../middlewares/auth.js";
import {    createSiteController , 
            addStaffController,
            resendStaffInviteController,
            assignStaffToSiteController,
            removeStaffFromSiteController,
            getSiteController,
            getStaffListController
} from "../controllers/admin.controller.js";
import { requireRole } from "../middlewares/requireRoles.js";

const router = express.Router();

router.post(
    "/addsite",
    authMiddleware,
    requireRole("ADMIN"),
    createSiteController
);

router.get(
    "/sites",
    authMiddleware,
    requireRole("ADMIN"),
    getSiteController
);


router.get(
  "/staff",
  authMiddleware,
  requireRole("ADMIN"),
  getStaffListController
);

router.post(
  "/staff/addstaff",
  authMiddleware,
  requireRole("ADMIN"),
  addStaffController
);
router.post(
  "/staff/resend-invite",
  authMiddleware,
  requireRole("ADMIN"),
  resendStaffInviteController
);

router.post(
  "/staff/assign-to-site",
  authMiddleware,
  requireRole("ADMIN"),
  assignStaffToSiteController
);


router.delete(
  "/staff/remove-from-site",
  authMiddleware,
  requireRole("ADMIN"),
  removeStaffFromSiteController
);


export default router;