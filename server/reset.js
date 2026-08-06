const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'portfolio.db');
console.log('Resetting database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database for reset:', err.message);
    process.exit(1);
  }
  
  db.serialize(() => {
    // Drop existing tables
    db.run('DROP TABLE IF EXISTS projects');
    db.run('DROP TABLE IF EXISTS users');
    db.run('DROP TABLE IF EXISTS contacts');
    
    db.close((err) => {
      if (err) {
        console.error('Error closing reset connection:', err.message);
        process.exit(1);
      }
      console.log('Tables dropped. Re-initializing database...');
      
      // Load database.js to recreate tables and seed default data
      const seedDb = require('./database');
      
      // Wait briefly for the async database initialization to complete
      setTimeout(() => {
        seedDb.close((err) => {
          if (err) {
            console.error('Error closing seeding connection:', err.message);
          } else {
            console.log('Database successfully reset and re-seeded!');
          }
          process.exit(0);
        });
      }, 2000);
    });
  });
});
