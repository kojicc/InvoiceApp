import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./src/routes/auth";
import clientRoutes from "./src/routes/clients";
import invoiceRoutes from "./src/routes/invoices";
import dashboardRoutes from "./src/routes/dashboard";
import paymentRoutes from "./src/routes/payments";
import emailRoutes from "./src/routes/email";
import currencyRoutes from "./src/routes/currency";
import dataRoutes from "./src/routes/data";
import auditRoutes from "./src/routes/audit";
import profileRoutes from "./src/routes/profile";

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/profile", profileRoutes);

app.listen(4000, () => console.log("Server running on port 4000"));
