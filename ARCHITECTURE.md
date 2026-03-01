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

## Strategic voice roadmap (openai/openai-fm)

### 1) Why `openai/openai-fm` matters
- `openai/openai-fm` is a strong reference implementation for modern voice product patterns: turn handling, latency-sensitive streaming, evaluation loops, and operator tooling around voice quality.
- It provides concrete design signals for how to move beyond "LLM text + telephony plumbing" into a robust voice experience lifecycle (build, test, tune, ship).
- For Synthia, it reduces experimentation risk by giving us a known-good blueprint for voice interaction ergonomics and iteration speed.

### 2) Voice Studio module (internal QA + presets)
Add a **Voice Studio** module to Mission Control for internal teams:
- Preset packs per provider/archetype (e.g., calm retention, firm escalation, empathy-first).
- Side-by-side audition/testing of prompt + voice settings against canned negotiation scenarios.
- QA scorecards (clarity, interruption recovery, policy compliance, conversion likelihood).
- "Save as profile" to version and promote winning configurations from sandbox to default runtime.

### 3) Upgrade path to micro-SaaS (post-validation with Daniel)
- Phase 1: keep Synthia as an internal negotiation copilot to validate impact, process fit, and governance with Daniel.
- Phase 2: productize the reusable core (prompt/voice presets, scenario replay, QA analytics, approval-gate traces) into a tenant-aware control plane.
- Phase 3: package as a narrow micro-SaaS for small call teams that need guided negotiations, measurable QA, and safe human override.

### 4) Suggested milestone sequence
1. **Voice R&D baseline:** review/adapt patterns from `openai/openai-fm`; define latency + quality targets.
2. **Voice Studio v0:** preset management, scenario replay, and manual QA scoring in dashboard.
3. **Live pilot hardening:** run controlled Twilio/OpenAI pilot with audit logs and approval-gate telemetry.
4. **Validation checkpoint with Daniel:** confirm KPI lift, operational readiness, and compliance posture.
5. **Productization prep:** multi-tenant data model, billing hooks, role-based access, and onboarding templates.
6. **Micro-SaaS beta:** invite-design-partner rollout with usage analytics and pricing tests.
