# RUNBOOK

## End-to-end local test (Twilio + OpenAI Realtime)

### 1) Start app
```bash
npm run dev
```
Dashboard: `http://localhost:8080`

### 2) Expose localhost over HTTPS/WSS
```bash
ngrok http 8080
```
Copy HTTPS URL, e.g. `https://abc123.ngrok-free.app`.

### 3) Configure `.env`
```env
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_WEBHOOK_BASE_URL=https://abc123.ngrok-free.app
OPENAI_API_KEY=...
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview
```
Restart app after env changes.

### 4) Twilio console configuration (exact)
For the Twilio phone number used as caller ID:
- **A CALL COMES IN**
  - Webhook
  - `POST https://abc123.ngrok-free.app/api/twilio/voice`
- No manual media-stream URL is needed in console; TwiML at `/api/twilio/voice` issues `<Connect><Stream>` dynamically.

Outbound call status callback is set automatically on each started call to:
- `POST https://abc123.ngrok-free.app/api/twilio/status`

### 5) Place test call
1. In dashboard, set destination phone (`+1...`).
2. Enter call objective.
3. Click **Call**.
4. Confirm first assistant utterance includes identity (e.g. “I’m Synthia, Daniel’s assistant...”).
5. Send live direction in **Live instruction from Daniel** and click **Send instruction**.
6. Verify transcript updates in **Live Transcript**.

### 6) Live audio monitoring
1. Click **Start monitor** after call starts.
2. You should hear both remote party + Synthia mixed in near real time.
3. Adjust gain slider as needed.
4. Click **Stop monitor** when done.

### 7) End call
Click **End Call** in dashboard.

## API spot checks
```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/call/state
curl -N http://localhost:8080/api/call/transcription/stream
curl -N http://localhost:8080/api/call/audio/stream
curl -X POST http://localhost:8080/api/call/instruction -H 'Content-Type: application/json' -d '{"instruction":"If they approve $65/month, accept and confirm by email."}'
curl -X POST http://localhost:8080/api/call/start -H 'Content-Type: application/json' -d '{"to":"+15551234567","objective":"Lower monthly bill"}'
curl -X POST http://localhost:8080/api/call/end -H 'Content-Type: application/json' -d '{}'
```

## Limitations / TODO
- In-memory state only (single process, no persistence).
- Monitor playback is raw µ-law decode in browser; no echo cancellation/mixing controls yet.
- Transcript quality depends on Realtime transcription event availability and model behavior.
- Add Twilio signature validation + auth hardening before production.
