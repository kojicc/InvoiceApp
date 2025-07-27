import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    console.log("❌ No token provided in authorization header");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    console.log(
      "🔍 Verifying token with SECRET_KEY:",
      SECRET_KEY.substring(0, 10) + "..."
    );
    const decoded = jwt.verify(token, SECRET_KEY) as {
      userId: number;
      role: string;
      email: string;
    };
    console.log("✅ Token verified successfully for user:", decoded.userId);
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.log(
      "❌ Token verification failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return res.status(401).json({ message: "Invalid Token" });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
