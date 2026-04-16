const express = require('express');
const { runAutoApply } = require('../services/autoApplyService');

const router = express.Router();

// In-memory running state
let isRunning = false;

// GET /api/autoapply/config
router.get('/config', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM autoapply_config WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/autoapply/config
router.put('/config', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { enabled, mode, min_match_score, daily_limit, job_titles, locations, exclude_companies } = req.body;
    const result = await db.query(
      `UPDATE autoapply_config SET
        enabled = COALESCE($1, enabled),
        mode = COALESCE($2, mode),
        min_match_score = COALESCE($3, min_match_score),
        daily_limit = COALESCE($4, daily_limit),
        job_titles = COALESCE($5, job_titles),
        locations = COALESCE($6, locations),
        exclude_companies = COALESCE($7, exclude_companies),
        updated_at = NOW()
      WHERE id = 1 RETURNING *`,
      [enabled, mode, min_match_score, daily_limit,
       job_titles ? JSON.stringify(job_titles) : null,
       locations ? JSON.stringify(locations) : null,
       exclude_companies ? JSON.stringify(exclude_companies) : null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/autoapply/start
router.post('/start', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.query('UPDATE autoapply_config SET enabled = true WHERE id = 1');
    isRunning = true;
    res.json({ running: true, message: 'Auto-apply started. Cron runs at 8am, 2pm, 8pm.' });
    runAutoApply(db).catch(err => console.error('[AutoApply] Start error:', err.message));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/autoapply/pause
router.post('/pause', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.query('UPDATE autoapply_config SET enabled = false WHERE id = 1');
    isRunning = false;
    res.json({ running: false, message: 'Auto-apply paused.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/autoapply/status
router.get('/status', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const config = await db.query('SELECT enabled FROM autoapply_config WHERE id = 1');
    res.json({ running: config.rows[0]?.enabled || false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/autoapply/logs
router.get('/logs', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM autoapply_logs ORDER BY created_at DESC LIMIT 200');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
