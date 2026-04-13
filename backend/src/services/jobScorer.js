const SKILL_LIST = [
  'javascript','typescript','python','java','go','rust','ruby','php','swift','kotlin','scala','c++','c#',
  'react','vue','angular','svelte','nextjs','nuxtjs','remix','gatsby',
  'node','express','fastapi','django','flask','rails','spring','laravel',
  'postgresql','mysql','mongodb','redis','elasticsearch','dynamodb','sqlite','cassandra',
  'aws','gcp','azure','docker','kubernetes','terraform','ansible','jenkins','github actions','circleci',
  'graphql','rest','grpc','websocket','kafka','rabbitmq','celery',
  'machine learning','deep learning','tensorflow','pytorch','scikit-learn','nlp','llm','openai','langchain',
  'git','linux','bash','nginx','apache','cdn','microservices','serverless',
  'html','css','tailwind','sass','webpack','vite','figma','storybook',
  'jest','pytest','cypress','selenium','playwright',
  'agile','scrum','jira','notion','sql','nosql','api','sdk','cli','oop','tdd','ci/cd'
];

function extractSkills(text) {
  const lower = text.toLowerCase();
  return SKILL_LIST.filter(skill => {
    const escaped = skill.replace(/[+#]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`).test(lower);
  });
}

function scoreJob(jobKeywords, userSkills) {
  if (!jobKeywords || jobKeywords.length === 0) return 0;
  const userSet = new Set(userSkills.map(s => s.toLowerCase()));
  const matched = jobKeywords.filter(k => userSet.has(k.toLowerCase())).length;
  return Math.round((matched / jobKeywords.length) * 100);
}

module.exports = { SKILL_LIST, extractSkills, scoreJob };
