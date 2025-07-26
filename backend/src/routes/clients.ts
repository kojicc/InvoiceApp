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

// Get all clients
router.get("/", authenticate, async (req, res) => {
  const clients = await prisma.client.findMany();
  res.json(clients);
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
