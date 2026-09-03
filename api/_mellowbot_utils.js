const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KNOWLEDGE_PATH = path.join(process.cwd(), 'mellowbot', 'knowledge.json');
const SITE_PATH = path.join(process.cwd(), 'mellowbot', 'site_pages.json');

const knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
const sitePages = JSON.parse(fs.readFileSync(SITE_PATH, 'utf8'));

const LEGAL_PAGES = new Set([
  '/mellowtech-disclaimer.html',
  '/mellowtech-privacy-policy.html',
  '/mellowtech-terms-of-service.html'
]);

function firstSentence(text, limit = 160) {
  const clean = String(text || '').trim();
  const match = clean.match(new RegExp(`^.{20,${limit}}?[.!]`, 's'));
  return (match ? match[0] : clean.slice(0, limit)).trim();
}

// Lightweight site index: only path and title (desc is dropped to save tokens)
const SITE_INDEX = sitePages.map((page) => ({
  path: page.path,
  title: page.title || ''
}));

function findPage(pathOrQuery) {
  const q = cleanString(pathOrQuery, 200).toLowerCase();
  if (!q) return null;
  const byPath = sitePages.find((p) => p.path.toLowerCase() === q || p.path.toLowerCase() === `/${q}`.replace('//', '/'));
  if (byPath) return byPath;
  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  let best = null;
  let bestScore = 0;
  for (const p of sitePages) {
    const hay = `${p.path} ${p.title} ${p.h1} ${(p.headings || []).join(' ')}`.toLowerCase();
    let score = 0;
    for (const w of words) if (hay.includes(w)) score += 1;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

const GROQ_URL = 'https://api.groq.com/openai/v1';
const MODEL = process.env.MELLOWBOT_GROQ_MODEL || 'openai/gpt-oss-20b';
const VISION_MODEL = process.env.MELLOWBOT_VISION_MODEL || 'qwen/qwen3.8-27b';
const TRANSCRIBE_MODEL = process.env.MELLOWBOT_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo';

const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;
const MAX_BODY_BYTES = 12000;
const MAX_HISTORY_MESSAGES = 6;  // reduced to save tokens
const MAX_PAGE_CONTEXT_CHARS = 500;
const MAX_SESSION_ID_CHARS = 80;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  return res.end(JSON.stringify(body));
}

function getBody(req) {
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8').trim() || '{}') || {};
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body.trim() || '{}') || {};
  return {};
}

function cleanString(value, max = 500) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return String(forwarded || req.headers['x-real-ip'] || '').split(',')[0].trim() || 'unknown';
}

function hashIp(value) {
  return crypto.createHash('sha256').update(`${process.env.IP_HASH_SALT || 'mellowtech'}:${value}`).digest('hex');
}

function cleanSessionId(value) {
  return cleanString(value, MAX_SESSION_ID_CHARS).replace(/[^A-Za-z0-9._:-]/g, '');
}

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: cleanString(m.content, MAX_MESSAGE_CHARS) }))
    .filter((m) => m.content);
}

function cleanPage(pageContext) {
  const page = pageContext && typeof pageContext === 'object' ? pageContext : {};
  return {
    path: cleanString(page.path, MAX_PAGE_CONTEXT_CHARS),
    title: cleanString(page.title, MAX_PAGE_CONTEXT_CHARS),
    h1: cleanString(page.h1, MAX_PAGE_CONTEXT_CHARS)
  };
}

// Compact full knowledge: include only essential fields, trim descriptions.
function knowledgeText() {
  const { company, rules, contact, services } = knowledge;
  const compactServices = Array.isArray(services)
    ? services.map(s => ({
        name: s.name || s.service || '',
        short_desc: (s.description || s.short_desc || '').slice(0, 120),
        price: s.price_from || s.price || ''
      }))
    : [];
  // Site pages: only path and title (desc dropped)
  const compactSitePages = SITE_INDEX.map(p => ({ path: p.path, title: p.title }));
  return JSON.stringify({
    company,
    rules,
    contact,
    services: compactServices,
    site_pages: compactSitePages
  });
}

// Very light version for tool routing: only company, rules, contact
function knowledgeTextLight() {
  const { company, rules, contact } = knowledge;
  return JSON.stringify({ company, rules, contact });
}

function serviceRecords() {
  const candidates = knowledge.services || knowledge.service_catalog || knowledge.pricing || [];
  if (Array.isArray(candidates)) return candidates;
  if (candidates && typeof candidates === 'object') return Object.entries(candidates).map(([key, value]) => ({ key, ...value }));
  return [];
}

function findService(query) {
  const q = cleanString(query, 300).toLowerCase();
  if (!q) return null;
  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  let best = null;
  let bestScore = 0;
  for (const record of serviceRecords()) {
    const hay = JSON.stringify(record).toLowerCase();
    let score = 0;
    for (const word of words) if (hay.includes(word)) score += 1;
    if (hay.includes(q)) score += 5;
    if (score > bestScore) {
      bestScore = score;
      best = record;
    }
  }
  return best;
}

