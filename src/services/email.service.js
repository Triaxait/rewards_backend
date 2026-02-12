import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email, otp) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM, // use verified domain later
    to: email,
    subject: "Your OTP",
    text: `Your OTP is ${otp}. Valid for 5 minutes.`,
  });
}