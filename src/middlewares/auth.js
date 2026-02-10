import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({ message: "Token required" });
  }

  const token = auth.split(" ")[1];
  try {

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.userId = payload.userId;
    req.role = payload.role;


    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
