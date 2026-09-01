const { json, getBody, cleanString, TRANSCRIBE_MODEL } = require('./_mellowbot');

const MAX_AUDIO_BYTES = 2_800_000;
const ALLOWED_MIME = new Set(['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a']);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { ok: false, error: 'Method not allowed' }); }
  if (!process.env.GROQ_API_KEY) return json(res, 503, { ok: false, error: 'Voice AI is not configured yet.' });
  const rawLength = Number(req.headers['content-length'] || 0);
  if (rawLength > 3_800_000) return json(res, 413, { ok: false, error: 'Voice recording is too large.' });
  let body; try { body = getBody(req); } catch { return json(res, 400, { ok: false, error: 'Invalid JSON.' }); }
  if (Buffer.byteLength(JSON.stringify(body || {}), 'utf8') > 3_800_000) return json(res, 413, { ok: false, error: 'Voice recording is too large.' });
  const base64 = String(body.audioBase64 || '');
  const mime = cleanString(body.mimeType || 'audio/webm', 50).split(';')[0].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) return json(res, 400, { ok: false, error: 'Unsupported voice format.' });
  let buffer;
  try { buffer = Buffer.from(base64, 'base64'); } catch { buffer = null; }
  if (!buffer || !buffer.length || buffer.length > MAX_AUDIO_BYTES) return json(res, 413, { ok: false, error: 'Voice recording is too large or invalid.' });

  try {
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mime }), `mellowbot.${mime.split('/')[1] || 'webm'}`);
    form.append('model', TRANSCRIBE_MODEL);
    form.append('response_format', 'json');
    form.append('temperature', '0');
    form.append('prompt', 'South African English, Mellow Tech, MellowBot, CV, website, PC repair, Windows, Microsoft Office, WhatsApp, Polokwane.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form, signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();
    if (!response.ok) { console.error('Groq transcription error:', response.status, data); return json(res, 502, { ok: false, error: 'Voice transcription is temporarily unavailable.' }); }
    const text = cleanString(data?.text, 4000);
    if (!text) return json(res, 422, { ok: false, error: 'No speech could be detected.' });
    return json(res, 200, { ok: true, text, model: TRANSCRIBE_MODEL });
  } catch (error) {
    console.error('Transcription request failed:', error);
    return json(res, 500, { ok: false, error: 'Unable to transcribe the recording.' });
  }
};
module.exports.config = { maxDuration: 30 };
