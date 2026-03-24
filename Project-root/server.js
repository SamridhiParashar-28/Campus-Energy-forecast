// ─────────────────────────────────────────────────────────────────────────────
//  WattWise  –  server.js
//  SQLite + bcrypt + JWT  ·  No external DB required
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const Database   = require('better-sqlite3');
const path       = require('path');
const fs         = require('fs');
const { parse }  = require('csv-parse/sync');

// ── Config ────────────────────────────────────────────────────────────────────
const PORT       = process.env.PORT       || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'wattwise-secret-change-in-production';
const DB_PATH    = process.env.DB_PATH    || path.join(__dirname, 'data', 'wattwise.db');
const CSV_PATH   = process.env.CSV_PATH   || path.join(__dirname, 'dataset.csv');

// ── Ensure data/ folder exists ────────────────────────────────────────────────
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ── Open / create SQLite database ─────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');   // faster concurrent reads
db.pragma('foreign_keys = ON');

// ── Schema ─────────────────────────────────────────────────────────────────────
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'viewer'
                        CHECK(role IN ('admin','viewer')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Energy readings table  (populated from CSV on first run)
  CREATE TABLE IF NOT EXISTS readings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    date            TEXT    NOT NULL,
    block           TEXT    NOT NULL,
    room            TEXT    NOT NULL,
    appliance       TEXT    NOT NULL,
    power_watts     REAL    NOT NULL,
    duration_hours  REAL    NOT NULL,
    energy_kwh      REAL    NOT NULL,
    temperature_c   REAL,
    day_of_week     TEXT,
    is_weekend      TEXT
  );

  -- Indexes for fast dashboard queries
  CREATE INDEX IF NOT EXISTS idx_readings_block ON readings(block);
  CREATE INDEX IF NOT EXISTS idx_readings_date  ON readings(date);
`);

// ── Seed CSV data (once) ───────────────────────────────────────────────────────
const csvAlreadyLoaded = db.prepare('SELECT COUNT(*) as n FROM readings').get().n > 0;
if (!csvAlreadyLoaded && fs.existsSync(CSV_PATH)) {
  try {
    const raw     = fs.readFileSync(CSV_PATH, 'utf8');
    const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

    const insert = db.prepare(`
      INSERT INTO readings
        (date, block, room, appliance, power_watts, duration_hours,
         energy_kwh, temperature_c, day_of_week, is_weekend)
      VALUES
        (@date, @block, @room, @appliance, @power_watts, @duration_hours,
         @energy_kwh, @temperature_c, @day_of_week, @is_weekend)
    `);

    const insertMany = db.transaction((rows) => {
      for (const r of rows) insert.run({
        date:           r.date,
        block:          r.block,
        room:           r.room,
        appliance:      r.appliance,
        power_watts:    parseFloat(r.power_watts)    || 0,
        duration_hours: parseFloat(r.duration_hours) || 0,
        energy_kwh:     parseFloat(r.energy_kwh)     || 0,
        temperature_c:  parseFloat(r.temperature_c)  || null,
        day_of_week:    r.day_of_week  || null,
        is_weekend:     r.is_weekend   || null,
      });
    });

    insertMany(records);
    console.log(`✓ CSV loaded: ${records.length} rows → readings table`);
  } catch (err) {
    console.error('CSV seed error:', err.message);
  }
} else if (!fs.existsSync(CSV_PATH)) {
  console.warn('⚠  dataset.csv not found — readings table is empty');
}

// ── Seed a default admin (only if no users exist) ─────────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (username, password, role) VALUES (?,?,?)`)
    .run('admin', hash, 'admin');
  console.log('✓ Default admin created  →  username: admin  /  password: admin123');
}

// ── Express setup ─────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: [
    'http://localhost:8000', 'http://127.0.0.1:8000',
    'http://localhost:5500', 'http://127.0.0.1:5500',
    'http://localhost:3000', 'http://127.0.0.1:3000',
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));   // serve HTML files

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── JWT middleware ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin access required' });
    next();
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// POST /register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    if (username.length < 3 || username.length > 50)
      return res.status(400).json({ success: false, message: 'Username must be 3–50 characters' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists)
      return res.status(409).json({ success: false, message: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
    ).run(username, hash, 'viewer');

    console.log(`✓ Registered: ${username} (id ${result.lastInsertRowid})`);
    res.status(201).json({ success: true, message: 'Account created successfully', username });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid username or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid username or password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`✓ Login: ${username} (${user.role})`);
    res.json({
      success:  true,
      message:  'Login successful',
      username: user.username,
      role:     user.role,
      token,
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// GET /me  –  verify token + get current user info
app.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?')
                  .get(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
});

// ═════════════════════════════════════════════════════════════════════════════
//  USER MANAGEMENT ROUTES  (admin only)
// ═════════════════════════════════════════════════════════════════════════════

// GET /users  –  list all users
app.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare(
    'SELECT id, username, role, created_at as createdAt FROM users ORDER BY id'
  ).all();
  res.json({ success: true, users });
});

