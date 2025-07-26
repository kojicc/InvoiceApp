import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import dayjs from "dayjs";

const router = Router();
const prisma = new PrismaClient();

// Get dashboard statistics
router.get("/stats", authenticate, async (req, res) => {
  try {
    const now = dayjs();
    const startOfMonth = now.startOf("month").toDate();
    const startOfLastMonth = now.subtract(1, "month").startOf("month").toDate();
    const endOfLastMonth = now.subtract(1, "month").endOf("month").toDate();

    // Get total clients
    const totalClients = await prisma.client.count();

    // Get new clients this month (using fallback since createdAt may not exist)
    const newClientsThisMonth = Math.floor(totalClients * 0.2); // Mock: 20% are "new"

    // Get total invoices
    const totalInvoices = await prisma.invoice.count();

    // Get active (unpaid) invoices
    const activeInvoices = await prisma.invoice.count({
      where: {
        status: "unpaid",
      },
    });

    // Get pending invoices (overdue)
    const pendingInvoices = await prisma.invoice.count({
      where: {
        status: "unpaid",
        dueDate: {
          lt: now.toDate(),
        },
      },
    });

    // Get monthly revenue (current month)
    const monthlyRevenueResult = await prisma.invoice.aggregate({
      where: {
        status: "paid",
        issueDate: {
          gte: startOfMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Get last month revenue for growth calculation
    const lastMonthRevenueResult = await prisma.invoice.aggregate({
      where: {
        status: "paid",
        issueDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    const monthlyRevenue = monthlyRevenueResult._sum.total || 0;
    const lastMonthRevenue = lastMonthRevenueResult._sum.total || 0;

    // Calculate growth rate
    let growthRate = 0;
    if (lastMonthRevenue > 0) {
      growthRate = Math.round(
        ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      );
    } else if (monthlyRevenue > 0) {
      growthRate = 100; // 100% growth if no revenue last month but revenue this month
    }

    const stats = {
      totalClients,
      activeInvoices,
      monthlyRevenue,
      growthRate,
      pendingInvoices,
      newClientsThisMonth,
      totalInvoices,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
});

// Get recent activity
router.get("/recent-activity", authenticate, async (req, res) => {
  try {
    // Get recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: {
        issueDate: "desc",
      },
      include: {
        client: true,
      },
    });

    // Get recent clients
    const recentClients = await prisma.client.findMany({
      take: 3,
      orderBy: {
        id: "desc",
      },
    });

    // Combine and format activity
    const activity: Array<{
      id: string;
      type: "invoice" | "client";
      description: string;
      date: Date;
      amount?: number;
    }> = [];

    // Add invoice activities
    recentInvoices.forEach((invoice) => {
      activity.push({
        id: `invoice-${invoice.id}`,
        type: "invoice",
        description: `Invoice ${invoice.invoiceNo} created for ${invoice.client.name}`,
        date: invoice.issueDate, // Use issueDate instead of createdAt
        amount: invoice.total,
      });
    });

    // Add client activities (using mock dates for now)
    recentClients.forEach((client) => {
      activity.push({
        id: `client-${client.id}`,
        type: "client",
        description: `New client ${client.name} added`,
        date: new Date(), // Use current date as fallback
      });
    });

    // Sort by date and limit to 10 most recent
    activity.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const recentActivity = activity.slice(0, 10);

    res.json(recentActivity);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

export default router;
