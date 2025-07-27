import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
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
          const updatedUser = await prisma.user.update({
            where: { id: emailUser.id },
            data: {
              googleId: profile.id,
              isEmailVerified: true, // Gmail emails are considered verified
              lastLogin: new Date(),
            },
            include: { client: true },
          });
          return done(null, updatedUser);
        }

        // Create new user with Google account
        // For OAuth users, we'll create them as "client" role by default
        // Admin can change their role later if needed
        const newUser = await prisma.user.create({
          data: {
            username:
              profile.displayName ||
              profile.emails?.[0]?.value?.split("@")[0] ||
              "user",
            email: profile.emails?.[0]?.value || "",
            googleId: profile.id,
            role: "client",
            isEmailVerified: true, // Gmail emails are considered verified
            lastLogin: new Date(),
          },
          include: { client: true },
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
