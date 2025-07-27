import express from "express";
import cors from "cors";
import path from "path";
import passport from "passport";
import session from "express-session";
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
import oauthRoutes from "./src/routes/oauth";
import emailVerificationRoutes from "./src/routes/emailVerification";

// Import passport configuration
import "./src/config/passport";

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Session configuration for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

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
app.use("/api/oauth", oauthRoutes);
app.use("/api/verification", emailVerificationRoutes);
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
