import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Get all audit logs (admin only)
router.get("/", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityType } = req.query;

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await prisma.auditLog.count({ where });

    res.json({
      logs: auditLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Error fetching audit logs" });
  }
});

// Create audit log entry (utility function)
export const createAuditLog = async (
  action: string,
  entityType: string,
  entityId: number,
  userId?: number,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        changes: changes ? JSON.stringify(changes) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
};

export default router;
