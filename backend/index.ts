import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth";
import clientRoutes from "./src/routes/clients";
import invoiceRoutes from "./src/routes/invoices";
import dashboardRoutes from "./src/routes/dashboard";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/clients", clientRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/dashboard", dashboardRoutes);

app.listen(4000, () => console.log("Server running on port 4000"));
