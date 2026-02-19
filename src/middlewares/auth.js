import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({ code: "NO_TOKEN" });
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      return res.status(401).json({ code: "USER_NOT_FOUND" });
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ code: "TOKEN_VERSION_MISMATCH" });
    }

    req.userId = user.id;
    req.role = user.role;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ code: "TOKEN_EXPIRED" });
    }

    return res.status(401).json({ code: "INVALID_TOKEN" });
  }
}