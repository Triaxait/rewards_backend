import express from "express";
import prisma from "../prisma.js";
import { decrypt } from "../utils/encrypt.js";
import { authMiddleware } from "../middlewares/auth.js";
const router = express.Router();

router.get("/auth/me", authMiddleware, async (req, res) => {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      mobileEnc: true,
      emailEnc: true,
      passwordHash: true,
      customerProfile: {
        select: {
          firstNameEnc: true,
          lastNameEnc: true,
          dob: true,
        },
      },
      staffProfile: {
        select: {
          firstNameEnc: true,
          lastNameEnc: true,
        },
      },
    },
  });

  if (!user)
    return res.status(401).json({
      code: "TOKEN_EXPIRED",
      message: "Session expired",
    });

  let profile = null;

  /* ======================
     CUSTOMER
     ====================== */
  if (user.role === "CUSTOMER" && user.customerProfile) {
    profile = {
      email: decrypt(user.emailEnc),
      firstName: decrypt(user.customerProfile.firstNameEnc),
      lastName: decrypt(user.customerProfile.lastNameEnc),
      dob: user.customerProfile.dob,
      mobile: decrypt(user.mobileEnc),
    };
  }

  /* ======================
     STAFF
     ====================== */
  if (user.role === "STAFF" && user.staffProfile) {
    profile = {
      email: decrypt(user.emailEnc),
      firstName: decrypt(user.staffProfile.firstNameEnc),
      lastName: decrypt(user.staffProfile.lastNameEnc),
      onboarded: Boolean(user.passwordHash),
    };
  }

  /* ======================
     ADMIN
     ====================== */
  if (user.role === "ADMIN") {
    profile = {
      email: decrypt(user.emailEnc),
    };
  }

  return res.json({
    user: {
      id: user.id,
      role: user.role,
      profile,
    },
  });
});

router.post("/auth/logout", (req, res) => {
  res
    .clearCookie("refreshToken")
    .status(200)
    .json({ message: "Logged out successfully" });
});

export default router;
