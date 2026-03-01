# synthia-mission-control-negotiator

MVP-72h scaffold for a negotiation copilot with:
- Mission Control dashboard
- Live transcript simulator
- Approval gate (`APPROVE`, `REJECT`, `ASK_MORE`)
- Provider config (`providers/telus.yml`)
- English negotiation prompt engine
- Twilio/OpenAI integration interfaces (env placeholders)
- Simulation mode as default

## Quickstart
```bash
npm install
cp .env.example .env
npm run dev
```

Open: http://localhost:8080

See docs:
- `SETUP.md`
- `ARCHITECTURE.md`
- `RUNBOOK.md`
