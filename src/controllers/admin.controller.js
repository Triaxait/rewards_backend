
import prisma from "../prisma.js";
import crypto from "crypto";
import { hashValue } from "../utils/hash.js";
import { encrypt } from "../utils/encrypt.js";
import { decrypt } from "../utils/encrypt.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function createSiteController(req, res) {
  const { name, address } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Site name is required" });
  }

  const site = await prisma.site.create({
    data: {
      name,
      address,
    },
  });

  res.status(201).json({
    message: "Site created",
    site,
  });
}


export async function addStaffController(req, res) {
  const { email, firstName, lastName ,mobile} = req.body;

  if (!email || !firstName || !lastName || !mobile) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const emailHash = hashValue(email);

  // 1️⃣ Check duplicate
  const existingUser = await prisma.user.findUnique({
    where: { emailHash },
  });

  if (existingUser) {
    return res.status(400).json({ message: "Staff already exists" });
  }

  // 2️⃣ Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // 3️⃣ Create user
  const user = await prisma.user.create({
    data: {
      role: "STAFF",
      emailEnc: encrypt(email),
      emailHash,
      mobileEnc: encrypt(mobile),
      passwordHash: null,
      isActive: false,
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    },
  });

  // 4️⃣ Create staff profile
  await prisma.staffProfile.create({
    data: {
      userId: user.id,
      firstNameEnc: encrypt(firstName),
      lastNameEnc: encrypt(lastName),
    },
  });

  // 5️⃣ Send email
  const resetLink = `${process.env.FRONTEND_URL}/set-password?token=${resetToken}`;
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
  from: process.env.EMAIL_FROM, // use your verified domain
  to: email,
  subject: "Set your staff password – XL Convenience",
  html: `
    <p>Hi ${firstName},</p>
    <p>You have been added as staff at XL Convenience.</p>
    <p>Please set your password using the link below:</p>
    <p>
      <a href="${resetLink}" 
         style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
         Set Password
      </a>
    </p>
    <p>This link is valid for 24 hours.</p>
  `,
});

  return res.status(201).json({
    message: "Staff added and invitation email sent",
  });
}


export async function resendStaffInviteController(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const emailHash = hashValue(email);

  // 1️⃣ Find staff user
  const user = await prisma.user.findUnique({
    where: { emailHash },
    include: { staffProfile: true },
  });

  if (!user || user.role !== "STAFF") {
    return res.status(404).json({ message: "Staff not found" });
  }

  // 2️⃣ If already onboarded
  if (user.passwordHash) {
    return res.status(400).json({
      message: "Staff already onboarded. Use forgot password instead.",
    });
  }

  // 3️⃣ Generate new token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // 4️⃣ Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    },
  });

  // 5️⃣ Send email
  const resetLink = `${process.env.FRONTEND_URL}/set-password?token=${resetToken}`;

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
  from: process.env.EMAIL_FROM, 
  to: email,
  subject: "Set your staff password – XL Convenience",
  html: `
    <p>Hi ${firstName},</p>
    <p>You have been added as staff at XL Convenience.</p>
    <p>Please set your password using the link below:</p>
    <p>
      <a href="${resetLink}" 
         style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
         Set Password
      </a>
    </p>
    <p>This link is valid for 24 hours.</p>
  `,
});

  return res.status(200).json({
    message: "New invitation link sent successfully",
  });
}


export async function assignStaffToSiteController(req, res) {
  const { staffUserId, siteId } = req.body;

  if (!staffUserId || !siteId) {
    return res.status(400).json({ message: "staffUserId and siteId required" });
  }

  // 1️⃣ Get staff profile
  const staffProfile = await prisma.staffProfile.findUnique({
    where: { userId: staffUserId },
  });

  if (!staffProfile) {
    return res.status(404).json({ message: "Staff not found" });
  }

  // 2️⃣ Check site exists
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    return res.status(404).json({ message: "Site not found" });
  }

  // 3️⃣ Assign staff to site (prevent duplicate)
  try {
    await prisma.staffSite.create({
      data: {
        staffId: staffProfile.id,
        siteId,
      },
    });
  } catch (err) {
    return res.status(400).json({
      message: "Staff already assigned to this site",
    });
  }

  return res.status(201).json({
    message: "Staff assigned to site successfully",
  });
}


export async function removeStaffFromSiteController(req, res) {
  const { staffUserId, siteId } = req.body;

  if (!staffUserId || !siteId) {
    return res.status(400).json({
      message: "staffUserId and siteId are required",
    });
  }

  // 1️⃣ Get staff profile
  const staffProfile = await prisma.staffProfile.findUnique({
    where: { userId: staffUserId },
  });

  if (!staffProfile) {
    return res.status(404).json({ message: "Staff not found" });
  }

  // 2️⃣ Find assignment
  const assignment = await prisma.staffSite.findUnique({
    where: {
      staffId_siteId: {
        staffId: staffProfile.id,
        siteId,
      },
    },
  });

  if (!assignment) {
    return res.status(404).json({
      message: "Staff is not assigned to this site",
    });
  }

  // 3️⃣ Delete assignment
  await prisma.staffSite.delete({
    where: {
      staffId_siteId: {
        staffId: staffProfile.id,
        siteId,
      },
    },
  });

  return res.status(200).json({
    message: "Staff removed from site successfully",
  });
}



export async function getSiteController(req, res) {
    const sites = await prisma.site.findMany();
    
    const siteData = sites.map((site) => ({
        id: site.id,
        name: site.name,
        address: site.address,
    }));
    
    return res.status(200).json(siteData);
}

export async function getStaffListController(req, res) {
  const staffProfiles = await prisma.staffProfile.findMany({
    include: {
      user: true,
      staffSites: {
        include: {
          site: true,
        },
      },
    },
  });

  const response = staffProfiles.map(staff => ({
    staffUserId: staff.userId,
    firstName: decrypt(staff.firstNameEnc),
    lastName: decrypt(staff.lastNameEnc),
    email: staff.user.emailEnc
      ? decrypt(staff.user.emailEnc)
      : null,
    onboarded: Boolean(staff.user.passwordHash),
    sites: staff.staffSites.map(ss => ({
      id: ss.site.id,
      name: ss.site.name,
        address: ss.site.address,
    })),
  }));

  return res.status(200).json(response);
}
