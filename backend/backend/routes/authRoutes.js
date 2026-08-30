const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// @route   POST /api/auth/login
// Single-admin login: credentials are compared against ADMIN_EMAIL / ADMIN_PASSWORD
// in the environment, not a database — there is intentionally no public registration
// for a personal portfolio's admin panel.
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (email.toLowerCase() !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
