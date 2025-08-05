require('dotenv').config(); // Pastikan .env dibaca

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport'); // Pastikan path sudah benar!
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({
  origin: ['http://localhost:3000', 'http://147.93.107.169:3000', 'https://awakatune.com'],
  credentials: true,
}));

// Session middleware (pakai SESSION_SECRET dari .env)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    domain: process.env.NODE_ENV === "production" ? "awakatune.com" : undefined,
    path: "/"
  } // secure: true jika pakai https di production
}));

app.use(passport.initialize());
app.use(passport.session());

// Tambahkan bodyParser jika ada POST login/register manual:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route auth (login manual & google)
app.use('/api/auth', authRoutes);

// Debug log untuk route yang tidak dikenali
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.originalUrl);
  next();
});

// Route lain (optional)
app.get('/', (req, res) => {
  res.send('Server jalan! 🚀');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://147.93.107.169:${PORT}`);
});