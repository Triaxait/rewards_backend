import { hashValue } from "../utils/hash.js";



export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(otp) {
  return hashValue(otp);
}

export function verifyOtp(otp, hash) {
    const otpHash = hashValue(otp);
    return otpHash === hash;
}
