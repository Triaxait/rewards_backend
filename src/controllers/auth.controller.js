import prisma from "../prisma.js";
import { encrypt,decrypt } from "../utils/encrypt.js";
import { generateOtp, hashOtp ,verifyOtp} from "../services/otp.service.js";
import { sendOtpEmail } from "../services/email.service.js";
import { hashPassword,hashValue,comparePassword } from "../utils/hash.js";
import { createPendingToken } from "../services/signuptoken.service.js";
import { createAccessToken, createRefreshToken } from "../services/token.service.js";
import jwt from "jsonwebtoken";



export async function signup(req, res) {
  const { firstName, lastName, email, mobile, dob } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const emailEnc = encrypt(email);
  const emailHash = hashValue(email);

  // ❌ Block if real user already exists
  const existingUser = await prisma.user.findFirst({
    where: { emailHash }
  });
  

  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  // Cleanup any old pending signup
  await prisma.pendingSignup.deleteMany({
    where: { emailHash }
  });

  // Generate OTP
  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  const token = createPendingToken(emailHash);


  // Store pending signup
  await prisma.pendingSignup.create({
    data: {
      firstNameEnc: encrypt(firstName),
      lastNameEnc: encrypt(lastName),
      emailEnc,
      emailHash,
      mobileEnc: mobile ? encrypt(mobile) : null,
      dob: dob ? new Date(dob) : null,
      otpHash,
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min
    }
  });


  await sendOtpEmail(email, otp);

  res.status(200).json({ message: "OTP sent to your email", token: token });
}

export async function verifyOtpController(req, res) {
  const { otp } = req.body;

  const emailHash = req.emailHash;

  const pending = await prisma.pendingSignup.findFirst({
    where: { emailHash },
  });

  if (!pending) {
    return res.status(400).json({ message: "No signup request found!! Retry Signing Up" });
  }

  // expiry check
  if (pending.otpExpiresAt < new Date()) {
    await prisma.pendingSignup.delete({ where: { id: pending.id } });
    return res.status(400).json({ message: "OTP expired" });
  }

  // otp match
  const isValid = verifyOtp(otp, pending.otpHash);
  if (!isValid) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // OTP is correct → allow next step
  return res.status(200).json({ message: "OTP verified, proceed to set password" });
}




export async function setPasswordController(req, res) {
  const { password } = req.body;
const emailHash = req.emailHash;

  if (!password || password.length < 8) {
    return res.status(400).json({ message: "Password too short" });
  }
  
  const pending = await prisma.pendingSignup.findFirst({
    where: { emailHash },
  });

  if (!pending) {
    return res.status(400).json({ message: "No verified signup found" });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
    data: {
      role: "CUSTOMER",
      emailEnc: pending.emailEnc,
      emailHash,
      mobileEnc: pending.mobileEnc,
      passwordHash,
      isActive: true,
      customerProfile: {
        create: {
          firstNameEnc: pending.firstNameEnc,
          lastNameEnc: pending.lastNameEnc,
          dob: pending.dob ?? "",
          totalRedeemedCups: 0,
          totalPaidCups: 0,
          qrToken: "",
        },
      },
    },
  });

  await tx.pendingSignup.delete({
    where: { id: pending.id },
  });

  return user;
    });

    const userdetails = await prisma.user.findUnique({
  where: { id: user.id },
  include: {
    customerProfile: true,
  },
});

const userPayload = {
  id: userdetails.id,
  role: userdetails.role,
    profile: {
  email: decrypt(userdetails.emailEnc),

  firstName: decrypt(userdetails.customerProfile.firstNameEnc),
  lastName: decrypt(userdetails.customerProfile.lastNameEnc),
  mobile: decrypt(userdetails.mobileEnc),
  dob: userdetails.customerProfile.dob,
    }
 
};


const accessToken = createAccessToken(user);
const refreshToken = createRefreshToken(user);

 res.status(201).cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  }).json({
    accessToken : accessToken,
    user: userPayload,
  });


  
}

export async function resendOtpController(req, res) {
    const emailHash = req.emailHash;

  const pending = await prisma.pendingSignup.findFirst({
    where: { emailHash },
  });

  if (!pending) {
    return res.status(400).json({ message: "No signup request found" });
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await prisma.pendingSignup.update({
    where: { id: pending.id },
    data: {
      otpHash,
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    },
  });

  await sendOtpEmail(decrypt(pending.emailEnc), otp);

  res.json({ message: "OTP resent successfully"  });
}


export async function loginController(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const emailHash = hashValue(email);

  const user = await prisma.user.findUnique({
    where: { emailHash },
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Account disabled!! Sign up Again" });
  }

  const userdetails = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      mobileEnc: true,
      emailEnc: true,
      passwordHash: true,
      customerProfile: {
        select: {
          firstNameEnc: true,
          lastNameEnc: true,
          dob : true,
        },
      },
      staffProfile: {
        select: {
          firstNameEnc: true,
          lastNameEnc: true,
        },
      },
    },
  });

let profile = null;

  /* ======================
     CUSTOMER
     ====================== */
  if (userdetails.role === "CUSTOMER" && userdetails.customerProfile) {
    profile = {
      email: decrypt(userdetails.emailEnc),
      firstName: decrypt(userdetails.customerProfile.firstNameEnc),
      lastName: decrypt(userdetails.customerProfile.lastNameEnc),
      dob: userdetails.customerProfile.dob,
      mobile: decrypt(userdetails.mobileEnc),

    };
  }

  /* ======================
     STAFF
     ====================== */
  if (userdetails.role === "STAFF" && userdetails.staffProfile) {
    profile = {
      email: decrypt(userdetails.emailEnc),
      firstName: decrypt(userdetails.staffProfile.firstNameEnc),
      lastName: decrypt(userdetails.staffProfile.lastNameEnc),
      onboarded: Boolean(userdetails.passwordHash),
    };
  }

  /* ======================
     ADMIN
     ====================== */
  if (userdetails.role === "ADMIN") {
    profile = {
      email: decrypt(userdetails.emailEnc),
    };
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  res.status(200).cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  }).json({
     user: {
      id: user.id,
      role: user.role,
      profile,
    },
    accessToken,
  });
}


export async function refreshTokenController(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
    });

    const accessToken = createAccessToken(user);

    res.status(200).json({
    accessToken
  });
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}

