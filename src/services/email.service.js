import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASS,
  },
});

export async function sendOtpEmail(email, otp) {
  await transporter.sendMail({
    from: `"XL Convenience" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP",
    text: `Your OTP is ${otp}. Valid for 5 minutes.`,
  });
}
