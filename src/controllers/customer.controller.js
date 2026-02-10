import prisma from "../prisma.js";

export async function getCustomerHistory(req, res) {
  try {
    const userId = req.userId;

    // Get customer profile
    const customer = await prisma.customerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const history = transactions.map(tx => ({
      id: tx.id,
      date: tx.createdAt,
      storeName: tx.site.name,
      paidCups: tx.paidCups,
      freeCups: tx.freeCups,
      type: tx.freeCups > 0 ? "REDEEM" : "PURCHASE",
    }));

    return res.json({ history });
  } catch (err) {
    console.error("Customer history error:", err);
    return res.status(500).json({ message: "Failed to fetch history" });
  }
}