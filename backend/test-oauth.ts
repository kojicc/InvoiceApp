// Simple OAuth test - test this file separately
import dotenv from "dotenv";
dotenv.config();

const testGoogleOAuth = () => {
  console.log("🔍 Testing Google OAuth Configuration");
  console.log("=====================================");

  console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
  console.log(
    "Client Secret:",
    process.env.GOOGLE_CLIENT_SECRET ? "[PRESENT]" : "[MISSING]"
  );
  console.log("Callback URL:", process.env.GOOGLE_CALLBACK_URL);

  // Basic Google OAuth URL construction
  const baseURL = "https://accounts.google.com/o/oauth2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:4000/api/oauth/google/callback",
    scope: "profile email",
    response_type: "code",
    access_type: "offline",
  });

  const authURL = `${baseURL}?${params.toString()}`;

  console.log("\n📋 Manual OAuth URL for testing:");
  console.log(authURL);
  console.log("\n💡 Copy this URL to your browser to test OAuth flow manually");
};

testGoogleOAuth();
