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

export async function sendUserResetPasswordEmail({
  email,
  name,
  resetLink,
}) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM, // verified domain
      to: email,
      subject: "Reset your password – XL Convenience",
      html: `
        <div style="font-family:Arial, sans-serif; max-width:600px; margin:auto; line-height:1.6;">
          
          <h2 style="color:#000;">Reset Your Password</h2>

          <p>Hi ${name || "there"},</p>

          <p>
            We received a request to reset your password for your 
            <strong>XL Convenience</strong> account.
          </p>

          <p>
            Click the button below to set a new password:
          </p>

          <p style="text-align:center; margin:30px 0;">
            <a href="${resetLink}" 
               style="
                 display:inline-block;
                 padding:12px 24px;
                 background:#000;
                 color:#fff;
                 text-decoration:none;
                 border-radius:6px;
                 font-weight:bold;
               ">
               Reset Password
            </a>
          </p>

          <p>
            This link will expire in <strong>15 minutes</strong>.
          </p>

          <p>
            If you did not request a password reset, you can safely ignore this email.
            Your account will remain secure.
          </p>

          <hr style="margin:30px 0;" />

          <p style="font-size:12px; color:#777;">
            XL Convenience Rewards Platform
          </p>

        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending reset password email:", error);
    throw new Error("Failed to send reset password email");
  }
}
