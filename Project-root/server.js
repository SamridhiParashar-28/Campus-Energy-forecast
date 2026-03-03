const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// === MySQL connection pool (change these values) ===
const pool = mysql.createPool({
  host: '127.0.0.1',          // localhost in Codespaces
  user: 'appuser',    // e.g. 'root' or the user you created
  password: 'sam',
  database: 'campus_energy',  // e.g. 'campus_energy'
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on start
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully!');
    connection.release();
  } catch (err) {
    console.error('MySQL connection failed:', err);
  }
})();

// === REGISTER route ===
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashed]
    );

    res.json({ success: true, message: 'Registered!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// === LOGIN route ===
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: { username: user.username }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Backend running → http://localhost:${port}`);
});