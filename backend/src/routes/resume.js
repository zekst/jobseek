const express = require('express');
const multer = require('multer');
const { extractSkills } = require('../services/jobScorer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/resume
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT id, filename, raw_text, skills, created_at FROM resumes ORDER BY created_at DESC LIMIT 1');
    if (result.rows.length === 0) return res.status(404).json({ error: 'No resume found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resume — upload PDF or TXT
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    console.log('[Resume] file:', req.file ? req.file.originalname : 'none', '| body keys:', Object.keys(req.body));

    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: 'No file received. Send a file field named "resume" or a text field.' });
    }

    let rawText = '';
    let filename = 'pasted-text';

    if (req.file) {
      filename = req.file.originalname;
      const isPDF = req.file.mimetype === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');

      if (isPDF) {
        // Lazy require to avoid pdf-parse import-time side effects
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const parsed = await pdfParse(req.file.buffer);
        rawText = parsed.text;
      } else {
        rawText = req.file.buffer.toString('utf8');
      }
    } else {
      rawText = req.body.text;
    }

    if (!rawText || rawText.trim().length < 10) {
      return res.status(400).json({ error: 'Could not extract text from file. Try a plain .txt resume.' });
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

// POST /api/resume/tailor
router.post('/tailor', async (req, res) => {
  try {
    const { resumeText, jobDescription, jobTitle, company } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'resumeText and jobDescription are required' });
    }
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Tailor this resume for the job below. Rules: NEVER add skills or experience not present. NEVER change titles/dates. DO reorder bullets to highlight relevant experience. DO use exact keywords from the JD.\n\nJOB: ${jobTitle} at ${company}\n\nJD:\n${jobDescription.substring(0, 3000)}\n\nRESUME:\n${resumeText}\n\nReturn only the tailored resume text.`
      }]
    });
    res.json({ tailored: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
