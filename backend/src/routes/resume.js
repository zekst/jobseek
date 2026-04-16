const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { extractSkills } = require('../services/jobScorer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/resume — get the latest uploaded resume
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT id, filename, skills, created_at FROM resumes ORDER BY created_at DESC LIMIT 1');
    if (result.rows.length === 0) return res.status(404).json({ error: 'No resume found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resume/:id/text — get full raw text of a resume
router.get('/:id/text', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT raw_text FROM resumes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resume not found' });
    res.json({ raw_text: result.rows[0].raw_text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resume — upload a PDF or plain-text resume
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: 'Provide a file or text field' });
    }

    let rawText = '';
    let filename = 'pasted-text';

    if (req.file) {
      filename = req.file.originalname;
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer);
        rawText = parsed.text;
      } else {
        rawText = req.file.buffer.toString('utf8');
      }
    } else {
      rawText = req.body.text;
    }

    const skills = extractSkills(rawText);
    const db = req.app.locals.db;
    const result = await db.query(
      'INSERT INTO resumes (filename, raw_text, skills) VALUES ($1, $2, $3) RETURNING id, filename, raw_text, skills, created_at',
      [filename, rawText, JSON.stringify(skills)]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[Resume] Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
