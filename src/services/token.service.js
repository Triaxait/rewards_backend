import jwt from "jsonwebtoken";

export function createAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

export function createRefreshToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      tokenVersion: user.tokenVersion,
      type: "REFRESH",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}


