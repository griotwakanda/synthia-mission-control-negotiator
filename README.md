# synthia-mission-control-negotiator

Mission-control app for live outbound calls where Twilio telephony is bridged to OpenAI Realtime voice conversation.

## Current capabilities
- Outbound call start/end controls
- Twilio webhook + bidirectional Media Stream (`<Connect><Stream>`) bridge
- OpenAI Realtime conversational turn-taking (voice configurable via `.env`, English)
- Live instruction injection from Daniel during an active call
- Guardrail in system instructions: Synthia always presents herself as Daniel's assistant
- Live transcript feed in UI
- Live audio monitor in UI (hear both sides while call is active)

## Quickstart
```bash
npm install
cp .env.example .env
npm run dev
```

Open: http://localhost:8080

## Required env for live calls
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_WEBHOOK_BASE_URL` (public HTTPS base URL, e.g. ngrok)
- `OPENAI_API_KEY`
- `OPENAI_REALTIME_MODEL` (default: `gpt-4o-realtime-preview`)
- `OPENAI_REALTIME_VOICE` (default: `shimmer`)

See docs:
- `SETUP.md`
- `ARCHITECTURE.md`
- `RUNBOOK.md`
