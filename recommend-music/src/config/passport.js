// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback",
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Cari user berdasarkan googleId
      let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

      if (!user) {
        // Kalau belum ada, cek berdasarkan email
        user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });

        if (user) {
          // Update user, tambahkan googleId
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id }
          });
        } else {
          // Kalau user sama sekali belum ada, buat user baru
          user = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              googleId: profile.id,
              username: profile.displayName,
            }
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Serialize/deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});

module.exports = passport;