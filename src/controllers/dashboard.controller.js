import prisma from "../prisma.js";
import { decrypt } from "../utils/encrypt.js";

export async function adminOverviewController(req, res) {
  const [
    totalPaid,
    totalRedeemed,
    totalTx,
    totalCustomers,
    totalSites,
  ] = await Promise.all([
    prisma.customerProfile.aggregate({
      _sum: { totalPaidCups: true },
    }),
    prisma.customerProfile.aggregate({
      _sum: { totalRedeemedCups: true },
    }),
    prisma.transaction.count(),
    prisma.customerProfile.count(),
    prisma.site.count(),
  ]);

  res.json({
    totalPaidCups: totalPaid._sum.totalPaidCups || 0,
    totalRedeemedCups: totalRedeemed._sum.totalRedeemedCups || 0,
    totalTransactions: totalTx,
    totalCustomers,
    totalSites,
  });
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

