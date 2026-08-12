const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'retro_secret_key_1337';

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Helper to safely parse JSON strings
function safeParse(str, defaultVal = []) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultVal;
  }
}

// ---------------- PROJECTS ENDPOINTS ----------------

// Get all projects
router.get('/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Parse tags, architecture, and features back into arrays for frontend convenience
    const formatted = rows.map((project) => ({
      ...project,
      tags: safeParse(project.tags, []),
      architecture: safeParse(project.architecture, []),
      features: safeParse(project.features, [])
    }));
    res.json(formatted);
  });
});

// Create project (Admin)
router.post('/admin/projects', authenticateToken, (req, res) => {
  const {
    title, description, status, tags, overview, architecture,
    tech_stack, features, challenges, decisions, performance, learnings, live_link
  } = req.body;

  if (!title || !description || !status) {
    return res.status(400).json({ error: 'Title, description, and status are required' });
  }

  const tagsStr = JSON.stringify(tags || []);
  const archStr = JSON.stringify(architecture || []);
  const featStr = JSON.stringify(features || []);

  const query = `
    INSERT INTO projects (
      title, description, status, tags, overview, architecture,
      tech_stack, features, challenges, decisions, performance, learnings, live_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    title, description, status, tagsStr, overview, archStr,
    tech_stack, featStr, challenges, decisions, performance, learnings, live_link || null
  ], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Project cartridge created' });
  });
});

// Update project (Admin)
router.put('/admin/projects/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    title, description, status, tags, overview, architecture,
    tech_stack, features, challenges, decisions, performance, learnings, live_link
  } = req.body;

  if (!title || !description || !status) {
    return res.status(400).json({ error: 'Title, description, and status are required' });
  }

  const tagsStr = JSON.stringify(tags || []);
  const archStr = JSON.stringify(architecture || []);
  const featStr = JSON.stringify(features || []);

  const query = `
    UPDATE projects SET
      title = ?, description = ?, status = ?, tags = ?, overview = ?, architecture = ?,
      tech_stack = ?, features = ?, challenges = ?, decisions = ?, performance = ?, learnings = ?, live_link = ?
    WHERE id = ?
  `;

  db.run(query, [
    title, description, status, tagsStr, overview, archStr,
    tech_stack, featStr, challenges, decisions, performance, learnings, live_link || null,
    id
  ], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project cartridge updated' });
  });
});

// Delete project (Admin)
router.delete('/admin/projects/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM projects WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project cartridge deleted' });
  });
});


// ---------------- CONTACT ENDPOINTS ----------------

// Submit contact inquiry (Public)
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields (name, email, message) are required' });
  }

  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  db.run(
    'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
    [name, email, message],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Message sent successfully. Save File updated!' });
    }
  );
});

// Get contact inquiries (Admin)
router.get('/admin/messages', authenticateToken, (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Delete contact inquiry (Admin)
router.delete('/admin/messages/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM contacts WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Message deleted' });
  });
});


// ---------------- AUTHENTICATION ENDPOINTS ----------------

// Admin Login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({ token, username: user.username });
  });
});

module.exports = router;
