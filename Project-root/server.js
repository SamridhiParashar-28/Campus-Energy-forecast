// server.js – corrected version with error handling & proper CORS

const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;


// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://energy-forecast:5000'],
  credentials: true
}));

app.use(express.json());          // ← MUST HAVE – parses JSON request bodies
app.use(express.static('.'));     // ← Serve static files from current directory

// Optional: log every incoming request (helps debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// ── Routes ──────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// REGISTER endpoint
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Register attempt:', { username, passwordLength: password?.length });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:'Password must be at least 6 characters'
      });
    }

    // TODO: Replace with real logic (check if user exists, hash password, save to DB)
    // For now: fake success
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      username
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message   // only show in development
    });
  }
});

// LOGIN endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // TODO: Replace with real auth (compare hashed password, generate JWT, etc.)
    // For now: fake success for any input
    res.json({
      success: true,
      message: 'Login successful',
      username,
      token: 'fake-jwt-token-for-testing'  // replace with real JWT later
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Global error handler (last resort – always return JSON)
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});