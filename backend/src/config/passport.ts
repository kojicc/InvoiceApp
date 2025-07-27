import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Debug OAuth environment variables
console.log("🔍 OAuth Environment Check:");
console.log(
  "GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "✅ Present" : "❌ Missing"
);
console.log(
  "GOOGLE_CLIENT_SECRET:",
  process.env.GOOGLE_CLIENT_SECRET ? "✅ Present" : "❌ Missing"
);
console.log(
  "GOOGLE_CALLBACK_URL:",
  process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:4000/api/oauth/google/callback"
);

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:4000/api/oauth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth Profile:", profile);

        // Check if user already exists with this Google ID
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
          include: { client: true },
        });

        if (user) {
          // User exists, update last login
          user = await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
            include: { client: true },
          });
          return done(null, user);
        }

        // Check if user exists with same email
        const emailUser = await prisma.user.findUnique({
          where: { email: profile.emails?.[0]?.value || "" },
          include: { client: true },
        });

        if (emailUser) {
          // Link Google account to existing user
          let updateData: any = {
            googleId: profile.id,
            isEmailVerified: true, // Gmail emails are considered verified
            lastLogin: new Date(),
          };

          // If user has client role but no clientId, create a client record
          if (emailUser.role === "client" && !emailUser.clientId) {
            const newClient = await prisma.client.create({
              data: {
                name: profile.displayName || emailUser.username || "Client",
                contact: emailUser.email,
                address: "",
              },
            });
            updateData.clientId = newClient.id;
            console.log("✅ Created client record for existing OAuth user:", {
              userId: emailUser.id,
              clientId: newClient.id,
            });
          }

          const updatedUser = await prisma.user.update({
            where: { id: emailUser.id },
            data: updateData,
            include: { client: true },
          });
          return done(null, updatedUser);
        }

        // Create new user with Google account
        // For OAuth users, we'll create them as "client" role by default
        // Admin can change their role later if needed

        // First, create a client record
        const newClient = await prisma.client.create({
          data: {
            name:
              profile.displayName ||
              profile.emails?.[0]?.value?.split("@")[0] ||
              "New Client",
            contact: profile.emails?.[0]?.value || "", // Store email in contact field
            address: "", // Can be updated later
          },
        });

        // Then create the user with the client association
        const newUser = await prisma.user.create({
          data: {
            username:
              profile.displayName ||
              profile.emails?.[0]?.value?.split("@")[0] ||
              "user",
            email: profile.emails?.[0]?.value || "",
            googleId: profile.id,
            role: "client",
            clientId: newClient.id, // Link to the created client
            isEmailVerified: true, // Gmail emails are considered verified
            lastLogin: new Date(),
          },
          include: { client: true },
        });

        console.log("✅ Created new OAuth user with client:", {
          userId: newUser.id,
          clientId: newClient.id,
        });
        return done(null, newUser);
      } catch (error) {
        console.error("Google OAuth Error:", error);
        return done(error, false);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { client: true },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
