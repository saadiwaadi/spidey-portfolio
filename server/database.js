const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'portfolio.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Create Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Contacts table
    db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Projects table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        tags TEXT NOT NULL, -- JSON array
        overview TEXT,
        architecture TEXT, -- JSON array
        tech_stack TEXT,
        features TEXT, -- JSON array
        challenges TEXT,
        decisions TEXT,
        performance TEXT,
        learnings TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Seed Database
      seedData();
    });
  });
}

function seedData() {
  // Check if admin user exists, if not seed a default one
  db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (err) return console.error('Error checking admin user:', err.message);
    if (!row) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(defaultPassword, salt);
      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        ['admin', hashedPassword],
        (err) => {
          if (err) console.error('Error seeding admin user:', err.message);
          else console.log('Seeded default admin user with username: admin');
        }
      );
    }
  });

  // Check if projects already exist, if not seed default ones
  db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
    if (err) return console.error('Error checking projects count:', err.message);
    if (row && row.count === 0) {
      console.log('Seeding initial project cartridges...');
      const defaultProjects = [
        {
          title: 'Cheema Traders POS',
          description: 'Electron + SQLite point of sale. Atomic write paths across sales, payments and expenses, with an inline GL ledger, Excel/PDF export and a standardized delete-with-reversal pattern.',
          status: 'LIVE',
          tags: JSON.stringify(['Electron', 'SQLite']),
          overview: 'An offline-first desktop Point of Sale (POS) solution built for Cheema Traders to manage sales, expenses, inventory, and dual-ledger accounts.',
          architecture: JSON.stringify([
            'System Architecture: Desktop client shell isolating local system calls.',
            'Backend: Electron main process managing configuration, file exports, and database persistence.',
            'Frontend: React renderer UI with custom styling.',
            'Database: SQLite database embedded locally within user data storage.',
            'APIs & Auth: Fully local, no external APIs. File protection rules applied.',
            'Deployment: Packaged native installers generated via Electron builder.'
          ]),
          tech_stack: 'Electron, SQLite, JavaScript, HTML5, CSS3, ExcelJS, PDFKit.',
          features: JSON.stringify([
            'Dual-Ledger Accounting: Real-time balancing tracking customer and supplier transactions.',
            'General Ledger Panel: Inline summaries with Excel sheet and PDF invoice exporters.',
            'Delete-with-Reversal: Enforces account transparency by requiring reversal items instead of database deletions.'
          ]),
          challenges: 'Encountered silent general-ledger (GL) desync bugs during concurrent ledger updates. Solved by refactoring the sales, customer payments, supplier payments, and expense write paths into database-level atomic transactions, ensuring database queries commit fully or rollback entirely.',
          decisions: 'Opted for an embedded SQLite database inside an Electron shell to eliminate dependency on unstable internet connections in retail zones, guaranteeing 100% operational uptime.',
          performance: 'Indexed SQLite primary transaction tables, keeping query retrieval times below 10ms for up to 100,000 ledger records.',
          learnings: 'Acquired deep insight into data integrity practices. Enforcing strict validation rules on the database-level is superior to managing logic purely on the frontend wrapper.'
        },
        {
          title: 'River View ERP',
          description: 'React + PostgreSQL ERP. Full financial-integrity audit, six confirmed bugs resolved, plus a discount/amnesty scheme with a context-aware payment modal.',
          status: 'LIVE',
          tags: JSON.stringify(['React', 'PostgreSQL']),
          overview: 'An Enterprise Resource Planning (ERP) platform for River View real estate, tracking plot installment scheduling, late fee structures, and billing details.',
          architecture: JSON.stringify([
            'System Architecture: Dynamic single-page client coupled with a RESTful server.',
            'Backend: Django REST framework managing data serialization and payment processing.',
            'Frontend: React client with a responsive modular layout.',
            'Database: PostgreSQL engine tracking plot indices and user accounts.',
            'APIs & Auth: JSON Web Tokens (JWT) for secure REST API endpoints authentication.',
            'Deployment: Containerized REST server deployed via Railway.'
          ]),
          tech_stack: 'React, Python, Django, PostgreSQL, Tailwind CSS, Docker, Railway.',
          features: JSON.stringify([
            'Installment Matrices: Dynamic payment schedule sheets indicating upcoming billing plans.',
            'Discount / Amnesty Engine: Highly configurable scheme allowing exclusions on a per-plot basis.',
            'Context-Aware Payments: UI modal matching payment entries against real-time ledger validations.'
          ]),
          challenges: 'Ledger integrity bugs causing orphaned payment logs and trial-balance discrepancies. Conducted a complete audit and corrected six confirmed bugs by adding constraints and foreign key triggers on PostgreSQL schemas.',
          decisions: 'Selected PostgreSQL over NoSQL to handle complex transactional ledger queries that require strict schema enforcement and multi-table ACID guarantees.',
          performance: 'Utilized PG connection poolers, ensuring heavy installment ledger reports execute in under 1.5 seconds under high concurrent user loads.',
          learnings: 'Learned that complex scheduling systems require automated ledger reconciliation tests to guarantee balance sheet accuracy.'
        },
        {
          title: 'ORACLE-26',
          description: 'Dixon-Coles-corrected Poisson model with opponent-adjusted lambdas and live-form data. ~61% accuracy across 82+ matches, Brier score ~0.54, five scheduled GitHub Actions scrapers.',
          status: 'RUNNING',
          tags: JSON.stringify(['Python', 'GitHub Actions', 'mutmut']),
          overview: 'A statistical football match prediction engine evaluating match win/draw probabilities using live league histories and Dixon-Coles time-decay weights.',
          architecture: JSON.stringify([
            'System Architecture: Automation-driven batch computation pipeline.',
            'Backend: Python engine executing SciPy Poisson probability calculators.',
            'Frontend: Automatically updated markdown stats logs in git repositories.',
            'Database: High-performance local Pandas dataframes.',
            'APIs: Python requests scrapers pulling real-time football score feeds.',
            'Deployment: Runs on scheduled crons via GitHub Actions workflow triggers.'
          ]),
          tech_stack: 'Python, SciPy, Pandas, NumPy, GitHub Actions, mutmut.',
          features: JSON.stringify([
            'Dixon-Coles Engine: Advanced Poisson distributions adjusting team strength parameters based on timeline weights.',
            'Automated Ingestion: Five scheduled scrapers collecting match histories and player card stats dynamically.',
            'Brier Evaluator: Automated error monitoring reporting a Brier score of ~0.54.'
          ]),
          challenges: 'Mitigating silent regressions in predictive probability math. Resolved by adopting mutation testing (via mutmut), achieving a ~70% mutation score to verify that mathematical equations handle parameters without breaking.',
          decisions: 'Deployed on GitHub Actions rather than a continuous active web server, cutting operating expenses to zero while executing scheduled runs reliably.',
          performance: 'Refactored Scipy arrays, dropping match evaluation times down to under 50ms per match history calculation block.',
          learnings: 'Mutation testing is a critical tool for statistical codebases, finding missing tests and logic flaws that standard coverage metrics fail to flag.'
        },
        {
          title: 'CarrierLens',
          description: 'End-to-end production architecture: React/Vite on Vercel, Express/Docker on Railway, Supabase for data, BullMQ for background jobs.',
          status: 'SHIPPED',
          tags: JSON.stringify(['React', 'Railway', 'Supabase', 'BullMQ']),
          overview: 'Architecting a resilient, distributed web backend to ingest logistics and shipping records without downtime.',
          architecture: JSON.stringify([
            'System Architecture: Decoupled microservices architecture.',
            'Backend: Express REST API running inside Docker.',
            'Frontend: React/Vite client hosted on Vercel.',
            'Database: Supabase PostgreSQL instances with row-level security.',
            'APIs & Workers: Redis-backed BullMQ handling asynchronous tracking synchronization.',
            'Deployment: Railway container servers.'
          ]),
          tech_stack: 'React, Vite, Node.js, Express, Docker, Railway, Supabase, BullMQ, Redis.',
          features: JSON.stringify([
            'Decoupled Queue Workers: BullMQ jobs running separately from web API server nodes.',
            'Real-time Tracking: Webhook listeners updating shipment status tables.',
            'Containerization: Structured Docker builds maintaining system behavior across dev and production.'
          ]),
          challenges: 'Logistical syncing tasks blocking the server thread and causing API timeouts. Resolved by offloading the sync operations to BullMQ queue workers, freeing Express backend nodes from parsing data.',
          decisions: 'Paired Railway container hosts with Supabase PostgreSQL because of their quick scalability and built-in replication tools, accelerating development velocity.',
          performance: 'Decoupled queue worker structure scales independently, allowing processing of up to 500 concurrent tracking updates without slowing API response times.',
          learnings: 'Dividing complex platforms into isolated services prevents bottlenecking, maintaining reliable performance under heavy usage.'
        },
        {
          title: 'Pace',
          description: 'Personal productivity app covering habits, notes, projects, timers and calendar, with a Supabase sync layer built on last-write-wins and row-level security.',
          status: 'PERSONAL',
          tags: JSON.stringify(['React', 'Dexie', 'Supabase']),
          overview: 'An offline-first personal dashboard coordinating notes, habits, calendars, and tasks with real-time cloud synchronization.',
          architecture: JSON.stringify([
            'System Architecture: Client-side database replicating changes to a cloud backend.',
            'Database (Local): Dexie.js wrapping IndexedDB for offline persistence.',
            'Database (Cloud): Supabase PostgreSQL instances with Row-Level Security.',
            'Frontend: React client with a responsive interface.',
            'APIs & Auth: Supabase client libraries running WebSocket replication.',
            'Deployment: Vercel static hosting.'
          ]),
          tech_stack: 'React, Dexie.js, IndexedDB, Supabase, Tailwind CSS, Vercel.',
          features: JSON.stringify([
            'IndexedDB Persistence: Complete offline operation, keeping local user data instant.',
            'Last-Write-Wins Sync: Timestamp conflict resolution rules on IndexedDB tables.',
            'Row-Level Security: Strict Postgres rules ensuring users only edit their own records.'
          ]),
          challenges: 'Syncing offline client edits without overwriting newer data. Built a timestamp resolution layer inside Dexie synchronization hooks, ensuring newer client edits persist while resolving conflicts automatically.',
          decisions: 'Chose Dexie.js for client storage to bypass local query lag, utilizing Supabase WebSockets as a lightweight backend sync layer.',
          performance: 'Client transactions run locally in IndexedDB cache, resolving in under 50ms and syncing in the background once online.',
          learnings: 'Offline-first application design is best implemented when data mutations are saved as sequential logs, making synchronization straightforward and predictable.'
        },
        {
          title: 'Siyaahi',
          description: 'Design and print label producing stickers, posters, and custom editorial visual identities.',
          status: 'DESIGN',
          tags: JSON.stringify(['Editorial Identity', 'Print Design', 'Merchandise']),
          overview: 'A design and print label studio creating visual designs, poster art, high-dpi stickers, and modern editorial identities.',
          architecture: JSON.stringify([
            'System Architecture: Print production design structures and asset configurations.',
            'Tech Stack: Vector design environments.',
            'Export Parameters: High-resolution rasterization and layout alignment.'
          ]),
          tech_stack: 'Adobe Illustrator, Figma, Vector Assets, CMYK Proofing.',
          features: JSON.stringify([
            'Editorial Identities: Cohesive asset kits for corporate and creative branding.',
            'Print Layouts: Custom templates formatted for large posters and tiny custom stickers.',
            'Merchandising Formats: Print-ready files adapted for multiple materials.'
          ]),
          challenges: 'Visual distortions and color differences between digital monitors and paper prints. Solved by mapping monitor outputs strictly to CMYK profiles, and enforcing minimum 300 DPI exports on physical assets.',
          decisions: 'Committed strictly to vector design methods, guaranteeing infinite scale potential from stickers to billboards without loss of clarity.',
          performance: 'Organized assets using standardized file structures, matching the strict formatting requirements of print shops.',
          learnings: 'Designing for print requires an understanding of physical paper traits, ink absorption dynamics, and print sizing constraints.'
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO projects (
          title, description, status, tags, overview, architecture,
          tech_stack, features, challenges, decisions, performance, learnings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      defaultProjects.forEach((p) => {
        stmt.run(
          p.title, p.description, p.status, p.tags, p.overview, p.architecture,
          p.tech_stack, p.features, p.challenges, p.decisions, p.performance, p.learnings
        );
      });
      stmt.finalize();
      console.log('Project cartridges seeded successfully.');
    }
  });
}

module.exports = db;
