const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/emails/generate — generate a cold-outreach or follow-up email
router.post('/generate', async (req, res) => {
  try {
    const { type = 'follow_up', job_title, company, contact_name, application_id } = req.body;
    if (!job_title || !company) {
      return res.status(400).json({ error: 'job_title and company are required' });
    }

    let resumeSnippet = '';
    if (application_id) {
      const db = req.app.locals.db;
      const appResult = await db.query('SELECT tailored_resume FROM applications WHERE id = $1', [application_id]);
      if (appResult.rows[0]?.tailored_resume) {
        resumeSnippet = appResult.rows[0].tailored_resume.substring(0, 1000);
      }
    }

    const prompts = {
      follow_up: `Write a concise, professional follow-up email for a job application.
Job: ${job_title} at ${company}
${contact_name ? `Contact: ${contact_name}` : ''}
${resumeSnippet ? `Resume summary: ${resumeSnippet}` : ''}
Keep it under 150 words. Return only the email body.`,
      cold_outreach: `Write a compelling cold-outreach email to a recruiter or hiring manager.
Role I'm targeting: ${job_title} at ${company}
${contact_name ? `Recipient: ${contact_name}` : ''}
${resumeSnippet ? `My background (brief): ${resumeSnippet}` : ''}
Keep it under 150 words. Return only the email body.`
    };

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompts[type] || prompts.follow_up }]
    });

    res.json({ email: message.content[0].text });
  } catch (err) {
    console.error('[Emails] Generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
