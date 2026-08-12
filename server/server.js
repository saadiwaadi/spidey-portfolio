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

async function startServer() {
  // Serve static assets if in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  } else {
    // Integrate Vite dev server in middleware mode
    const { createServer: createViteServer } = require('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      root: path.join(__dirname, '../client'),
      appType: 'spa'
    });
    app.use(vite.middlewares);
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
    console.log(`📡 Server listening at http://localhost:${PORT}`);
    console.log(`=================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
