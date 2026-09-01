# MellowBot Phase 4 — Advanced AI + Supabase-ready agent

Phase 4 adds four capabilities while preserving the existing MellowBot fallback:

1. Supabase-backed sessions, chat messages, leads and contact submissions.
2. Current web research for clearly time-sensitive non-MellowTech questions using Groq GPT-OSS browser search.
3. Screenshot/image analysis using Groq Qwen 3.8 27B.
4. Voice input using Groq Whisper Large V3 Turbo.

## Vercel environment variables

Required for AI:

- `GROQ_API_KEY`

Required for Supabase storage:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (preferred; legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported)

Recommended:

- `IP_HASH_SALT` — long random secret used to hash IP addresses before storage.
- `EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID_1`, `EMAILJS_TEMPLATE_ID_2` — optional; preserves the existing contact-form email notifications while Supabase stores a durable copy.
- `MELLOWBOT_GROQ_MODEL=openai/gpt-oss-20b`
- `MELLOWBOT_VISION_MODEL=qwen/qwen3.8-27b`
- `MELLOWBOT_TRANSCRIBE_MODEL=whisper-large-v3-turbo`

Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `GROQ_API_KEY` to browser code.

## Supabase setup

Run `mellowbot/supabase-phase4.sql` once in the Supabase SQL Editor. Then add the three Supabase environment variables to Vercel and redeploy.

The browser never connects directly to these tables. The Vercel functions use the Supabase server-only secret key (`sb_secret_...`) or the legacy service-role JWT. New secret keys are sent via the `apikey` header; legacy JWT keys also use `Authorization: Bearer`. RLS is enabled and direct `anon`/`authenticated` table access is revoked by the supplied SQL.

## Phase 4 endpoints

- `GET/POST /api/mellowbot`
- `POST /api/mellowbot-vision`
- `POST /api/mellowbot-transcribe`
- `POST /api/contact`

## AI routing

Normal MellowTech questions use the grounded MellowTech model + controlled tools.
Time-sensitive non-MellowTech questions can use Groq's built-in browser search. The browser-search path intentionally does not use structured JSON output because Groq documents browser search as incompatible with structured outputs.

## Browser features

The chatbot UI adds:

- image attachment / screenshot analysis
- voice recording / transcription
- page-aware context
- action buttons returned by the agent

Recordings are limited client-side and server-side. Images are resized in the browser before upload.

## Fallback

If Groq or Supabase is unavailable, the existing deterministic MellowTech bot remains available for normal chat. Lead/database actions are never claimed successful when storage is unavailable.

## Important production checks

After deployment:

1. `GET /api/mellowbot` should show `configured: true` and `databaseConfigured: true`.
2. Test a MellowTech pricing question.
3. Test a service-navigation question.
4. Test an explicit quote request with consent.
5. Test the contact form.
6. Test an image upload.
7. Test voice input.
8. Test a time-sensitive general question and confirm citations appear.
9. Test with Groq disabled and confirm the local bot still responds.
10. Confirm Supabase tables are not directly readable/writable from the browser.


## Final audit notes
- Preferred Supabase key: `SUPABASE_SECRET_KEY` (`sb_secret_...`), sent only as the `apikey` header. Legacy `SUPABASE_SERVICE_ROLE_KEY` additionally uses `Authorization: Bearer` for compatibility.
- Raw chat messages are not persistently stored during ordinary chat; the current consented lead flow may persist the submitted user/assistant exchange. Session metadata is best-effort and does not require lead consent.
- Lead/quote tools are never exposed to the model unless the current request contains explicit consent evidence; the executor also independently enforces consent.
- The final Groq response is always requested with JSON Schema after up to two tool rounds.
- The site has one canonical MellowBot implementation through `common.js`; the duplicate legacy bot in `Spaindex.html` was removed.
