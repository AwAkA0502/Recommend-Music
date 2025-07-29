const express = require('express');
const passport = require('../config/passport'); // import setup passport
const router = express.Router();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => {
    // Redirect ke frontend Next.js (landing page)
    res.redirect('http://localhost:3000/');
  }
);

router.get('/me', (req, res) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  console.log('Authenticated:', req.isAuthenticated && req.isAuthenticated());

  if (req.isAuthenticated && req.isAuthenticated()) {
    // Hanya return field yang aman (tanpa password)
    const safeUser = req.user
      ? { id: req.user.id, username: req.user.username, email: req.user.email }
      : null;
    res.json({ user: safeUser });
  } else {
    res.status(401).json({ user: null });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validasi sederhana
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email sudah terdaftar." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru
    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "Registrasi berhasil, silakan login." });
  } catch (err) {
    console.error("Error register:", err);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }
    // Cek apakah password ada (user google-only tidak punya password manual)
    if (!user.password) {
      return res.status(401).json({ message: 'Akun ini hanya bisa login via Google.' });
    }
    // Bandingkan password hash
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }
    // Simpan user ke session
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json({ message: 'Login berhasil', user: { id: user.id, username: user.username, email: user.email } });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

router.get('/logout', (req, res) => {
  try {
    console.log("LOGOUT: req.user", req.user);
    console.log("LOGOUT: req.sessionID", req.sessionID);

    req.logout(function(err) {
      if (err) {
        console.error("LOGOUT ERROR:", err);
        return res.status(500).json({ message: "Logout error", error: err.message });
      }

      if (req.session) {
        req.session.destroy(() => {
          res.clearCookie('connect.sid', { path: '/' });
          res.json({ message: "Logout berhasil" });
        });
      } else {
        res.clearCookie('connect.sid', { path: '/' });
        res.json({ message: "Logout berhasil tanpa session" });
      }
    });
  } catch (err) {
    console.error("LOGOUT ERROR (outer):", err);
    res.status(500).json({ message: "Logout error", error: err.message });
  }
});

module.exports = router;