const KEY = process.env.WASSIST_API_KEY;
const BASE = process.env.WASSIST_API_URL || 'https://backend.wassist.app/api/v1';
const h = { 'X-API-Key': KEY, 'content-type': 'application/json' };
const list = await (await fetch(`${BASE}/conversations/`, { headers: h })).json();
console.log('CONVERSATIONS:', JSON.stringify(list).slice(0, 1200));
const agents = await (await fetch(`${BASE}/agents/`, { headers: h })).json();
console.log('AGENTS:', JSON.stringify(agents).slice(0, 1200));
