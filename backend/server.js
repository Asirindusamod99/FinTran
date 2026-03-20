require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const db = require('./database');
const { verifyToken } = require('./middleware/auth');

const app = express();

// ─── FIX 1: CORS - Localhost + Production දෙකම Allow ───────────
const allowedOrigins = [
  'https://asirindusamod.online',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8080'
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Not Allowed: ' + origin));
    }
  },
  credentials: true
}));
app.use(express.json());

// ─── FIX 2: Admin Credentials from .env ─────────────────────────
const JWT_SECRET   = process.env.JWT_SECRET   || 'fintran_super_secret_key_12345';
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL  || 'admin@gmail.com';
const ADMIN_PASS   = process.env.ADMIN_PASSWORD || 'admin123';

// ─── SES / Nodemailer Setup ──────────────────────────────────────
const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || ''
  }
});

const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand }
});

// ─── AUTH APIS ────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { id, name, email, password, avatar, currency, createdAt } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const userId  = id || 'usr_' + Date.now();
  const created = createdAt || new Date().toISOString();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      `INSERT INTO users (id, name, email, password, avatar, currency, createdAt, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, avatar || '', currency || 'LKR', created, 0]
    );
    const token = jwt.sign({ id: userId, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, name, email, avatar, currency, createdAt: created, role: 'user' } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // ─── FIX 2 Applied: Admin credentials from .env ───────────────
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    const token = jwt.sign({ id: 'owner', email, role: 'owner' }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, user: { id: 'owner', name: 'Dashboard Owner', email, role: 'owner' } });
  }

  try {
    const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.blocked) return res.status(403).json({ error: 'Account blocked' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    delete user.password;
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const [users] = await db.execute(`SELECT id FROM users WHERE email = ?`, [email]);
    if (users.length === 0) return res.status(404).json({ error: 'No account found with that email' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    await db.execute(
      `INSERT INTO password_resets (email, otp, expiresAt) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE otp=VALUES(otp), expiresAt=VALUES(expiresAt)`,
      [email, otp, expiresAt]
    );
    transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@fintran.lk',
      to: email,
      subject: 'FinTran Password Reset OTP',
      html: `<div style="padding:40px;text-align:center;"><h2>Your OTP: ${otp}</h2><p>Valid for 10 minutes.</p></div>`
    }, () => {
      console.log(`[Dev] OTP for ${email}: ${otp}`);
      res.json({ success: true, message: 'OTP sent.', devOtp: otp });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [rows] = await db.execute(`SELECT * FROM password_resets WHERE email = ?`, [email]);
    const record = rows[0];
    if (!record || record.otp !== String(otp).trim()) return res.status(400).json({ error: 'Invalid OTP' });
    if (Date.now() > record.expiresAt) return res.status(400).json({ error: 'OTP has expired' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const [rows] = await db.execute(`SELECT * FROM password_resets WHERE email = ?`, [email]);
    const record = rows[0];
    if (!record || record.otp !== String(otp).trim()) return res.status(400).json({ error: 'Invalid or missing OTP' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [update] = await db.execute(`UPDATE users SET password = ? WHERE email = ?`, [hashedPassword, email]);
    if (update.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    await db.execute(`DELETE FROM password_resets WHERE email = ?`, [email]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  if (req.user.role === 'owner') {
    return res.json({ id: 'owner', name: 'Dashboard Owner', email: ADMIN_EMAIL, role: 'owner' });
  }
  try {
    const [rows] = await db.execute(`SELECT id, name, email, avatar, currency, createdAt, blocked FROM users WHERE id = ?`, [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TRANSACTIONS APIS ────────────────────────────────────────────

app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'owner') {
      const [rows] = await db.execute(`SELECT * FROM transactions ORDER BY date DESC`);
      return res.json(rows);
    }
    const [rows] = await db.execute(
      `SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC, createdAt DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', verifyToken, async (req, res) => {
  const { id, type, amount, categoryId, description, date, createdAt } = req.body;
  const txnId = id || 'txn_' + Date.now();
  try {
    await db.execute(
      `INSERT INTO transactions (id, userId, type, amount, categoryId, description, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [txnId, req.user.id, type, amount, categoryId, description || '', date, createdAt || new Date().toISOString()]
    );
    const [rows] = await db.execute(`SELECT * FROM transactions WHERE id = ?`, [txnId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FIX 3: Missing PUT /api/transactions/:id ─────────────────────
app.put('/api/transactions/:id', verifyToken, async (req, res) => {
  const { type, amount, categoryId, description, date } = req.body;
  try {
    await db.execute(
      `UPDATE transactions SET type=?, amount=?, categoryId=?, description=?, date=? WHERE id=? AND userId=?`,
      [type, amount, categoryId, description || '', date, req.params.id, req.user.id]
    );
    const [rows] = await db.execute(`SELECT * FROM transactions WHERE id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', verifyToken, async (req, res) => {
  try {
    await db.execute(`DELETE FROM transactions WHERE id = ? AND userId = ?`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FIX 3: Missing BUDGETS APIS ─────────────────────────────────

app.get('/api/budgets', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM budgets WHERE userId = ?`, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', verifyToken, async (req, res) => {
  const { categoryId, limit: budgetLimit, period } = req.body;
  try {
    await db.execute(
      `INSERT INTO budgets (userId, categoryId, \`limit\`, period) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE \`limit\`=VALUES(\`limit\`), period=VALUES(period)`,
      [req.user.id, categoryId, budgetLimit, period || 'monthly']
    );
    const [rows] = await db.execute(`SELECT * FROM budgets WHERE userId=? AND categoryId=?`, [req.user.id, categoryId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/budgets/:categoryId', verifyToken, async (req, res) => {
  try {
    await db.execute(`DELETE FROM budgets WHERE categoryId = ? AND userId = ?`, [req.params.categoryId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FIX 3: Missing SAVINGS GOALS APIS ───────────────────────────

app.get('/api/savings_goals', verifyToken, async (req, res) => {
  try {
    const [goals] = await db.execute(`SELECT * FROM savings_goals WHERE userId = ?`, [req.user.id]);
    const [deposits] = await db.execute(`SELECT * FROM savings_deposits WHERE userId = ?`, [req.user.id]);
    const goalsWithDeposits = goals.map(g => ({
      ...g,
      deposits: deposits.filter(d => d.goalId === g.id)
    }));
    res.json(goalsWithDeposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/savings_goals', verifyToken, async (req, res) => {
  const { id, name, target, current, deadline, icon, color, createdAt } = req.body;
  const goalId = id || 'goal_' + Date.now();
  try {
    await db.execute(
      `INSERT INTO savings_goals (id, userId, name, target, current, deadline, icon, color, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [goalId, req.user.id, name, target, current || 0, deadline || null, icon || 'fa-piggy-bank', color || '#6366f1', createdAt || new Date().toISOString()]
    );
    const [rows] = await db.execute(`SELECT * FROM savings_goals WHERE id = ?`, [goalId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/savings_goals/:id', verifyToken, async (req, res) => {
  const { name, target, current, deadline, icon, color } = req.body;
  try {
    await db.execute(
      `UPDATE savings_goals SET name=?, target=?, current=?, deadline=?, icon=?, color=? WHERE id=? AND userId=?`,
      [name, target, current, deadline || null, icon, color, req.params.id, req.user.id]
    );
    const [rows] = await db.execute(`SELECT * FROM savings_goals WHERE id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/savings_goals/:id', verifyToken, async (req, res) => {
  try {
    await db.execute(`DELETE FROM savings_goals WHERE id = ? AND userId = ?`, [req.params.id, req.user.id]);
    await db.execute(`DELETE FROM savings_deposits WHERE goalId = ? AND userId = ?`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/savings_goals/:goalId/deposit', verifyToken, async (req, res) => {
  const { amount, note, date } = req.body;
  const depositId = 'dep_' + Date.now();
  const { goalId } = req.params;
  try {
    await db.execute(
      `INSERT INTO savings_deposits (id, goalId, userId, amount, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [depositId, goalId, req.user.id, amount, note || '', date || new Date().toISOString()]
    );
    await db.execute(
      `UPDATE savings_goals SET current = current + ? WHERE id = ? AND userId = ?`,
      [amount, goalId, req.user.id]
    );
    const [rows] = await db.execute(`SELECT * FROM savings_goals WHERE id = ?`, [goalId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN APIS ───────────────────────────────────────────────────

app.get('/api/admin/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Forbidden' });
  try {
    const [users] = await db.execute(`SELECT id, name, email, avatar, currency, createdAt, blocked FROM users ORDER BY createdAt DESC`);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id/block', verifyToken, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Forbidden' });
  const { blocked } = req.body;
  try {
    await db.execute(`UPDATE users SET blocked = ? WHERE id = ?`, [blocked ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SERVER START ─────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FinTran Server running on port ${PORT}`);
});