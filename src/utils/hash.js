import bcrypt from "bcrypt";
import { createHash } from "crypto";


export const hashPassword = (password) =>
  bcrypt.hash(password, 10);

export const comparePassword = (password, hash) =>
  bcrypt.compare(password, hash);


export function hashValue(value) {
  if (!value) return null;

  return createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex");
}

