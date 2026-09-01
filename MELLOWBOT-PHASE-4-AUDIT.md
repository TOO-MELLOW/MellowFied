# MellowBot Phase 4 — Deep Audit + Second Re-vet

## Scope
Audited the complete Phase 4 project after the Phase 3 build, including the static website, all chatbot pages, Vercel API functions, Groq orchestration, Supabase access model, contact form path, image/voice features, knowledge grounding, privacy copy, local asset references, and failure/fallback paths.

## Phase 4 requirements checked
- Supabase-backed session/message/lead/contact persistence
- Secure server-side Groq and Supabase credentials
- Current web research for non-MellowTech time-sensitive questions
- Screenshot/image analysis
- Voice input + speech-to-text
- Page-aware MellowTech conversations
- Controlled MellowTech tools for service lookup, navigation, WhatsApp and lead/quote requests
- Existing deterministic MellowBot fallback
- Production-safe input limits and basic abuse protection

## First deep audit findings and repairs
1. `Spaindex.html` still contained a duplicate legacy MellowBot implementation. It was reduced to its actual SPA page/service functions and now uses the single canonical `common.js` chatbot.
2. Public service-page starting prices differed from the AI knowledge file. The knowledge layer was corrected to the prices visibly presented on the current service pages so MellowBot does not quote stale values.
3. Tool orchestration was changed so tool-call turns use normal Groq responses, while the final answer uses structured JSON Schema output. This avoids mixing browser-search/structured-output constraints and keeps action execution deterministic.
4. The contact form originally notified through EmailJS only. Phase 4 preserves that notification path while adding durable Supabase storage, so adding the database does not silently remove existing email notifications.
5. `index.html` had an invalid/nonexistent fallback `backvid.mp4` reference; the broken fallback was removed, leaving the real `video/backvid.mp4` asset.
6. Voice recording was hardened to use `MediaRecorder.isTypeSupported()` before forcing WebM.
7. Browser session storage was hardened with a temporary-session fallback for privacy/blocked-storage scenarios.
8. The session writer was changed so `first_page` is not overwritten on every navigation.
9. API responses now send `nosniff` and `no-referrer` headers in addition to `no-store`.
10. The Supabase integration now prefers the current `SUPABASE_SECRET_KEY` server-side key name while retaining legacy `SUPABASE_SERVICE_ROLE_KEY` compatibility.
11. MellowCV was added to the MellowBot knowledge boundary because the main site links to it and it is a Mellow Tech product.

## Second re-vet results
PASS — all JavaScript files pass `node --check`.
PASS — all inline HTML JavaScript blocks pass syntax validation when JSON-LD blocks are correctly excluded.
PASS — all JSON knowledge/site-page files parse successfully.
PASS — chatbot wiring: every chatbot page has exactly one `mtPanel` and exactly one `common.js` include (14 chatbot pages audited).
PASS — no broken local `href`/`src` references remain after excluding external URLs, API routes and Cloudflare email-protection placeholders.
PASS — no Groq API key, Supabase secret-key, or service-role-key pattern exists in the project source.
PASS — public service starting-price copy is synchronized with the AI knowledge layer.
PASS — normal MellowTech tool orchestration was simulated, including a tool call followed by a structured final response.
PASS — browser-search routing was simulated and verified to omit structured `response_format` as required by Groq's browser-search limitation.
PASS — explicit lead-consent rejection was verified.
PASS — lead storage refuses to claim success when Supabase is not configured.
PASS — preferred `SUPABASE_SECRET_KEY` authentication path was simulated.
PASS — contact, vision and transcription endpoints are present and server-side secret protected.

## Architecture/security review
- Groq key remains server-side in Vercel environment variables.
- Supabase secret/service-role credential remains server-side only.
- Browser does not initialize Supabase directly.
- Supabase tables have RLS enabled and browser roles are denied direct table access by the supplied SQL.
- Lead creation requires explicit consent and at least one contact method.
- Contact form includes a honeypot and server-side validation.
- Request/body limits and timeouts are used on AI endpoints.
- Chat and contact persistence are best-effort for normal chat, but business actions never claim success when storage is unavailable.
- The deterministic local MellowBot remains the normal-chat fallback if Groq is unavailable.

