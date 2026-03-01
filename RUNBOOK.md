# RUNBOOK

## Local smoke test
1. `npm run dev`
2. Open dashboard at `http://localhost:8080`
3. Verify transcript lines render.
4. Click `APPROVE`, `REJECT`, `ASK_MORE` and confirm status updates.
5. Click `Refresh Suggestion` and verify suggestion text appears.

## API quick checks
```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/transcript/simulate
curl -X POST http://localhost:8080/api/decision -H 'Content-Type: application/json' -d '{"decision":"APPROVE"}'
curl -X POST http://localhost:8080/api/prompt/next
```

## Live-call cutover checklist (not yet configured)
- Add Twilio + OpenAI credentials in `.env`
- Expose webhook endpoint (ngrok or deployed URL)
- Set `SIMULATION_MODE=false`
- Implement Twilio call orchestration + streaming transcript ingestion
- Replace OpenAI placeholder with SDK responses
