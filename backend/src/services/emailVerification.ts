import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Create email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
  });
};

// Generate verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Send verification email to new client
export const sendClientVerificationEmail = async (
  email: string,
  clientName: string,
  verificationToken: string
): Promise<void> => {
  const transporter = createEmailTransporter();

  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Invoice Management System</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .verification-code { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 16px; letter-spacing: 2px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Invoice Management System</h1>
          <p>Account Verification Required</p>
        </div>
        
        <div class="content">
          <h2>Hello ${clientName}!</h2>
          <p>Welcome to our Invoice Management System. An account has been created for you as a client.</p>
          
          <p>To get started, you need to:</p>
          <ol>
            <li><strong>Verify your email address</strong> by clicking the button below</li>
            <li><strong>Create a secure password</strong> for your account</li>
            <li><strong>Start managing your invoices</strong></li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email & Set Password</a>
          </div>
          
          <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <div class="verification-code">${verificationUrl}</div>
          
          <p>If you did not expect this email, please ignore it or contact support.</p>
          
          <h3>What's Next?</h3>
          <ul>
            <li>✅ View and track your invoices</li>
            <li>✅ Receive email notifications</li>
            <li>✅ Manage your account settings</li>
            <li>✅ Access your payment history</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>This email was sent by Invoice Management System</p>
          <p>If you have questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Invoice Management System" <${process.env.EMAIL_HOST_USER}>`,
    to: email,
    subject: "Welcome! Please verify your email and set your password",
    html: htmlContent,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully:", {
      to: email,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

// Verify email token and allow password setting
export const verifyEmailToken = async (token: string) => {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      isEmailVerified: false,
    },
  });

  if (!user) {
    throw new Error("Invalid or expired verification token");
  }

  return user;
};

// Complete email verification and set password
export const completeEmailVerification = async (
  token: string,
  password: string
): Promise<{ user: any; message: string }> => {
  const user = await verifyEmailToken(token);

  // Hash the password (you should import your password hashing utility)
  const { hashPassword } = await import("../utils/auth");
  const hashedPassword = await hashPassword(password);

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      isEmailVerified: true,
      emailVerificationToken: null, // Clear the token
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isEmailVerified: true,
    },
  });

  return {
    user: updatedUser,
    message: "Email verified and password set successfully",
  };
};
