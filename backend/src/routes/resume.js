const express = require('express');
const { extractSkills } = require('../services/jobScorer');

const router = express.Router();

// GET /api/resume — get latest resume
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT id, filename, raw_text, skills, created_at FROM resumes ORDER BY created_at DESC LIMIT 1'
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No resume found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resume — receive extracted text as JSON (parsing done on frontend)
router.post('/', async (req, res) => {
  try {
    const { text, filename = 'resume.txt' } = req.body;

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'No resume text received.' });
    }

    const skills = extractSkills(text);
    const db = req.app.locals.db;
    const result = await db.query(
      'INSERT INTO resumes (filename, raw_text, skills) VALUES ($1, $2, $3) RETURNING id, filename, raw_text, skills, created_at',
      [filename, text, JSON.stringify(skills)]
    );

    console.log(`[Resume] Saved: ${filename} | skills: ${skills.length}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[Resume] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resume/tailor — tailor resume via Claude
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
        content: `Tailor this resume for the job below. Rules: NEVER add skills or experience not present. NEVER change titles/dates. DO reorder bullets to highlight relevant experience. DO use exact JD keywords.\n\nJOB: ${jobTitle} at ${company}\n\nJD:\n${jobDescription.substring(0, 3000)}\n\nRESUME:\n${resumeText}\n\nReturn only the tailored resume text.`
      }]
    });
    res.json({ tailored: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
