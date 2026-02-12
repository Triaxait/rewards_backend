// controllers/auth.controller.js
import prisma from "../prisma.js";
import { decrypt } from "../utils/encrypt.js";
import { hashPassword } from "../utils/hash.js";
import { incrementAnalytics } from "../redis/analytics.js";

export async function staffSetPasswordController(req, res) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password required" });
  }

  // 1️⃣ Find user by reset token
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: {
        gt: new Date(), // not expired
      },
    },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired link" });
  }

  // 2️⃣ Hash password
  const passwordHash = await hashPassword(password);

  // 3️⃣ Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      isActive: true,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  return res.status(200).json({
    message: "Password set successfully. You can now login.",
  });
}

export async function scanQrController(req, res) {
  const { qrToken, siteId } = req.body;
  const userId = req.userId; // from JWT

  if (!qrToken || !siteId) {
    return res.status(400).json({
      message: "qrToken and siteId are required",
    });
  }

  // 1️⃣ Get staff profile
  const staffProfile = await prisma.staffProfile.findUnique({
    where: { userId },
  });

  if (!staffProfile) {
    return res.status(403).json({ message: "Not a staff user" });
  }

  // 2️⃣ Check staff access to site
  const allowed = await prisma.staffSite.findUnique({
    where: {
      staffId_siteId: {
        staffId: staffProfile.id,
        siteId,
      },
    },
  });

  if (!allowed) {
    return res.status(403).json({
      message: "You are not assigned to this site",
    });
  }

  // 3️⃣ Find customer by QR
  const customer = await prisma.customerProfile.findFirst({
    where: {
      qrToken,
      qrExpiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!customer) {
    return res.status(404).json({
      message: "Invalid or expired QR code",
    });
  }

  // 4️⃣ Calculate current points
  const points = customer.totalPaidCups % 5;
  const freeCupsAvailable =
    Math.floor(customer.totalPaidCups / 5) - customer.totalRedeemedCups;

  return res.status(200).json({
    customer: {
      id: customer.id,
      firstName: decrypt(customer.firstNameEnc),
      lastName: decrypt(customer.lastNameEnc),
        email: decrypt(customer.user.emailEnc),
        dob: customer.dob,
      points,
      freeCupsAvailable,
      totalRedeemedCups: customer.totalRedeemedCups,
    },
  });
}


const REWARD_THRESHOLD = 5;

export async function handleCupsController(req, res) {
  const { customerId, siteId, paidCups = 0, redeemCups = 0 } = req.body;
  const userId = req.userId; 
  const staffProfile = await prisma.staffProfile.findUnique({
    where: { userId },
  });

  if (!staffProfile) {
    return res.status(403).json({ message: "Unauthorized Staff" });
  }

  if (paidCups < 0 || redeemCups < 0) {
    return res.status(400).json({ message: "Invalid values" });
  }

  const customer = await prisma.customerProfile.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  // Current totals
  const currentPaid = customer.totalPaidCups;
  const currentRedeemed = customer.totalRedeemedCups;

  // Compute current available free cups
  const FreeAvailablePostpurchase =
    Math.floor((currentPaid + paidCups) / REWARD_THRESHOLD) -
    currentRedeemed;

  if (FreeAvailablePostpurchase < 0) {
  return res.status(400).json({
    message: "Invalid free cup calculation",
  });
}

  if (redeemCups > FreeAvailablePostpurchase) {
    return res.status(400).json({
      message: "Not enough free cups available",
    });
  }


  await prisma.$transaction(async (tx) => {
    // Update totals
    await tx.customerProfile.update({
      where: { id: customerId },
      data: {
        totalPaidCups: {
          increment: paidCups,
        },
        totalRedeemedCups: {
          increment: redeemCups,
        },
      },
    });

    // Save transaction
    await tx.transaction.create({
      data: {
        customerId,
        siteId,
        paidCups,
        staffId: staffProfile.id,
        freeCups: redeemCups,
      },
    });

  });
  
  await incrementAnalytics({
  paidCups,
  freeCups: redeemCups,
});

  res.json({ message: "Transaction successful" });
}

// export async function handleCupsController(req, res) {
//   const { customerId, siteId, paidCups = 0, redeemCups = 0 } = req.body;
//   const userId = req.userId;

//   if (!customerId || !siteId) {
//     return res.status(400).json({ message: "customerId and siteId required" });
//   }

//   if (paidCups <= 0 && redeemCups <= 0) {
//     return res.status(400).json({ message: "Nothing to process" });
//   }

//   // 1️⃣ Staff profile
//   const staffProfile = await prisma.staffProfile.findUnique({
//     where: { userId },
//   });

//   if (!staffProfile) {
//     return res.status(403).json({ message: "Not a staff user" });
//   }

//   // 2️⃣ Site access check
//   const allowed = await prisma.staffSite.findUnique({
//     where: {
//       staffId_siteId: {
//         staffId: staffProfile.id,
//         siteId,
//       },
//     },
//   });

//   if (!allowed) {
//     return res.status(403).json({ message: "No access to this site" });
//   }

//   // 3️⃣ Customer
//   const customer = await prisma.customerProfile.findUnique({
//     where: { id: customerId },
//   });

//   if (!customer) {
//     return res.status(404).json({ message: "Customer not found" });
//   }

//   // 4️⃣ Calculate free cups available
//   const totalEarnedFree =
//     Math.floor(customer.totalPaidCups / 5);
//   const availableFree =
//     totalEarnedFree - customer.totalRedeemedCups;

//   if (redeemCups > availableFree) {
//     return res.status(400).json({
//       message: "Not enough free cups to redeem",
//     });
//   }

//   // 5️⃣ Update customer counters (atomic)
  
//   incrementAnalytics({
//     paidCups,
//     redeemCups,
//   });

//   await prisma.$transaction([
//     prisma.customerProfile.update({
//       where: { id: customerId },
//       data: {
//         totalPaidCups: {
//           increment: paidCups,
//         },
//         totalRedeemedCups: {
//           increment: redeemCups,
//         },
//       },
//     }),

//     prisma.transaction.create({
//       data: {
//         customerId,
//         siteId,
//         staffId: staffProfile.id,
//         paidCups,
//         freeCups: redeemCups,
//       },
//     }),
//   ]);

//   return res.status(200).json({
//     message: "Transaction successful",
//     addedPaidCups: paidCups,
//     redeemedCups: redeemCups,
//   });
// }


export async function getStaffSitesController(req, res) {
  const userId = req.userId; 

  // 1️⃣ Get staff profile
  const staffProfile = await prisma.staffProfile.findUnique({
    where: { userId },
  });

  if (!staffProfile) {
    return res.status(403).json({ message: "Not a staff user" });
  }

  // 2️⃣ Fetch assigned sites
  const staffSites = await prisma.staffSite.findMany({
    where: {
      staffId: staffProfile.id,
    },
    include: {
      site: true,
    },
  });

  const sites = staffSites.map(ss => ({
    siteId: ss.site.id,
    name: ss.site.name,
    address: ss.site.address,
  }));

  return res.status(200).json(sites);
}