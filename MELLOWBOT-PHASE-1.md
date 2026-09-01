# MellowBot — Phase 1 Groq Integration

This phase adds a secure Groq-backed AI layer to the existing MellowBot without removing the existing local assistant.

## What changed

- Added `api/mellowbot.js` — secure Vercel serverless endpoint.
- Added `mellowbot/knowledge.json` — canonical MellowTech company/service/pricing/contact rules.
- Added `mellowbot/site_pages.json` — extracted public-site content for grounded answers.
- Updated `common.js` — sends conversations to `/api/mellowbot`; falls back to the existing deterministic bot if AI is unavailable.
- Added `.env.example` — documents required environment variables.

## Vercel setup

In the Vercel project for `mellowtech.co.za`, add this Environment Variable:

`GROQ_API_KEY`

Value: your Groq API key.

Recommended production value for the optional model variable:

`MELLOWBOT_GROQ_MODEL=openai/gpt-oss-20b`

Redeploy after adding/changing production environment variables.

## Verify after deployment

Open:

`https://mellowtech.co.za/api/mellowbot`

It should return JSON similar to:

`{"ok":true,"service":"mellowbot","configured":true,"model":"openai/gpt-oss-20b"}`

Then open the MellowBot on the website and ask a MellowTech-specific question such as:

- What services do you offer?
- How much is a CV?
- How much is website development?
- Can you help my business get online?
- What is the fastest way to contact Mellow Tech?

## Important

Do not put the Groq API key into `common.js`, HTML, CSS, or any other browser-delivered file. The browser only calls `/api/mellowbot`; the Vercel function holds the secret and talks to Groq.

The existing local MellowBot remains as a fallback so the site still responds when the Groq service is unavailable or not yet configured.
