import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Create client (admin only)
router.post("/", authenticate, authorize(["admin"]), async (req, res) => {
  const client = await prisma.client.create({ data: req.body });
  res.json(client);
});

// Get all clients (admin only)
router.get("/", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        invoices: {
          select: {
            id: true,
            status: true,
            total: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Error fetching clients" });
  }
});

// Update client
router.put("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  const client = await prisma.client.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  });
  res.json(client);
});

// Delete client
router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  await prisma.client.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Client deleted" });
});

export default router;
