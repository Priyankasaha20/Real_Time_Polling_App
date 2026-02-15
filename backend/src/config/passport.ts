import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { AuthProvider } from "@prisma/client";
import { env } from "./env";
import { prisma } from "../lib/prisma";

export function configurePassport() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth not configured — skipping Google strategy.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          let user = await prisma.user.findFirst({
            where: {
              OR: [{ googleId: profile.id }, { email }],
            },
          });

          if (user) {
            // Link Google account if user exists with email but no googleId
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId: profile.id,
                  profilePicture:
                    user.profilePicture || profile.photos?.[0]?.value,
                },
              });
            }
          } else {
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || email.split("@")[0],
                googleId: profile.id,
                profilePicture: profile.photos?.[0]?.value,
                provider: AuthProvider.google,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
