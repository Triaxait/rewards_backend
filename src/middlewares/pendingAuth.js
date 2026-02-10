import { verifyPendingToken } from "../services/signuptoken.service.js";

export function pendingAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({ message: "Token required" });
  }

  const token = auth.split(" ")[1];

  try {
    const payload = verifyPendingToken(token);

    if (payload.type !== "PENDING_SIGNUP") {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.emailHash = payload.emailHash;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