const pageMap = {
  website: '/service-web.html', web: '/service-web.html', cv: '/service-cv.html', assignment: '/service-assignment.html',
  windows: '/service-windows.html', troubleshoot: '/service-troubleshoot.html', design: '/service-design.html',
  office: '/service-office.html', business: '/service-business.html', software: '/service-software.html'
};

async function supabaseRequest(table, options = {}) {
  const url = cleanString(process.env.SUPABASE_URL, 300).replace(/\/$/, '');
  const key = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return { ok: false, configured: false, skipped: true };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  let response;
  try {
    response = await fetch(`${url}/rest/v1/${table}`, {
      method: options.method || 'POST',
      headers: {
        apikey: key,
        ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }),
        'Content-Type': 'application/json',
        Prefer: options.prefer || 'return=minimal'
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    });
  } finally { clearTimeout(timeout); }
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text ? { raw: text.slice(0, 2000) } : null; }
  return { ok: response.ok, status: response.status, data };
}

async function upsertSession({ sessionId, page, req }) {
  if (!sessionId) return { ok: false, skipped: true };
  const now = new Date().toISOString();
  const base = { last_page: page.path || null, user_agent: cleanString(req.headers['user-agent'], 500) || null, updated_at: now };
  const existing = await supabaseRequest(`mellowbot_sessions?session_id=eq.${encodeURIComponent(sessionId)}&select=session_id&limit=1`, { method: 'GET' });
  if (existing.ok && Array.isArray(existing.data) && existing.data.length) {
    return supabaseRequest(`mellowbot_sessions?session_id=eq.${encodeURIComponent(sessionId)}`, { method: 'PATCH', body: base, prefer: 'return=minimal' });
  }
  return supabaseRequest('mellowbot_sessions', {
    body: { session_id: sessionId, first_page: page.path || null, ...base },
    prefer: 'return=minimal'
  });
}

async function insertMessage({ sessionId, role, content, page, intent, service, requestId }) {
  if (!sessionId || !content) return { ok: false, skipped: true };
  return supabaseRequest('mellowbot_messages', {
    body: {
      session_id: sessionId,
      role,
      content: cleanString(content, 4000),
      page_path: page.path || null,
      intent: intent || null,
      service: service || null,
      request_id: requestId || null
    }
  });
}

async function createLead({ args, sessionId, source, requestId, consentRequired = true }) {
  const name = cleanString(args?.customer_name, 120);
  const email = cleanString(args?.email, 180).toLowerCase();
  const phone = cleanString(args?.phone, 60);
  const need = cleanString(args?.need, 1000);
  const details = cleanString(args?.details || args?.extra, 2500);
  const service = cleanString(args?.service, 180);
  const consent = args?.consent === true;

  if (!name || !need) return { ok: false, message: 'A customer name and clear need are required before saving a lead.' };
  if (!email && !phone) return { ok: false, message: 'At least one contact method (phone/WhatsApp or email) is required before saving a lead.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'The email address is invalid.' };
  if (consentRequired && !consent) return { ok: false, message: 'The customer has not explicitly consented to have their enquiry saved for follow-up.' };

  const result = await supabaseRequest('mellowbot_leads', {
    body: {
      session_id: sessionId || null,
      source: source || 'mellowbot',
      customer_name: name,
      email: email || null,
      phone: phone || null,
      service: service || null,
      need,
      details: details || null,
      consent_at: consent ? new Date().toISOString() : null,
      status: 'new',
      metadata: { request_id: requestId || null }
    },
    prefer: 'return=representation'
  });

  if (!result.configured) return { ok: false, message: 'Lead storage is not configured yet. Offer WhatsApp/contact options instead; do not claim that the enquiry was saved.' };
  if (!result.ok) {
    console.error('Supabase lead insert failed:', result.status, result.data);
    return { ok: false, message: 'Lead storage is temporarily unavailable. Offer WhatsApp/contact options instead.' };
  }
  return { ok: true, saved: true, message: 'The enquiry was saved successfully for MellowTech follow-up.' };
}

module.exports = {
  knowledge,
  sitePages,
  GROQ_URL,
  MODEL,
  VISION_MODEL,
  TRANSCRIBE_MODEL,
  MAX_MESSAGES,
  MAX_MESSAGE_CHARS,
  MAX_BODY_BYTES,
  json,
  getBody,
  cleanString,
  cleanSessionId,
  cleanMessages,
  cleanPage,
  knowledgeText,
  knowledgeTextLight,
  serviceRecords,
  findService,
  findPage,
  pageMap,
  supabaseRequest,
  upsertSession,
  insertMessage,
  createLead,
  hashIp,
  clientIp
};
