import prisma from "../prisma.js";
import { decrypt } from "../utils/encrypt.js";
import redis from "../redis/client.js";

export async function getLiveAnalytics(req, res) {
  try {
    const [
      cupsSold,
      cupsRedeemed,
      totalCustomers,
    ] = await redis.mget([
      "analytics:cupsSold",
      "analytics:cupsRedeemed",
      "analytics:totalCustomers",
    ]);

    res.json({
      cupsSold: Number(cupsSold || 0),
      cupsRedeemed: Number(cupsRedeemed || 0),
      totalCustomers: Number(totalCustomers || 0),
      source: "redis",
    });
  } catch (err) {
    console.error("Analytics fetch failed:", err);
    res.status(500).json({ message: "Analytics unavailable" });
  }
}



export async function getDashboardAnalytics(req, res) {
  try {
    const now = new Date();

    const start14Days = new Date();
    start14Days.setDate(now.getDate() - 13);
    start14Days.setHours(0, 0, 0, 0);

    // Fetch last 14 days in ONE query
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: start14Days,
        },
      },
      select: {
        paidCups: true,
        createdAt: true,
      },
    });

    // Prepare daily buckets
    const dailyMap = {};

    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = 0;
    }

    // Fill values
    transactions.forEach((t) => {
      const key = t.createdAt.toISOString().split("T")[0];
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += t.paidCups;
      }
    });

    // Convert to array sorted oldest → newest
    const last14Days = Object.entries(dailyMap)
      .map(([date, paidCups]) => ({ date, paidCups }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Split weeks
    const last7Days = last14Days.slice(7);
    const previous7Days = last14Days.slice(0, 7);

    const thisWeekTotal = last7Days.reduce(
      (sum, d) => sum + d.paidCups,
      0
    );

    const lastWeekTotal = previous7Days.reduce(
      (sum, d) => sum + d.paidCups,
      0
    );

    let growthPercent = 0;

    if (lastWeekTotal > 0) {
      growthPercent =
        ((thisWeekTotal - lastWeekTotal) /
          lastWeekTotal) *
        100;
    }

    res.json({
      last7Days,
      thisWeekTotal,
      lastWeekTotal,
      growthPercent: Number(growthPercent.toFixed(1)),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({
      message: "Failed to load analytics",
    });
  }
}

export async function sitesWithStaffController(req, res) {
  const sites = await prisma.site.findMany({
    include: {
      staffSites: {
        include: {
          staff: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  const response = sites.map(site => ({
    siteId: site.id,
    name: site.name,
    address: site.address,
    staffCount: site.staffSites.length,
    staff: site.staffSites.map(ss => ({
      staffUserId: ss.staff.userId,
      firstName: decrypt(ss.staff.firstNameEnc),
      lastName: decrypt(ss.staff.lastNameEnc),
    })),
  }));

  return res.status(200).json(response);
}

export async function siteAnalyticsController(req, res) {
  const data = await prisma.transaction.groupBy({
    by: ["siteId"],
    _sum: {
      paidCups: true,
      freeCups: true,
    },
  });

  const sites = await prisma.site.findMany();

  const result = data.map(d => {
    const site = sites.find(s => s.id === d.siteId);
    return {
      siteId: d.siteId,
      siteName: site?.name,
      paidCups: d._sum.paidCups || 0,
      freeCups: d._sum.freeCups || 0,
    };
  });

  res.json(result);
}

export async function adminTransactionsController(req, res) {
  const { siteId } = req.query;

  const transactions = await prisma.transaction.findMany({
    where: siteId ? { siteId } : {},
    include: {
      site: true,
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(transactions);
}



export async function adminStaffListController(req, res) {
  const staff = await prisma.staffProfile.findMany({
    include: {
      user: true,
      staffSites: {
        include: { site: true },
      },
    },
  });

  res.json(
    staff.map(s => ({
      staffId: s.userId,
      firstName: "decrypt",
      lastName: "decrypt",
      sites: s.staffSites.map(ss => ss.site.name),
    }))
  );
}


export async function adminCustomerController(req, res) {
  const { id } = req.params;

  const customer = await prisma.customerProfile.findUnique({
    where: { id },
    include: {
      transactions: {
        include: { site: true },
      },
      user: true,
    },
  });

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  res.json({
    id: customer.id,
    firstName: "decrypt",
    lastName: "decrypt",
    totalPaidCups: customer.totalPaidCups,
    totalRedeemedCups: customer.totalRedeemedCups,
    transactions: customer.transactions,
  });
}

