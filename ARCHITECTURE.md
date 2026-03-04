# ARCHITECTURE

## Runtime modules
- `src/server.ts` — Express + HTTP server + WebSocket upgrade handling
- `src/routes/api.ts` — mission-control APIs, SSE transcript/audio streams, Twilio webhooks
- `src/integrations/twilio.ts` — outbound call start/end via Twilio REST API
- `src/integrations/realtimeBridge.ts` — Twilio Media Stream <-> OpenAI Realtime bidirectional audio bridge
- `src/state/liveCallStore.ts` — in-memory call state + transcript + rolling audio chunk buffer for monitor
- `public/index.html` — call controls, live transcript, live instruction box, and live audio monitor

## Call flow
1. Dashboard calls `POST /api/call/start` with destination + objective.
2. Server starts outbound call through Twilio REST API.
3. Twilio requests `/api/twilio/voice` and receives TwiML with `<Connect><Stream ... track="both_tracks"/>`.
4. Twilio opens WebSocket to `/api/twilio/media-stream`.
5. Bridge opens OpenAI Realtime WebSocket and sets session:
   - `voice: shimmer`
   - English conversational instructions
   - mandatory identity guardrail (Daniel's assistant)
   - server VAD turn detection
   - g711_ulaw audio in/out
6. Inbound Twilio media frames are appended to OpenAI input buffer.
7. OpenAI output audio deltas are streamed back to Twilio as outbound media.
8. Transcript events and call state are pushed to UI via SSE.
9. Audio chunks from both directions are mirrored to an SSE stream for live monitor playback.

## Live direction model
- `POST /api/call/instruction` updates shared live instruction state.
- Active realtime sessions receive immediate `session.update` + injected user item:
  - tells Synthia to adapt immediately
  - if Daniel sends a specific decision sentence, Synthia should say it naturally

## Notes
- State is in-memory (single-process MVP).
- No secrets are sent to frontend.
- `.env` drives all external credentials and runtime model selection.
