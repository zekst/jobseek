const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  jobs: {
    search: (query, location) => request(`/api/jobs/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location || 'remote')}`),
    score: (jobKeywords, userSkills) => request('/api/jobs/score', { method: 'POST', body: JSON.stringify({ jobKeywords, userSkills }) }),
  },
  resume: {
    // Send extracted text as JSON — avoids multer/multipart issues
    uploadText: (text, filename) => request('/api/resume', {
      method: 'POST',
      body: JSON.stringify({ text, filename }),
    }),
    getLatest: () => request('/api/resume'),
    tailor: (resumeText, jobDescription, jobTitle, company) =>
      request('/api/resume/tailor', { method: 'POST', body: JSON.stringify({ resumeText, jobDescription, jobTitle, company }) }),
  },
  applications: {
    list: () => request('/api/applications'),
    create: (data) => request('/api/applications', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/applications/${id}`, { method: 'DELETE' }),
    stats: () => request('/api/applications/stats'),
  },
  emails: {
    generate: (data) => request('/api/emails/generate', { method: 'POST', body: JSON.stringify(data) }),
  },
  autoapply: {
    getConfig: () => request('/api/autoapply/config'),
    updateConfig: (data) => request('/api/autoapply/config', { method: 'PUT', body: JSON.stringify(data) }),
    start: () => request('/api/autoapply/start', { method: 'POST' }),
    pause: () => request('/api/autoapply/pause', { method: 'POST' }),
    getLogs: () => request('/api/autoapply/logs'),
    getStatus: () => request('/api/autoapply/status'),
  },
};
