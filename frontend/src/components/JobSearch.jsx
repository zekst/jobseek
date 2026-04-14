'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const PORTALS = [
  { name: 'LinkedIn', color: '#0077b5', url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
  { name: 'Naukri', color: '#ff7555', url: (q, l) => `https://www.naukri.com/${q.toLowerCase().replace(/ /g,'-')}-jobs-in-${l.toLowerCase().replace(/ /g,'-')}` },
  { name: 'Instahyre', color: '#00bcd4', url: (q) => `https://www.instahyre.com/search-jobs/?q=${encodeURIComponent(q)}` },
  { name: 'Hirist', color: '#4caf50', url: (q) => `https://www.hirist.tech/search?q=${encodeURIComponent(q)}` },
  { name: 'Wellfound', color: '#f97316', url: (q) => `https://wellfound.com/jobs?q=${encodeURIComponent(q)}` },
  { name: 'Indeed', color: '#003a9b', url: (q, l) => `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
];

export default function JobSearch({ skills }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Remote');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.jobs.search(query, location);
      setJobs(data);
    } catch (e) {
      setError('Search failed. Check your API connection.');
    }
    setLoading(false);
  }

  function matchScore(jobText) {
    if (!skills.length) return null;
    const lower = jobText.toLowerCase();
    const matched = skills.filter(s => lower.includes(s.toLowerCase())).length;
    return Math.round((matched / skills.length) * 100);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Job Search</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Search across multiple portals or use AI-powered Indeed search</p>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Job title, skills, keywords..."
          style={{ flex: 1, padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14 }} />
        <input value={location} onChange={e => setLocation(e.target.value)}
          placeholder="Location"
          style={{ width: 160, padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14 }} />
        <button onClick={search} disabled={loading}
          style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {/* Portal buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {PORTALS.map(p => (
          <button key={p.name}
            onClick={() => window.open(p.url(query || 'software engineer', location), '_blank', 'noopener,noreferrer')}
            style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${p.color}`, color: p.color, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            {p.name} ↗
          </button>
        ))}
      </div>

      {error && <div style={{ color: '#f87171', marginBottom: 16 }}>{error}</div>}

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {jobs.map((job, i) => {
          const score = matchScore(`${job.job_title} ${job.job_description || ''}`);
          return (
            <div key={i} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{job.job_title}</div>
                <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>{job.employer_name} · {job.job_city || 'Remote'}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  {(job.job_description || '').substring(0, 180)}...
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {score !== null && (
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `3px solid ${score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#475569'}`,
                    fontSize: 14, fontWeight: 700,
                    color: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#64748b'
                  }}>{score}%</div>
                )}
                <button onClick={() => window.open(job.job_apply_link || job.job_google_link, '_blank', 'noopener,noreferrer')}
                  style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  Apply ↗
                </button>
              </div>
            </div>
          );
        })}
        {!loading && jobs.length === 0 && query && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>No results. Try a different query.</div>
        )}
      </div>
    </div>
  );
}
