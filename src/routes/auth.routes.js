import express from "express";
import {
  signup,
  verifyOtpController,
  resendOtpController,
  setPasswordController,
  loginController,
  refreshTokenController,
  SetForgotPasswordController,
  forgotPasswordController,
  validateResetTokenController
} from "../controllers/auth.controller.js";
import { pendingAuth } from "../middlewares/pendingAuth.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many reset attempts. Try again later.",
});

// signup flow
router.post("/signup", signup);
router.post("/verify-otp", pendingAuth, verifyOtpController);
router.post("/resend-otp", pendingAuth, resendOtpController);
router.post("/set-password", pendingAuth, setPasswordController);

// login
router.post("/login", loginController);
router.post("/refresh", refreshTokenController);

// forgot password
router.post("/forgot-password", forgotLimiter, forgotPasswordController);
router.post("/set-forgot-password", SetForgotPasswordController);
router.get("/validate-reset-token", validateResetTokenController);

export default router;