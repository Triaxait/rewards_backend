import express from "express";
import {
  signup,
  verifyOtpController,
  resendOtpController,
  setPasswordController,
  loginController,
    refreshTokenController,
} from "../controllers/auth.controller.js";
import { pendingAuth } from "../middlewares/pendingAuth.js";

const router = express.Router();

// signup flow
router.post("/signup", signup);
router.post("/verify-otp", pendingAuth, verifyOtpController);
router.post("/resend-otp", pendingAuth, resendOtpController);
router.post("/set-password", pendingAuth, setPasswordController);
// login
router.post("/login", loginController);

router.post("/refresh", refreshTokenController);





export default router;
