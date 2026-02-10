import jwt from "jsonwebtoken";

const QR_JWT_SECRET = process.env.QR_JWT_SECRET;

export const generateQrToken = ({ userId, emailHash }) => {
  return jwt.sign(
    {
      userId,
      emailHash,
      type: "qr",
    },
    QR_JWT_SECRET,
    {
      expiresIn: "5m", // short life (recommended)
    }
  );
};

export const verifyQrToken = (token) => {
  return jwt.verify(token, QR_JWT_SECRET);
};
