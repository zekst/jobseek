'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export default function AutoApply({ skills, resumeText }) {
  const [config, setConfig] = useState({ enabled: false, mode: 'review', min_match_score: 60, daily_limit: 20, job_titles: [], locations: [] });
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({ running: false });
  const [tab, setTab] = useState('settings');
  const pollRef = useRef();

  useEffect(() => {
    api.autoapply.getConfig().then(setConfig).catch(() => {});
    api.autoapply.getLogs().then(setLogs).catch(() => {});
    api.autoapply.getStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (status.running) {
      pollRef.current = setInterval(() => {
        api.autoapply.getLogs().then(setLogs).catch(() => {});
      }, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [status.running]);

  async function toggleAutoApply() {
    if (status.running) {
      await api.autoapply.pause();
      setStatus({ running: false });
    } else {
      await api.autoapply.updateConfig({ ...config, enabled: true });
      await api.autoapply.start();
      setStatus({ running: true });
    }
  }

  async function saveConfig() {
    await api.autoapply.updateConfig(config);
    alert('Settings saved!');
  }

  const TABS = [{ id: 'settings', label: 'Settings' }, { id: 'logs', label: 'Activity Log' }];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Auto Apply</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Let AI apply to jobs on your behalf with tailored resumes</p>

      {/* Mode toggle + Start */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Mode</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['auto', 'review'].map(m => (
              <button key={m} onClick={() => setConfig(c => ({ ...c, mode: m }))}
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13,
                  background: config.mode === m ? '#6366f1' : '#334155', color: config.mode === m ? '#fff' : '#94a3b8' }}>
                {m === 'auto' ? '🤖 Auto 24/7' : '👁 Review Mode'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            {config.mode === 'auto' ? 'Applies automatically — no intervention needed' : 'Applications queued for your review before submitting'}
          </div>
        </div>
        <button onClick={toggleAutoApply}
          style={{ padding: '12px 28px', background: status.running ? '#dc2626' : '#22c55e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
          {status.running ? '⏸ Pause' : '▶ Start'}
        </button>
      </div>

      {/* Pipeline steps */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Pipeline</div>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap' }}>
          {['Resume Parsed', 'Skills Extracted', 'Jobs Searched', 'AI Matched', 'Resume Tailored', 'Applied'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '6px 12px', background: status.running ? '#312e81' : '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12, color: status.running ? '#a5b4fc' : '#64748b' }}>
                {step}
              </div>
              {i < 5 && <span style={{ color: '#334155', margin: '0 4px' }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: tab === t.id ? '#6366f1' : '#1e293b', color: tab === t.id ? '#fff' : '#94a3b8' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Minimum Match Score (%)</label>
              <input type="number" value={config.min_match_score} onChange={e => setConfig(c => ({ ...c, min_match_score: +e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Daily Application Limit</label>
              <input type="number" value={config.daily_limit} onChange={e => setConfig(c => ({ ...c, daily_limit: +e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Job Titles (comma-separated)</label>
              <input value={(config.job_titles || []).join(', ')} onChange={e => setConfig(c => ({ ...c, job_titles: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                placeholder="Software Engineer, Backend Developer"
                style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Preferred Locations (comma-separated)</label>
              <input value={(config.locations || []).join(', ')} onChange={e => setConfig(c => ({ ...c, locations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                placeholder="Remote, Bangalore, Mumbai"
                style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9' }} />
            </div>
          </div>
          <button onClick={saveConfig}
            style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Save Settings
          </button>
        </div>
      )}

      {tab === 'logs' && (
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
          {logs.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No activity yet. Start Auto Apply to see logs here.</div>
            : logs.map((log, i) => (
              <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{log.job_title}</span>
                  <span style={{ color: '#64748b', marginLeft: 8 }}>at {log.company}</span>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{log.message}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: log.status === 'applied' ? '#14532d' : log.status === 'skipped' ? '#1e293b' : '#713f12', color: log.status === 'applied' ? '#22c55e' : log.status === 'skipped' ? '#64748b' : '#f59e0b' }}>
                    {log.status}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
