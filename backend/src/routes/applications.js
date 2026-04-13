const express = require('express');

const router = express.Router();

// GET /api/applications — list all applications
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status } = req.query;
    let query = 'SELECT * FROM applications ORDER BY applied_at DESC';
    const params = [];
    if (status) {
      query = 'SELECT * FROM applications WHERE status = $1 ORDER BY applied_at DESC';
      params.push(status);
    }
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/applications/:id
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/applications/:id — update status or notes
router.patch('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, notes } = req.body;
    const result = await db.query(
      'UPDATE applications SET status = COALESCE($1, status), notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.query('DELETE FROM applications WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
