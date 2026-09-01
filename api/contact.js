const { json, getBody, cleanString, supabaseRequest, hashIp, clientIp } = require('./_mellowbot');

const LIMIT = 5;
const WINDOW = 15 * 60 * 1000;
const buckets = globalThis.__mellowContactRateBuckets || new Map();
globalThis.__mellowContactRateBuckets = buckets;

function limited(req) {
  const now = Date.now();
  const key = clientIp(req);
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.start >= WINDOW) bucket = { start: now, count: 0 };
  bucket.count += 1; buckets.set(key, bucket);
  return bucket.count > LIMIT;
}

async function notifyByEmailJS(data) {
  const publicKey = String(process.env.EMAILJS_PUBLIC_KEY || 'xS49JkhsNjH8-uBMZ').trim();
  const serviceId = String(process.env.EMAILJS_SERVICE_ID || 'service_ee5shgv').trim();
  const templates = [String(process.env.EMAILJS_TEMPLATE_ID_1 || 'template_16z5mzs').trim(), String(process.env.EMAILJS_TEMPLATE_ID_2 || 'template_49mvvnh').trim()].filter(Boolean);
  if (!publicKey || !serviceId || !templates.length) return { configured: false, ok: true };
  const responses = await Promise.all(templates.map(async (templateId) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      return await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, template_id: templateId, user_id: publicKey, template_params: data }),
        signal: controller.signal
      });
    } finally { clearTimeout(timeout); }
  }));
  return { configured: true, ok: responses.every((r) => r.ok) };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { ok: false, error: 'Method not allowed' }); }
  if (limited(req)) return json(res, 429, { ok: false, error: 'Too many submissions. Please try again later.' });
  let body; try { body = getBody(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON.' }); }
  if (Buffer.byteLength(JSON.stringify(body || {}), 'utf8') > 12000) return json(res, 413, { ok: false, error: 'Request too large.' });
  if (cleanString(body.website, 200)) return json(res, 400, { ok: false, error: 'Spam detected.' });
  const name = cleanString(body.name, 120);
  const phone = cleanString(body.phone, 60);
  const email = cleanString(body.email, 180).toLowerCase();
  const service = cleanString(body.service, 180);
  const message = cleanString(body.message, 3000);
  if (!name || !phone || !service || !message || !email) return json(res, 400, { ok: false, error: 'Please complete all required fields.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { ok: false, error: 'Please enter a valid email address.' });

  try {
    const result = await supabaseRequest('contact_submissions', {
      body: { name, phone, email, service, message, ip_hash: hashIp(clientIp(req)), status: 'new', source: 'contact_form' },
      prefer: 'return=minimal'
    });
    if (!result.configured) return json(res, 503, { ok: false, error: 'Contact storage is not configured yet.' });
    if (!result.ok) { console.error('Contact insert failed:', result.status, result.data); return json(res, 502, { ok: false, error: 'We could not save your message. Please use WhatsApp instead.' }); }
    let notification = { configured: false, ok: true };
    try { notification = await notifyByEmailJS({ name, phone, email, service, message }); } catch (err) { console.error('EmailJS notification failed:', err); notification = { configured: true, ok: false }; }
    return json(res, 200, { ok: true, message: 'Your message was saved. MellowTech can follow up with you.', notificationSaved: notification.ok });
  } catch (error) {
    console.error('Contact handler failed:', error);
    return json(res, 500, { ok: false, error: 'Unable to submit your message.' });
  }
};
module.exports.config = { maxDuration: 15 };
