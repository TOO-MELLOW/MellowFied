# MellowBot Phase 2 — Intelligent Assistant

Phase 2 keeps the existing MellowBot fallback but makes the Groq path structured and context-aware.

## Changes
- Groq responses use JSON Schema so the API returns a stable `answer`, `intent`, `service`, `confidence`, `suggestions`, and `cta` object.
- Conversation history is capped at 10 messages and the visitor's current page is supplied to the model.
- GPT-OSS 20B uses medium reasoning effort for service matching and multi-turn questions.
- The frontend renders AI suggestions as existing MellowBot chips.
- A deterministic fallback remains available whenever Groq is unavailable.
- Static instructions/knowledge are placed before dynamic conversation content to benefit from Groq prompt caching.

## Vercel
Keep the Phase 1 variable:
`GROQ_API_KEY`

Optional:
`MELLOWBOT_GROQ_MODEL=openai/gpt-oss-20b`

## Test
GET `/api/mellowbot` to confirm configuration.
POST `/api/mellowbot` with a user message and page context to test the structured response.