// POST /users/role  –  promote / demote
app.post('/users/role', requireAdmin, (req, res) => {
  const { username, role } = req.body;
  if (!['admin', 'viewer'].includes(role))
    return res.status(400).json({ success: false, message: 'Role must be admin or viewer' });

  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user)
    return res.status(404).json({ success: false, message: 'User not found' });

  db.prepare('UPDATE users SET role = ? WHERE username = ?').run(role, username);
  console.log(`✓ Role change: ${username} → ${role} (by ${req.user.username})`);
  res.json({ success: true, message: `${username} is now ${role}` });
});

// POST /users/delete  –  remove a user (cannot delete yourself)
app.post('/users/delete', requireAdmin, (req, res) => {
  const { username } = req.body;

  if (username.toLowerCase() === req.user.username.toLowerCase())
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });

  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user)
    return res.status(404).json({ success: false, message: 'User not found' });

  db.prepare('DELETE FROM users WHERE username = ?').run(username);
  console.log(`✓ Deleted user: ${username} (by ${req.user.username})`);
  res.json({ success: true, message: `${username} deleted` });
});

// ═════════════════════════════════════════════════════════════════════════════
//  ENERGY DATA ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/blocks  –  list of unique blocks
app.get('/api/blocks', requireAuth, (req, res) => {
  const blocks = db.prepare('SELECT DISTINCT block FROM readings ORDER BY block').all()
                   .map(r => r.block);
  res.json({ success: true, blocks });
});

