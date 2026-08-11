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
        still_working TEXT,
        future_work TEXT,
        status_detail TEXT,
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
          title: "Cheema Traders POS",
          status: "LIVE",
          description: "A desktop POS and accounting system for a business that doesn't get to be wrong about money.",
          tags: JSON.stringify(["Electron", "SQLite"]),
          overview: `A desktop POS and accounting system for a business that doesn't get to be wrong about money.

Cheema Traders POS is a local desktop system built for a real trading business, combining point-of-sale operations with customer ledgers, supplier payments, expenses, cashbook, and general ledger management.

The interesting part isn't selling something through a screen. It's making sure that sale still makes sense when someone checks the books six months later.

### The idea

Most POS systems are built around the transaction: make the sale, print the receipt, move on.

For a trading business, that's only the beginning.

A sale changes a customer's balance. A payment changes the ledger. A return reverses part of a transaction. An expense affects the books. Every one of those actions has consequences somewhere else in the system.

Cheema Traders POS was built around keeping those relationships intact.`,
          architecture: JSON.stringify([
            "Electron: Native desktop runtime wrapping the desktop application interface.",
            "SQLite (via better-sqlite3): Local database engine running directly on-device with zero internet dependencies.",
            "Transactional Write Layer: Ensures sales, payments, and expenses commit atomically or roll back entirely.",
            "Connected Ledgers: Keeps general ledger, cashbook, and supplier records bound to transactions."
          ]),
          tech_stack: "Electron · SQLite · better-sqlite3 · JavaScript",
          features: JSON.stringify([
            "Dual-Ledger Accounting: Tracks custom outstanding DR balances against live cashbooks.",
            "Reversals System: Deletes use transparent accounting reversal offsets instead of purging database rows.",
            "General Ledger Reporting: Native summaries with Excel/PDF layout exporters."
          ]),
          challenges: `Financial bugs are particularly nasty because they don't necessarily crash anything.

A UI bug is visible.

A ledger being wrong by a few thousand rupees can quietly sit there until someone notices that the numbers don't reconcile.

During auditing, the system uncovered issues including double-counting in Total Paid calculations and a structural difference between the cached customer balance and the live-calculated Outstanding DR figure.

Those weren't application crashes.

They were numbers that looked perfectly reasonable until someone actually questioned them.

That changed how the system is being developed: financial correctness has to be actively tested and audited rather than assumed because the application runs.`,
          decisions: `Electron → better-sqlite3 → SQLite

The application is deliberately local-first.

Sales, payments, expenses, and ledger operations happen directly against the local database, without a network request sitting between the user and the transaction.

That makes the system simple to deploy for a single-location business while also eliminating an entire category of internet and server dependency.`,
          performance: "Indexed SQLite primary transaction tables, keeping query retrieval times below 10ms for up to 100,000 ledger records.",
          learnings: `Building this system made one thing painfully clear:

A successful transaction isn't the same thing as a correct transaction.

The application can save the sale, print the invoice, and return a green success message while the books are quietly wrong somewhere underneath.

That means accounting software needs a different mindset from ordinary CRUD applications. Transactions need invariants. Reversals need rules. Historical data needs protection. And sometimes the most important feature is an audit that tells you your own software was wrong.`,
          still_working: `The project has already gone through a number of accounting-specific corrections.

Full invoice voiding had to be replaced with proper partial-return handling.

Core financial operations had to be converted to atomic transactions after discovering potential ledger desynchronization.

Deletion logic became complicated enough to earn its own DELETION_BACKLOG.md, documenting how different records should reverse their accounting effects instead of simply disappearing.

And the cached-balance versus live-Outstanding-DR discrepancy is still an open structural issue being investigated.

Basically, the accounting bugs don't care how clean the UI looks.

### The fun bit

There is literally a file called DELETION_BACKLOG.md.

It exists because deleting something in an accounting system isn't really deleting it.

If a payment disappears, its ledger effect has to disappear correctly too. If an expense is removed, the corresponding accounting entries need to be reversed. Eventually there were enough edge cases that the solution became: write down the rules so future-me stops inventing new versions of accounting logic.

It's probably the least glamorous file in the project and one of the most important.`,
          future_work: `The next stage is focused heavily on auditing and financial consistency rather than simply adding more screens.

That includes resolving the cached-balance/live-balance discrepancy, strengthening reconciliation tools, expanding automated tests around accounting invariants, and continuing to audit reversal and transaction paths.

There is also room for deeper reporting, forecasting, multi-shop capabilities, and additional inventory functionality as the operational requirements grow.

The principle stays the same: new features shouldn't make the underlying financial truth harder to verify.`,
          status_detail: `Production project · Actively used · Actively audited

Cheema Traders POS is being used for real business operations and is still under active development and financial auditing.

The core POS, ledger, accounting, payment, expense, and reversal workflows are in place. Current development is focused on hardening the system, finding discrepancies before they become business problems, and making the accounting layer increasingly difficult to get wrong.`
        },
        {
          title: "River View ERP",
          status: "LIVE",
          description: "A business management system built to replace spreadsheets with something that actually remembers what happened.",
          tags: JSON.stringify(["React", "Vite", "Node.js", "Express", "MongoDB"]),
          overview: `A business management system built to replace spreadsheets with something that actually remembers what happened.

River View ERP is a custom management system built for a housing society to move its day-to-day operations away from scattered Excel files and into one connected system.

It brings member records, plot information, utility billing, ledgers, complaints, bookings, and administrative operations into a single place — while keeping the system practical enough for the people who actually have to use it.

### The idea

The problem wasn't that the society didn't have data.

It had too much of it, spread across too many places.

Records lived in spreadsheets, billing involved manual calculations, and keeping historical information consistent became increasingly difficult as the number of houses grew.

River View was built around a simpler idea: one system should know what happened, when it happened, and what the current state is.`,
          architecture: JSON.stringify([
            "React + Vite: Modern fast client-side administrative interface.",
            "Node.js + Express: Backend REST API owning business rules, calculations, and security.",
            "MongoDB: Flexible document storage for members, plots, bills, bookings, and complaints.",
            "JWT + bcrypt: Secure role-based authorization for administrators and members.",
            "Local-first Deployment: Set up initially on-premise on the society's own infrastructure."
          ]),
          tech_stack: "React · Vite · Tailwind CSS · Node.js · Express · MongoDB · JWT",
          features: JSON.stringify([
            "Member & Plot Records: Centralized, synchronized profiles for houses and residents.",
            "Utility Billing Engine: Automatically tracks monthly bills, late fees, and arrears.",
            "Unified Ledger: Connects society cash flows and outstanding balances dynamically."
          ]),
          challenges: `The most important engineering challenge was financial integrity.

When you're building a normal CRUD application, changing a record is usually straightforward.

When that record represents money someone already paid, it becomes a very different problem.

River View therefore had to distinguish between current calculations and historical truth. Reconciliation became a separate operation rather than something that happens invisibly whenever data changes.

That led to preview/dry-run behaviour, protection for settled records, and explicit handling of edge cases such as deleted plots and partially generated bills.`,
          decisions: `React → Express API → MongoDB

The frontend handles the operational interface, while the backend owns business rules and data integrity.

Authentication and permissions sit between the user and the underlying records, with separate member and administrator capabilities.

The system is designed around roughly 1,000 houses, with the initial deployment focused on local infrastructure and reliability rather than unnecessary cloud complexity.`,
          performance: "",
          learnings: `ERP software is less about having a lot of screens and more about preserving the relationship between things.

A bill isn't just a bill. It's connected to a house, a member, a month, previous arrears, payments, adjustments, and an eventual financial history.

Once those relationships matter, the job stops being "build a dashboard" and becomes "make sure the system doesn't lie."`,
          still_working: `The billing system went through several iterations because some seemingly harmless recalculation logic could mutate historical bills.

There were also the usual problems that appear when a system moves from development into actual deployment: database paths, local infrastructure, authentication edge cases, and keeping generated billing data consistent across different parts of the application.

Those problems ended up shaping the architecture more than the original feature list did.`,
          future_work: `Future development is focused on expanding the administrative tooling, improving reporting and financial visibility, strengthening billing reconciliation, and making the system easier for society staff to operate without technical assistance.

The broader goal is to turn what started as a replacement for spreadsheets into a dependable operational system for the society — one that can handle the boring, repetitive, financially important work without requiring someone to remember which Excel file contains the latest version.`,
          status_detail: `Production project · Actively maintained

River View ERP is built around a real operational use case rather than as a portfolio demo.

The core management and billing systems are in place, with ongoing work focused on reliability, reconciliation, reporting, and the edge cases that only become visible once software starts dealing with real records and real money.`
        },
        {
          title: "ORACLE-26",
          status: "RUNNING",
          description: "A football prediction engine built to argue with people about the 2026 World Cup.",
          tags: JSON.stringify(["Python", "GitHub Actions", "mutmut"]),
          overview: `A football prediction engine built to argue with people about the 2026 World Cup.

ORACLE-26 is a statistical football prediction engine built specifically around the 2026 World Cup and its expanded 48-team format.

It takes historical results, team strength, rankings, market value, recent form, lineups, and injuries and turns them into estimated win, draw, and loss probabilities.

The goal isn't to predict football perfectly. It's to put some actual numbers behind the arguments people make about it.

### The idea

I didn't start with a general-purpose prediction model and look for somewhere to use it.

The 2026 World Cup was the reason to build it.

The expanded tournament, different stages, changing squads, and constantly updating team information all became part of the architecture. The model is designed around the tournament rather than football prediction in the abstract.

And yes, part of the motivation was being able to answer "Argentina are obviously better than Morocco" with something slightly more useful than "trust me bro."`,
          architecture: JSON.stringify([
            "Python Scrapers: Scheduled scrapers collect fixtures, squads, lineups, match results, and injuries.",
            "Pandas & NumPy: Data ingestion, feature preparation, and statistical processing.",
            "Prediction Engine (engine.js): The core prediction engine written in JavaScript, isolated from the scraping pipeline.",
            "GitHub Actions: Scheduled cron jobs execute predictions and commit updates directly to Git history.",
            "Evaluation: Continuous backtesting and Brier score tracking."
          ]),
          tech_stack: "Python · SciPy · Pandas · NumPy · JavaScript · GitHub Actions",
          features: JSON.stringify([
            "Five Independent Scrapers: Resilient data collection so a single broken source does not halt the pipeline.",
            "Dixon-Coles Low-Score Correction: Adjusts standard Poisson limits for low-scoring match outcomes.",
            "Git-Backed Pipeline: Git commits act as the prediction audit logs without database server costs."
          ]),
          challenges: `The biggest engineering problem wasn't getting the model to run.

It was making sure the maths didn't quietly become wrong.

A normal software bug usually crashes something. Statistical bugs can happily return perfectly valid numbers while being completely incorrect.

That's why ORACLE-26 uses mutation testing with mutmut. The test suite deliberately introduces small mathematical changes — flipped signs, altered constants, changed operators — and checks whether the tests notice.

Current mutation coverage is roughly 70%, which also means roughly 30% of those injected changes can still slip through.

That's not something I'm hiding behind a percentage. It's one of the areas the project still needs to improve.`,
          decisions: `Python Scrapers → Pandas → Prediction Engine → Probability Matrix → Evaluation → Git History

The system runs as a scheduled batch pipeline.

Scrapers collect the latest available information, the engine recalculates team strength and score probabilities, and the resulting predictions and statistics are committed back into the repository.

No server sitting around waiting for requests. Just a scheduled job waking up, doing the maths, and going back to sleep.`,
          performance: `The model currently sits around 61% outcome accuracy across 82+ matches, with a Brier score around 0.54.

The Brier score is particularly important because accuracy alone can make a prediction model look better than it really is. It measures how well the probabilities themselves are calibrated — not just whether the final predicted outcome happened to be correct.

The model has useful signal.

It is also very much not a football oracle.

Hence the name.`,
          learnings: `Building a statistical system taught me something that ordinary application development doesn't make obvious:

A program returning a number doesn't mean the number deserves to exist.

The hardest part isn't making the model calculate. It's deciding whether the assumptions, data, probabilities, and evaluation around that calculation are actually trustworthy.

That's where most of the interesting engineering in ORACLE-26 ended up.`,
          still_working: `The project has had its share of wonderfully stupid bugs.

At one point the Dixon-Coles implementation wasn't actually implementing Dixon-Coles correctly and was effectively giving draws a flat boost. That was removed in favour of the proper low-score correction.

There are also incomplete historical rating values in the current static dataset, including missing elo_delta_90 data for Scotland and several other teams. That can propagate NaN values into parts of the momentum calculation and is still on the cleanup list.

And yes, there was also a complete index.html rewrite that got reverted.

Git remembers everything.`,
          future_work: `The next stage is less about adding random complexity and more about making the model harder to fool.

Planned work includes better historical data coverage, stronger injury and lineup weighting, improved mutation-test coverage, more rigorous backtesting, better probability calibration, and continued refinement of the World Cup stage-specific modifiers.

The long-term goal is to move from a model that can produce interesting predictions to one that can explain why it believes a prediction is likely — and quantify how confident it should actually be.`,
          status_detail: `Live · Actively developing

ORACLE-26 is deployed and continuously updated through scheduled data pipelines.

It is still an experimental prediction system rather than a finished scientific model — which is kind of the point. The project is as much about learning how to build, test, evaluate, and break statistical systems as it is about predicting who wins the World Cup.`
        },
        {
          title: "CarrierLens",
          status: "SHIPPED",
          description: "End-to-end production architecture: React/Vite on Vercel, Express/Docker on Railway, Supabase for data, BullMQ for background jobs.",
          tags: JSON.stringify(["React", "Railway", "Supabase", "BullMQ"]),
          overview: "Architecting a resilient, distributed web backend to ingest logistics and shipping records without downtime.",
          architecture: JSON.stringify([
            "System Architecture: Decoupled microservices architecture.",
            "Backend: Express REST API running inside Docker.",
            "Frontend: React/Vite client hosted on Vercel.",
            "Database: Supabase PostgreSQL instances with row-level security.",
            "APIs & Workers: Redis-backed BullMQ handling asynchronous tracking synchronization.",
            "Deployment: Railway container servers."
          ]),
          tech_stack: "React, Vite, Node.js, Express, Docker, Railway, Supabase, BullMQ, Redis.",
          features: JSON.stringify([
            "Decoupled Queue Workers: BullMQ jobs running separately from web API server nodes.",
            "Real-time Tracking: Webhook listeners updating shipment status tables.",
            "Containerization: Structured Docker builds maintaining system behavior across dev and production."
          ]),
          challenges: "Logistical syncing tasks blocking the server thread and causing API timeouts. Resolved by offloading the sync operations to BullMQ queue workers, freeing Express backend nodes from parsing data.",
          decisions: "Paired Railway container hosts with Supabase PostgreSQL because of their quick scalability and built-in replication tools, accelerating development velocity.",
          performance: "Decoupled queue worker structure scales independently, allowing processing of up to 500 concurrent tracking updates without slowing API response times.",
          learnings: "Dividing complex platforms into isolated services prevents bottlenecking, maintaining reliable performance under heavy usage."
        },
        {
          title: "Pace",
          status: "PERSONAL",
          description: "Offline-first productivity, built around the idea that the internet is optional.",
          tags: JSON.stringify(["React", "Dexie", "Supabase"]),
          overview: `Pace is a personal productivity dashboard for notes, habits, projects, timers, and calendar — designed to work instantly offline and quietly sync when a connection comes back.

The slightly obsessive part is underneath: the device is the primary source of truth. The cloud is basically a backup that catches up later.

### The idea

Most productivity apps assume you’re permanently online. Pace doesn’t.

Every action is written locally first, so checking a habit, starting a timer, or editing a project works exactly the same with a connection or without one. Sync happens in the background when it can.

And because apparently a normal productivity app wasn't strange enough, the UI also has Pokémon dropping mildly existential thoughts while you get things done.`,
          architecture: JSON.stringify([
            "React: Frontend and interaction layer, designed to feel closer to a native app than a traditional web dashboard.",
            "Dexie.js + IndexedDB: The local database and immediate source of truth. Reads and writes happen on-device first.",
            "Supabase + PostgreSQL: Cloud persistence with Row-Level Security keeping each user's data isolated at the database level.",
            "Custom Sync Layer: Queued mutations, retries, timestamps, conflict resolution, and background replication between local and cloud state.",
            "Vercel: Deployment and static hosting."
          ]),
          tech_stack: "React · Dexie.js · IndexedDB · Supabase · PostgreSQL · Tailwind CSS · Vercel",
          features: JSON.stringify([
            "Local interactions resolve without waiting for a network request.",
            "Database-level Row-Level Security means user isolation isn't just a frontend assumption.",
            "Dates are serialized and restored carefully across the sync boundary.",
            "Deleted records are tracked rather than simply disappearing, allowing the sync layer to understand what actually changed.",
            "Conflicts are resolved automatically instead of becoming the user's problem."
          ]),
          challenges: `The hardest part wasn't building the productivity modules. It was making two versions of the same data agree after one of them has been offline.

Pace uses timestamp-based Last-Write-Wins conflict resolution. Local mutations are queued while offline, retried when connectivity returns, and reconciled against newer versions without interrupting the user.

The UI never needs to know there was a fight.`,
          decisions: `React → Dexie / IndexedDB → Sync Queue → Supabase / PostgreSQL

Local state comes first. Cloud state catches up.

Supabase's realtime capabilities handle communication, while the custom QueueManager handles mutations that need to wait, retry, or fail without blocking the rest of the application.`,
          performance: "",
          learnings: `Offline-first isn't really about making an app work without Wi-Fi.

It's about deciding what "truth" means when multiple versions of the same thing exist.

Once every change becomes a local mutation that can be queued, replayed, compared, and reconciled, sync stops feeling like a separate feature and starts becoming part of the architecture itself.`,
          still_working: `Pace is deployed and used daily, but it isn't pretending to be finished.

The current work is mostly around the awkward edges of the system: timezone and date-shifting bugs in habit tracking, occasional mobile layout regressions, authentication edge cases, stale environment configuration during deployment, and making the sync layer more resilient when records are changed in multiple places.

There have also been the occasional bugs that sound completely unrelated until you remember everything is connected — a Tiptap editor crash, a broken habit heatmap, and the usual collection of small UI and state-management problems.

They're not glamorous, but they're part of making the architecture reliable rather than just functional.`,
          future_work: `The next stages are focused on expanding Pace without compromising its local-first foundation.

Planned work includes deeper calendar functionality, more powerful project and task management, richer habit analytics, improved sync diagnostics and recovery, stronger cross-device consistency, and continued refinement of the mobile experience.

The goal isn't to keep adding modules forever. It's to make the existing system feel increasingly complete while keeping the original rule intact:

Pace should remain useful even when the internet isn't.`,
          status_detail: `Shipped · Actively used daily

Pace is fully deployed and in daily use as my primary productivity system.

The core local-first architecture is complete, with calendar, habits, projects, timers, and notes all working offline-first and syncing in the background. Development now happens around refinement, new modules, and the less-visible engineering work that keeps local and cloud state from disagreeing.`
        },
        {
          title: "Siyaahi",
          status: "DESIGN",
          description: "Design and print label producing stickers, posters, and custom editorial visual identities.",
          tags: JSON.stringify(["Editorial Identity", "Print Design", "Merchandise"]),
          overview: "A design and print label studio creating visual designs, poster art, high-dpi stickers, and modern editorial identities.",
          architecture: JSON.stringify([
            "System Architecture: Print production design structures and asset configurations.",
            "Tech Stack: Vector design environments.",
            "Export Parameters: High-resolution rasterization and layout alignment."
          ]),
          tech_stack: "Adobe Illustrator, Figma, Vector Assets, CMYK Proofing.",
          features: JSON.stringify([
            "Editorial Identities: Cohesive asset kits for corporate and creative branding.",
            "Print Layouts: Custom templates formatted for large posters and tiny custom stickers.",
            "Merchandising Formats: Print-ready files adapted for multiple materials."
          ]),
          challenges: "Visual distortions and color differences between digital monitors and paper prints. Solved by mapping monitor outputs strictly to CMYK profiles, and enforcing minimum 300 DPI exports on physical assets.",
          decisions: "Committed strictly to vector design methods, guaranteeing infinite scale potential from stickers to billboards without loss of clarity.",
          performance: "Organized assets using standardized file structures, matching the strict formatting requirements of print shops.",
          learnings: "Designing for print requires an understanding of physical paper traits, ink absorption dynamics, and print sizing constraints."
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO projects (
          title, description, status, tags, overview, architecture,
          tech_stack, features, challenges, decisions, performance, learnings,
          still_working, future_work, status_detail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      defaultProjects.forEach((p) => {
        stmt.run(
          p.title, p.description, p.status, p.tags, p.overview, p.architecture,
          p.tech_stack, p.features, p.challenges, p.decisions, p.performance, p.learnings,
          p.still_working, p.future_work, p.status_detail
        );
      });
      stmt.finalize();
      console.log('Project cartridges seeded successfully.');
    }
  });
}

module.exports = db;
