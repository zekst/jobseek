'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

export default function ResumePanel({ onSkillsLoaded, onResumeLoaded }) {
  const [dragging, setDragging] = useState(false);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const data = await api.resume.upload(formData);
      setResume(data);
      onSkillsLoaded(data.skills || []);
      onResumeLoaded(data.raw_text || '');
    } catch (e) {
      setError('Upload failed. Make sure the backend is running.');
    }
    setLoading(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Resume</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Upload your resume to enable AI matching and auto-apply</p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? '#6366f1' : '#334155'}`,
          borderRadius: 12, padding: 48, textAlign: 'center', cursor: 'pointer',
          background: dragging ? '#1e1b4b' : '#1e293b', marginBottom: 24,
          transition: 'all 0.2s'
        }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop your resume here</div>
        <div style={{ color: '#64748b', fontSize: 14 }}>PDF or TXT · Click to browse</div>
        <input ref={inputRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#6366f1', marginBottom: 16 }}>Parsing resume...</div>}
      {error && <div style={{ color: '#f87171', marginBottom: 16 }}>{error}</div>}

      {resume && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
          <div style={{ fontWeight: 600, marginBottom: 16, color: '#a5b4fc' }}>✅ Resume Loaded</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>DETECTED SKILLS ({resume.skills?.length || 0})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(resume.skills || []).map(s => (
                <span key={s} style={{ padding: '4px 10px', background: '#1e3a5f', color: '#60a5fa', borderRadius: 6, fontSize: 13 }}>{s}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>PREVIEW</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
              {(resume.raw_text || '').substring(0, 600)}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