## Known deployment limitations (not code defects)
- The environment used for this audit did not contain the live MellowTech Groq key, so a real production Groq completion was not possible here.
- The Vercel CLI is not installed in this environment, so a local `vercel build`/preview deployment could not be run.
- The Supabase project itself was not connected during the audit, so live SQL execution and REST writes were not performed here. The supplied SQL and REST request path were statically and programmatically checked.
- The in-memory API rate limits are only a best-effort abuse guard; they are not a replacement for a distributed WAF/rate-limit service.

## Production gate
The code is ready for the Supabase/Groq configuration step, but the deployment should not be considered live-verified until the Vercel environment variables are added and the post-deployment tests in `MELLOWBOT-PHASE-4.md` are completed.

## Final deep re-audit + independent re-vet (September 2026)

This was performed again from the actual Phase 4 project tree rather than trusting the previous audit conclusions.

### Full-file coverage
- 51 files were present after the audit manifest was generated; 50 project files plus the generated SHA-256 manifest.
- 37 text/source files were fully parsed/scanned, covering 9,476 source/document lines.
- All 6 JavaScript source files passed `node --check`.
- All 9 non-JSON-LD inline JavaScript blocks embedded in HTML passed `node --check`.
- All 2 JSON files parsed successfully.
- All 20 HTML documents parsed successfully.
- No unexpected NUL bytes were found in text/source files.

### Final corrections found during the re-vet
1. `find_service_page` now prefers the authoritative service `key` instead of relying on broad text matching first, reducing the chance of a service being mapped to the wrong page.
2. New Supabase `sb_secret_...` keys are now sent via `apikey` only; the legacy `SUPABASE_SERVICE_ROLE_KEY` JWT continues to use `Authorization: Bearer`.
3. `getBody()` now safely converts a JSON `null` body to `{}` instead of allowing downstream null access.
4. The main Groq request and browser-research request now actually receive their `AbortController` signals; the previously created timeout timers therefore enforce real upstream cancellation.
5. The duplicate Cloudflare email-protection artifact in `Spaindex.html` was removed and replaced with the canonical `mailto:info@mellowtech.co.za` address.
6. Phase 4 documentation was updated to describe the current Supabase secret-key header behavior and consented transcript persistence accurately.

### Independent behavioral re-vet
- Two sequential Groq tool rounds followed by a mandatory structured final response were simulated successfully.
- Explicit lead consent was required before lead/quote tools became available.
- The executor independently rejected lead/quote writes without trusted consent.
- Lead success was not claimed when storage was unavailable.
- `sb_secret_...` authentication was simulated and verified to omit the Bearer JWT header.
- A JSON `null` request body was verified to produce a controlled 400 response rather than an exception.
- All API upstream `fetch()` calls are now confirmed to have both a timeout and an abort signal.

### Final static/security re-vet
PASS — no token-shaped Groq or Supabase secrets embedded in source.
PASS — no obsolete `mellowtech@email.com` address remains.
PASS — no obsolete double-slash sitemap remains.
PASS — no Cloudflare email-protection artifact remains.
PASS — no broken local href/src references remain.
PASS — each of the 14 chatbot pages has one canonical chatbot panel/input stack and one `common.js` include.
PASS — no duplicate chatbot implementation remains in `Spaindex.html`.
PASS — all service knowledge keys have corresponding real pages and `pageMap` entries.
PASS — public service starting prices and AI knowledge prices match.
PASS — Supabase SQL contains all four required tables, RLS enablement, browser-role revokes and service-role grants.
PASS — browser code contains no direct Supabase credential/access path.
PASS — consented lead/quote storage and non-consented ordinary chat persistence boundaries are enforced in server code.

### Scope boundary
A source audit cannot honestly substitute for a live production verification. The final code has not been live-tested against the user's actual Groq API key, actual Supabase project, or an actual Vercel deployment in this environment. Those are the only remaining external verification steps.
