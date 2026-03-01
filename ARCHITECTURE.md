# ARCHITECTURE

## MVP modules
- `src/server.ts` — Express app + static Mission Control dashboard
- `src/routes/api.ts` — health, transcript simulation, decision gate, prompt suggestion
- `src/simulator/*` — local transcript simulator for no-credential development
- `src/prompt/negotiationEngine.ts` — provider-aware negotiation prompt builder (English)
- `src/config/providers.ts` + `providers/telus.yml` — provider config system
- `src/integrations/twilio.ts` — Twilio interface adapter (placeholder)
- `src/integrations/openai.ts` — OpenAI interface adapter (placeholder + simulated output)

## Runtime modes
1. **Simulation mode (default):** all flows run locally without external credentials.
2. **Live mode (future):** Twilio webhooks + OpenAI responses drive real call guidance.

## Approval gate
Decision states:
- `APPROVE`
- `REJECT`
- `ASK_MORE`

API endpoint: `POST /api/decision`
