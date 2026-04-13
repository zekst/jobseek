const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const { extractSkills, scoreJob } = require('./jobScorer');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchJobs(query, location = 'remote') {
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
  return response.data.data || [];
}

async function tailorResume(resumeText, jobDescription, jobTitle, company) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are an expert resume writer. Tailor the following resume for this specific job WITHOUT inventing any experience, skills, or achievements that aren't already present.

Rules:
- NEVER add skills, tools, or experience not in the original
- NEVER change job titles, companies, or dates
- DO reorder bullet points to highlight relevant experience first
- DO use exact keywords and terminology from the job description
- DO emphasize matching skills and achievements
- Keep the same format and structure

JOB TITLE: ${jobTitle}
COMPANY: ${company}

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}

ORIGINAL RESUME:
${resumeText}

Return only the tailored resume text, no explanations.`
    }]
  });
  return message.content[0].text;
}

async function runAutoApply(pool) {
  // Get config
  const configResult = await pool.query('SELECT * FROM autoapply_config WHERE id = 1');
  const config = configResult.rows[0];

  if (!config.enabled) {
    console.log('[AutoApply] Disabled, skipping.');
    return;
  }

  // Get latest resume
  const resumeResult = await pool.query('SELECT * FROM resumes ORDER BY created_at DESC LIMIT 1');
  if (resumeResult.rows.length === 0) {
    console.log('[AutoApply] No resume found, skipping.');
    return;
  }
  const resume = resumeResult.rows[0];
  const userSkills = resume.skills || [];

  // Get today's application count
  const countResult = await pool.query(
    "SELECT COUNT(*) FROM applications WHERE applied_at >= CURRENT_DATE"
  );
  const todayCount = parseInt(countResult.rows[0].count);
  if (todayCount >= config.daily_limit) {
    console.log(`[AutoApply] Daily limit (${config.daily_limit}) reached.`);
    return;
  }

  const jobTitles = config.job_titles.length > 0 ? config.job_titles : ['software engineer'];
  const locations = config.locations.length > 0 ? config.locations : ['remote'];
  const excludeCompanies = new Set((config.exclude_companies || []).map(c => c.toLowerCase()));

  let applied = 0;

  for (const title of jobTitles) {
    for (const location of locations) {
      if (todayCount + applied >= config.daily_limit) break;

      const jobs = await searchJobs(title, location);

      for (const job of jobs) {
        if (todayCount + applied >= config.daily_limit) break;

        const company = job.employer_name || '';
        if (excludeCompanies.has(company.toLowerCase())) continue;

        // Score job
        const jobText = `${job.job_title} ${job.job_description || ''}`;
        const jobSkills = extractSkills(jobText);
        const score = scoreJob(jobSkills, userSkills);

        if (score < config.min_match_score) {
          await pool.query(
            'INSERT INTO autoapply_logs (job_id, job_title, company, action, status, match_score, message) VALUES ($1,$2,$3,$4,$5,$6,$7)',
            [job.job_id, job.job_title, company, 'skip', 'skipped', score, `Score ${score}% below threshold ${config.min_match_score}%`]
          );
          continue;
        }

        // Tailor resume
        let tailoredResume = resume.raw_text;
        try {
          tailoredResume = await tailorResume(resume.raw_text, job.job_description || job.job_title, job.job_title, company);
        } catch (err) {
          console.error('[AutoApply] Tailor error:', err.message);
        }

        // Log application
        const mode = config.mode;
        const status = mode === 'auto' ? 'applied' : 'pending_review';

        await pool.query(
          'INSERT INTO applications (job_id, job_title, company, location, job_url, status, match_score, tailored_resume) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [job.job_id, job.job_title, company, job.job_city || location, job.job_apply_link || '', status, score, tailoredResume]
        );

        await pool.query(
          'INSERT INTO autoapply_logs (job_id, job_title, company, action, status, match_score, message) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [job.job_id, job.job_title, company, 'apply', status, score, `Match: ${score}% | Mode: ${mode}`]
        );

        applied++;
        console.log(`[AutoApply] ${status}: ${job.job_title} at ${company} (${score}% match)`);
      }
    }
  }

  console.log(`[AutoApply] Session complete. Applied to ${applied} jobs.`);
}

module.exports = { runAutoApply };
