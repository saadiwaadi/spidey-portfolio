require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local dev; can narrow this down in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', routes);

// Serve static assets if in production (optional future deployment setup)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // Simple welcome endpoint
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Saad Ahmad Portfolio REST API Server' });
  });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong inside the retro machine!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🎮 Retro Server booting up...`);
  console.log(`📡 API listening at http://localhost:${PORT}`);
  console.log(`=================================================`);
});
