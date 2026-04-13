const express = require('express');
const axios = require('axios');
const { extractSkills, scoreJob } = require('../services/jobScorer');

const router = express.Router();

// GET /api/jobs/search?query=...&location=...
router.get('/search', async (req, res) => {
  const { query = 'software engineer', location = 'remote' } = req.query;

  try {
    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: { query: `${query} ${location}`, page: '1', num_pages: '2', date_posted: 'today' },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    };
    const response = await axios.request(options);
    const jobs = response.data.data || [];

    // Score each job if a resume exists
    const db = req.app.locals.db;
    const resumeResult = await db.query('SELECT skills FROM resumes ORDER BY created_at DESC LIMIT 1');
    const userSkills = resumeResult.rows[0]?.skills || [];

    const scored = jobs.map(job => {
      const jobSkills = extractSkills(`${job.job_title} ${job.job_description || ''}`);
      return { ...job, match_score: scoreJob(jobSkills, userSkills), job_skills: jobSkills };
    });

    res.json(scored);
  } catch (err) {
    console.error('[Jobs] Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
