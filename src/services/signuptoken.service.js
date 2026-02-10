import jwt from "jsonwebtoken";

export function createPendingToken(emailHash) {
  return jwt.sign(
    { emailHash, type: "PENDING_SIGNUP" },
    process.env.JWT_PENDING_SECRET,
    { expiresIn: "10m" } // short-lived
  );
}

export function verifyPendingToken(token) {
  return jwt.verify(token, process.env.JWT_PENDING_SECRET);
}
