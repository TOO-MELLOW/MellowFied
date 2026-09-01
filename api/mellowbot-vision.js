const { json, getBody, cleanString, VISION_MODEL } = require('./_mellowbot');

const MAX_BODY = 4_000_000;
const ALLOWED_PREFIXES = ['data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { ok: false, error: 'Method not allowed' }); }
  if (!process.env.GROQ_API_KEY) return json(res, 503, { ok: false, error: 'Vision AI is not configured yet.' });
  const rawLength = Number(req.headers['content-length'] || 0);
  if (rawLength > MAX_BODY) return json(res, 413, { ok: false, error: 'Image request is too large.' });
  let body; try { body = getBody(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON.' }); }
  if (Buffer.byteLength(JSON.stringify(body || {}), 'utf8') > MAX_BODY) return json(res, 413, { ok: false, error: 'Image request is too large.' });
  const image = String(body.image || '');
  if (!ALLOWED_PREFIXES.some((prefix) => image.startsWith(prefix))) return json(res, 400, { ok: false, error: 'Use a PNG, JPEG or WebP image.' });
  if (image.length > MAX_BODY) return json(res, 413, { ok: false, error: 'Image is too large.' });
  const question = cleanString(body.question || 'Analyze this image for me. If it is a technical screenshot or error message, explain what it likely means and what safe next step I should take.', 1600);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          { role: 'system', content: 'You are MellowBot, helping MellowTech customers interpret screenshots/photos. Describe only what is visible. For errors, explain likely causes without claiming certainty. Avoid dangerous instructions. Encourage professional support when the next action could risk data loss, malware, hardware damage or account security.' },
          { role: 'user', content: [ { type: 'text', text: question }, { type: 'image_url', image_url: { url: image } } ] }
        ],
        temperature: 0.2,
        max_completion_tokens: 1200,
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await response.json();
    if (!response.ok) { console.error('Groq vision error:', response.status, data); return json(res, 502, { ok: false, error: 'Image analysis is temporarily unavailable.' }); }
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return json(res, 502, { ok: false, error: 'The vision model returned no answer.' });
    return json(res, 200, { ok: true, content, model: data.model || VISION_MODEL, usage: data.usage || null });
  } catch (error) {
    console.error('Vision request failed:', error);
    return json(res, 500, { ok: false, error: 'Unable to analyze the image.' });
  }
};
module.exports.config = { maxDuration: 30 };
