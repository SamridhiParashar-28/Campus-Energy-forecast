const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function ensureUsersFile() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
}
ensureUsersFile();

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://super-duper-potato-wrqr74gvwqg6hv59g-5500.app.github.dev'
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

app.use((req, _res, next) => {
  console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.url);
  next();
});

function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users file:', err.message);
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function sanitise(str) {
  return (str || '').trim().replace(/[\x00-\x1F\x7F]/g, '');
}

app.post('/register', async (req, res) => {
  try {
    const username = sanitise(req.body.username);
    const password = sanitise(req.body.password);
    const requestedRole = sanitise(req.body.role || 'viewer');

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ success: false, message: 'Username must be 3-50 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Only allow 'admin' or 'viewer' — anything else defaults to viewer
    const role = requestedRole === 'admin' ? 'admin' : 'viewer';

    const users = loadUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(409).json({ success: false, message: 'Username already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    users.push({ username, password: hashedPassword, role, createdAt: new Date().toISOString() });
    saveUsers(users);

    console.log('Registered:', username, '| Role:', role);
    return res.status(201).json({ success: true, message: 'Account created successfully.', username, role });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const username = sanitise(req.body.username);
    const password = sanitise(req.body.password);

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const users = loadUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    const fakeHash = '$2a$12$invalidhashfortimingprotection000000000000000000000000';
    const isCorrect = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, fakeHash).then(() => false);

    if (!user || !isCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = 'fake-jwt-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    const role  = user.role || 'viewer';
    return res.json({ success: true, message: 'Login successful.', username: user.username, token, role });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ── Admin: list all users (no passwords) ──────────────────
app.get('/users', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorised.' });

  const users = loadUsers();
  const safe  = users.map(u => ({ username: u.username, role: u.role || 'viewer', createdAt: u.createdAt }));
  return res.json({ success: true, users: safe });
});

// ── Admin: update a user's role ────────────────────────────
app.post('/users/role', (req, res) => {
  const token    = (req.headers.authorization || '').replace('Bearer ', '');
  const target   = sanitise(req.body.username);
  const newRole  = sanitise(req.body.role);

  if (!token)  return res.status(401).json({ success: false, message: 'Unauthorised.' });
  if (!target) return res.status(400).json({ success: false, message: 'Username required.' });
  if (!['admin','viewer'].includes(newRole))
    return res.status(400).json({ success: false, message: 'Role must be admin or viewer.' });

  const users = loadUsers();
  const idx   = users.findIndex(u => u.username.toLowerCase() === target.toLowerCase());
  if (idx === -1) return res.status(404).json({ success: false, message: 'User not found.' });

  users[idx].role = newRole;
  saveUsers(users);
  console.log('Role updated:', target, '->', newRole);
  return res.json({ success: true, message: `${target} is now ${newRole}.` });
});

// ── Admin: delete a user ───────────────────────────────────
app.post('/users/delete', (req, res) => {
  const token  = (req.headers.authorization || '').replace('Bearer ', '');
  const target = sanitise(req.body.username);
  const caller = sanitise(req.body.caller);

  if (!token)  return res.status(401).json({ success: false, message: 'Unauthorised.' });
  if (!target) return res.status(400).json({ success: false, message: 'Username required.' });
  if (target.toLowerCase() === caller.toLowerCase())
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });

  const users   = loadUsers();
  const filtered = users.filter(u => u.username.toLowerCase() !== target.toLowerCase());
  if (filtered.length === users.length)
    return res.status(404).json({ success: false, message: 'User not found.' });

  saveUsers(filtered);
  console.log('User deleted:', target);
  return res.json({ success: true, message: `${target} deleted.` });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (_req, res) => {
  res.json({ message: 'WattWise backend is running.' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
  console.log('Users file: ' + USERS_FILE);
});