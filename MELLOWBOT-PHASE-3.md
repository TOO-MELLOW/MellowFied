# MellowBot Phase 3 — Action Layer

## What changed

Phase 3 adds a controlled action/tool layer to the Groq-powered MellowBot while preserving the existing local fallback bot.

### Available tools

1. `get_service_details`
   - Reads the authoritative `mellowbot/knowledge.json` service catalog.
   - Used when the visitor asks for service details, pricing, or turnaround.

2. `get_contact_details`
   - Returns the canonical MellowTech WhatsApp, email, and contact page.

3. `prepare_whatsapp_handoff`
   - Creates a pre-filled MellowTech WhatsApp URL from the customer's name and need.
   - No API key or secret is exposed to the browser.

4. `find_service_page`
   - Maps the customer's need to the relevant MellowTech service page.
   - The browser renders a direct action button.

## Front-end behavior

The API can now return an `action` object:

- `type: whatsapp` → opens the prepared WhatsApp chat in a new tab.
- `type: navigate` → opens the relevant MellowTech service page.

The existing suggestion chips remain available, and the local deterministic MellowBot remains the fallback whenever Groq is unavailable.

## Deployment

Keep `GROQ_API_KEY` in Vercel Environment Variables. Do not place it in HTML, CSS, or `common.js`.

Optional model override:

`MELLOWBOT_GROQ_MODEL=openai/gpt-oss-20b`

## Phase 3 boundary

This phase intentionally does not create a permanent lead database, payment flow, calendar booking, or CRM integration. Those should be connected only after choosing the destination system (for example, a Vercel/DB store, Google Sheets, CRM, or email workflow).
