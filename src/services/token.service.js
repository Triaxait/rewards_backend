import jwt from "jsonwebtoken";

export function createAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

export function createRefreshToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      type: "REFRESH",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}


