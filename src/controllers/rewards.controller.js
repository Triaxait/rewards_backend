import prisma from "../prisma.js";

export async function rewardsSummaryController(req, res) {
  const userId = req.userId; // from auth middleware

  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: {
      totalPaidCups: true,
      totalRedeemedCups: true,
    },
  });

  if (!profile) {
    return res.status(404).json({ message: "Customer profile not found" });
  }

  const earnedFreeCups = Math.floor(profile.totalPaidCups / 5);
  const availableFreeCups = earnedFreeCups - profile.totalRedeemedCups;
  const currentPoints = profile.totalPaidCups % 5;

  res.json({
    totalRedeemedCups: profile.totalRedeemedCups,
    currentPoints,
    maxPoints: 5,
    availableFreeCups: Math.max(availableFreeCups, 0),
  });
}
