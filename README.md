# synthia-mission-control-negotiator

MVP mission-control app for first live Twilio test calls with:
- Outbound call start/end controls
- Twilio voice webhook loop (TwiML + speech gather)
- Live transcription/event feed over SSE
- Mission objective + live instruction controls (server-side call context)

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

See docs:
- `SETUP.md`
- `ARCHITECTURE.md`
- `RUNBOOK.md`
