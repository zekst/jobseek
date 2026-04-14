'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const STATUS_COLORS = {
  applied: '#6366f1', pending_review: '#f59e0b', interview: '#22c55e',
  rejected: '#ef4444', offer: '#a855f7', withdrawn: '#64748b'
};

export default function Tracker() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.applications.list(), api.applications.stats()])
      .then(([apps, s]) => { setApplications(apps); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id, status) {
    await api.applications.update(id, { status });
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  if (loading) return <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Loading applications...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Application Tracker</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Track all your job applications in one place</p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {Object.entries(stats).map(([status, count]) => (
          <div key={status} style={{ background: '#1e293b', borderRadius: 10, padding: '14px 20px', border: '1px solid #334155', minWidth: 100 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: STATUS_COLORS[status] || '#6366f1' }}>{count}</div>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Job Title', 'Company', 'Location', 'Match', 'Status', 'Applied'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{app.job_title}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{app.company}</td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>{app.location}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ color: app.match_score >= 80 ? '#22c55e' : app.match_score >= 60 ? '#f59e0b' : '#64748b', fontWeight: 600 }}>
                    {app.match_score}%
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)}
                    style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', color: STATUS_COLORS[app.status] || '#f1f5f9', fontSize: 13, cursor: 'pointer' }}>
                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                  {new Date(app.applied_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No applications yet. Enable Auto Apply to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
