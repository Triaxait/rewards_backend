
import prisma from "../prisma.js";
import crypto from "crypto";

function generateQrToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function qrtoken(req, res) {
  const userId = req.userId;

  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  const now = new Date();

  if (profile.qrToken && profile.qrExpiresAt > now) {
    return res.json({
      qrToken: profile.qrToken,
      expiresAt: profile.qrExpiresAt,
    });
  }

  const qrToken = generateQrToken();
  const qrExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  await prisma.customerProfile.update({
    where: { userId },
    data: {
      qrToken,
      qrExpiresAt,
    },
  });

  res.json({ qrToken, expiresAt: qrExpiresAt });
}




