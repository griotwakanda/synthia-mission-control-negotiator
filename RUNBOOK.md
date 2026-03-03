# RUNBOOK

## First local live-call test (Twilio)

### 1) Start the app
```bash
npm run dev
```

Dashboard: `http://localhost:8080`

### 2) Expose local server to Twilio
In a second terminal:
```bash
ngrok http 8080
```
Copy the HTTPS URL, e.g. `https://abc123.ngrok-free.app`.

### 3) Configure `.env`
Set:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (Twilio number making outbound calls)
- `TWILIO_WEBHOOK_BASE_URL=https://abc123.ngrok-free.app`

Restart `npm run dev` after env changes.

### 4) Twilio Console webhook fields
For the Twilio phone number you are using:
- **A call comes in** → `POST https://<your-ngrok>/api/twilio/voice`
- (Optional but recommended) status callback is automatically set by outbound API calls to:
  `POST https://<your-ngrok>/api/twilio/status`

### 5) Place first test call from dashboard
1. Enter destination phone number in E.164 format (`+1...`).
2. Enter call objective.
3. Click **Call**.
4. Speak when prompted; Twilio speech gather will post transcripts.
5. Watch events in **Live Transcription Feed**.
6. Update live instructions and click **Send instruction** (takes effect on next loop).
7. Click **End Call** to hang up.

## API quick checks
```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/call/state
curl -N http://localhost:8080/api/call/transcription/stream
curl -X POST http://localhost:8080/api/call/instruction -H 'Content-Type: application/json' -d '{"instruction":"Ask for retention."}'
curl -X POST http://localhost:8080/api/call/start -H 'Content-Type: application/json' -d '{"to":"+15551234567","objective":"Lower monthly bill"}'
curl -X POST http://localhost:8080/api/call/end -H 'Content-Type: application/json' -d '{}'
```

## Notes
- State is in-memory (single-process MVP).
- No secrets are returned to frontend.
- Clear error messages are returned when Twilio env vars are missing.
