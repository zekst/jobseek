'use client';

import { useState, useEffect } from 'react';
import JobSearch from './JobSearch';
import ResumePanel from './ResumePanel';
import Tracker from './Tracker';
import AutoApply from './AutoApply';

const NAV = [
  { id: 'jobs', label: 'Job Search', icon: '🔍' },
  { id: 'resume', label: 'Resume', icon: '📄' },
  { id: 'tracker', label: 'Tracker', icon: '📊' },
  { id: 'autoapply', label: 'Auto Apply', icon: '🤖' },
];

export default function Dashboard() {
  const [tab, setTab] = useState('jobs');
  const [skills, setSkills] = useState([]);
  const [resumeText, setResumeText] = useState('');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#1e293b', padding: '24px 0', display: 'flex',
        flexDirection: 'column', borderRight: '1px solid #334155', flexShrink: 0
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>🎯 JobSeek</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>AI Job Agent</div>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              marginBottom: 4, fontSize: 14, fontWeight: tab === n.id ? 600 : 400,
              background: tab === n.id ? '#312e81' : 'transparent',
              color: tab === n.id ? '#a5b4fc' : '#94a3b8',
              transition: 'all 0.15s'
            }}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        {skills.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #334155' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>DETECTED SKILLS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {skills.slice(0, 6).map(s => (
                <span key={s} style={{
                  fontSize: 10, padding: '2px 6px', background: '#1e3a5f',
                  color: '#60a5fa', borderRadius: 4
                }}>{s}</span>
              ))}
              {skills.length > 6 && (
                <span style={{ fontSize: 10, color: '#64748b' }}>+{skills.length - 6} more</span>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
        {tab === 'jobs' && <JobSearch skills={skills} />}
        {tab === 'resume' && <ResumePanel onSkillsLoaded={setSkills} onResumeLoaded={setResumeText} />}
        {tab === 'tracker' && <Tracker />}
        {tab === 'autoapply' && <AutoApply skills={skills} resumeText={resumeText} />}
      </main>
    </div>
  );
}