// GET /api/summary  –  total kWh per block
app.get('/api/summary', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT block,
           ROUND(SUM(energy_kwh), 2)          AS total_kwh,
           ROUND(AVG(energy_kwh), 4)           AS avg_kwh_per_row,
           COUNT(*)                            AS row_count,
           MIN(date)                           AS from_date,
           MAX(date)                           AS to_date
    FROM readings
    GROUP BY block
    ORDER BY total_kwh DESC
  `).all();
  res.json({ success: true, summary: rows });
});

// GET /api/daily?block=G-H  –  total kWh per day (optionally filtered by block)
app.get('/api/daily', requireAuth, (req, res) => {
  const { block } = req.query;
  let rows;
  if (block) {
    rows = db.prepare(`
      SELECT date, ROUND(SUM(energy_kwh), 2) AS total_kwh
      FROM readings WHERE block = ?
      GROUP BY date ORDER BY date
    `).all(block);
  } else {
    rows = db.prepare(`
      SELECT date, block, ROUND(SUM(energy_kwh), 2) AS total_kwh
      FROM readings
      GROUP BY date, block ORDER BY date, block
    `).all();
  }
  res.json({ success: true, daily: rows });
});

// GET /api/appliances?block=G-H  –  kWh per appliance per block
app.get('/api/appliances', requireAuth, (req, res) => {
  const { block } = req.query;
  let rows;
  if (block) {
    rows = db.prepare(`
      SELECT appliance, ROUND(SUM(energy_kwh), 2) AS total_kwh
      FROM readings WHERE block = ?
      GROUP BY appliance ORDER BY total_kwh DESC
    `).all(block);
  } else {
    rows = db.prepare(`
      SELECT block, appliance, ROUND(SUM(energy_kwh), 2) AS total_kwh
      FROM readings
      GROUP BY block, appliance ORDER BY block, total_kwh DESC
    `).all();
  }
  res.json({ success: true, appliances: rows });
});

// GET /api/readings  –  paginated raw rows (admin only)
app.get('/api/readings', requireAdmin, (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(500, parseInt(req.query.limit) || 100);
  const offset = (page - 1) * limit;
  const block  = req.query.block || null;

  let rows, total;
  if (block) {
    rows  = db.prepare('SELECT * FROM readings WHERE block = ? LIMIT ? OFFSET ?').all(block, limit, offset);
    total = db.prepare('SELECT COUNT(*) as n FROM readings WHERE block = ?').get(block).n;
  } else {
    rows  = db.prepare('SELECT * FROM readings LIMIT ? OFFSET ?').all(limit, offset);
    total = db.prepare('SELECT COUNT(*) as n FROM readings').get().n;
  }
  res.json({ success: true, total, page, limit, readings: rows });
});

// POST /api/readings/upload  –  accept new CSV rows (admin only)
app.post('/api/readings/upload', requireAdmin, (req, res) => {
  try {
    const { csvData } = req.body;   // raw CSV string from client
    if (!csvData) return res.status(400).json({ success: false, message: 'No csvData provided' });

    const records = parse(csvData, { columns: true, skip_empty_lines: true, trim: true });

    const insert = db.prepare(`
      INSERT INTO readings
        (date, block, room, appliance, power_watts, duration_hours,
         energy_kwh, temperature_c, day_of_week, is_weekend)
      VALUES
        (@date, @block, @room, @appliance, @power_watts, @duration_hours,
         @energy_kwh, @temperature_c, @day_of_week, @is_weekend)
    `);

    const insertMany = db.transaction((rows) => {
      for (const r of rows) insert.run({
        date:           r.date,
        block:          r.block,
        room:           r.room,
        appliance:      r.appliance,
        power_watts:    parseFloat(r.power_watts)    || 0,
        duration_hours: parseFloat(r.duration_hours) || 0,
        energy_kwh:     parseFloat(r.energy_kwh)     || 0,
        temperature_c:  parseFloat(r.temperature_c)  || null,
        day_of_week:    r.day_of_week  || null,
        is_weekend:     r.is_weekend   || null,
      });
    });

    insertMany(records);
    console.log(`✓ Upload: ${records.length} rows added by ${req.user.username}`);
    res.json({ success: true, message: `${records.length} rows inserted`, count: records.length });

  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    res.status(400).json({ success: false, message: 'CSV parse error: ' + err.message });
  }
});

// GET /api/anomalies  –  readings significantly above block average
app.get('/api/anomalies', requireAuth, (req, res) => {
  // Flag rows where energy_kwh > 2 standard deviations above that block's mean
  const rows = db.prepare(`
    WITH stats AS (
      SELECT block,
             AVG(energy_kwh)                          AS mean,
             AVG(energy_kwh * energy_kwh) -
               AVG(energy_kwh) * AVG(energy_kwh)      AS variance
      FROM readings
      GROUP BY block
    )
    SELECT r.id, r.date, r.block, r.room, r.appliance,
           r.energy_kwh, r.power_watts,
           ROUND(s.mean, 3)               AS block_mean,
           ROUND(SQRT(s.variance), 3)     AS block_stddev,
           ROUND((r.energy_kwh - s.mean) /
             MAX(SQRT(s.variance), 0.001), 2) AS z_score
    FROM readings r
    JOIN stats s ON r.block = s.block
    WHERE ABS((r.energy_kwh - s.mean) / MAX(SQRT(s.variance), 0.001)) > 2
    ORDER BY z_score DESC
    LIMIT 50
  `).all();
  res.json({ success: true, anomalies: rows });
});

// GET /api/stats  –  overall numbers for dashboard cards
app.get('/api/stats', requireAuth, (req, res) => {
  const total   = db.prepare('SELECT ROUND(SUM(energy_kwh),2) AS v FROM readings').get().v;
  const topBlock = db.prepare(`
    SELECT block, ROUND(SUM(energy_kwh),2) AS v FROM readings GROUP BY block ORDER BY v DESC LIMIT 1
  `).get();
  const topAppliance = db.prepare(`
    SELECT appliance, ROUND(SUM(energy_kwh),2) AS v FROM readings GROUP BY appliance ORDER BY v DESC LIMIT 1
  `).get();
  const dateRange = db.prepare('SELECT MIN(date) as from_date, MAX(date) as to_date FROM readings').get();

  res.json({
    success: true,
    stats: {
      total_kwh:     total,
      top_block:     topBlock,
      top_appliance: topAppliance,
      date_range:    dateRange,
      row_count:     db.prepare('SELECT COUNT(*) as n FROM readings').get().n,
      user_count:    db.prepare('SELECT COUNT(*) as n FROM users').get().n,
    }
  });
});

// ── 404 fallback ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('GLOBAL ERROR:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ██╗    ██╗ █████╗ ████████╗████████╗██╗    ██╗██╗███████╗███████╗
  ██║    ██║██╔══██╗╚══██╔══╝╚══██╔══╝██║    ██║██║██╔════╝██╔════╝
  ██║ █╗ ██║███████║   ██║      ██║   ██║ █╗ ██║██║███████╗█████╗  
  ██║███╗██║██╔══██║   ██║      ██║   ██║███╗██║██║╚════██║██╔══╝  
  ╚███╔███╔╝██║  ██║   ██║      ██║   ╚███╔███╔╝██║███████║███████╗
   ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝      ╚═╝    ╚══╝╚══╝ ╚═╝╚══════╝╚══════╝

  Backend running  →  http://localhost:${PORT}
  Database         →  ${DB_PATH}
  `);
});
