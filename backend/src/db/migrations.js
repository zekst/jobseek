async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS resumes (
      id SERIAL PRIMARY KEY,
      filename TEXT,
      raw_text TEXT NOT NULL,
      skills JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id TEXT,
      job_title TEXT,
      company TEXT,
      location TEXT,
      job_url TEXT,
      status TEXT DEFAULT 'applied',
      match_score INTEGER DEFAULT 0,
      tailored_resume TEXT,
      notes TEXT,
      applied_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS autoapply_config (
      id SERIAL PRIMARY KEY,
      enabled BOOLEAN DEFAULT false,
      mode TEXT DEFAULT 'review',
      min_match_score INTEGER DEFAULT 60,
      daily_limit INTEGER DEFAULT 20,
      job_titles JSONB DEFAULT '[]',
      locations JSONB DEFAULT '[]',
      exclude_companies JSONB DEFAULT '[]',
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS autoapply_logs (
      id SERIAL PRIMARY KEY,
      job_id TEXT,
      job_title TEXT,
      company TEXT,
      action TEXT,
      status TEXT,
      match_score INTEGER,
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Insert default config if not exists
  await pool.query(`
    INSERT INTO autoapply_config (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('[DB] Migrations complete');
}

module.exports = { runMigrations };
