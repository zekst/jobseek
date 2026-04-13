const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cron = require('node-cron');
const { runAutoApply } = require('./services/autoApplyService');
const { runMigrations } = require('./db/migrations');

const app = express();
const PORT = process.env.PORT || 3001;

// Database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
app.locals.db = pool;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/autoapply', require('./routes/autoapply'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Auto-apply cron: 8am, 2pm, 8pm daily
cron.schedule('0 8,14,20 * * *', async () => {
  console.log('[CRON] Running auto-apply job...');
  try {
    await runAutoApply(pool);
  } catch (err) {
    console.error('[CRON] Auto-apply error:', err.message);
  }
});

// Start
async function start() {
  await runMigrations(pool);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(console.error);
