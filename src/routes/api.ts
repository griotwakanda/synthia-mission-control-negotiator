import { Router } from 'express';
import { TwilioAdapter } from '../integrations/twilio.js';
import {
  appendTranscript,
  endCall,
  getLiveCallState,
  setCallContext,
  setInstruction,
  startCall,
  subscribe,
  updateCallStatus
} from '../state/liveCallStore.js';

export const apiRouter = Router();

const twilio = new TwilioAdapter();

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function twimlVoiceLoop(): string {
  const state = getLiveCallState();
  const objective = state.objective || 'discussing plan options and finding the best monthly value';
  const instruction = state.liveInstruction || 'be polite, concise, and ask only one question at a time';

  const intro = [
    "Hello, this is Synthia, Daniel's assistant.",
    `I'm calling regarding ${objective}.`,
    'Could you please help me with the best available option today?'
  ].join(' ');

  const followUp = [
    `Instruction for this step: ${instruction}.`,
    'Please share your latest offer or question after the tone.'
  ].join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${xmlEscape(intro)}</Say>
  <Gather input="speech" speechTimeout="auto" action="/api/twilio/voice/speech" method="POST">
    <Say voice="alice">${xmlEscape(followUp)}</Say>
  </Gather>
  <Redirect method="POST">/api/twilio/voice</Redirect>
</Response>`;
}

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, mode: 'live-call-mvp' });
});

apiRouter.get('/call/state', (_req, res) => {
  res.json(getLiveCallState());
});

apiRouter.get('/call/transcription/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const unsubscribe = subscribe((snapshot) => {
    res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
    res.end();
  });
});

apiRouter.post('/call/instruction', (req, res) => {
  const instruction = String(req.body?.instruction ?? '').trim();
  if (!instruction) {
    return res.status(400).json({ error: 'instruction is required' });
  }

  setInstruction(instruction);
  appendTranscript({
    ts: new Date().toISOString(),
    speaker: 'SYSTEM',
    text: `Instruction updated: ${instruction}`
  });

  return res.json({ ok: true, liveInstruction: instruction });
});

apiRouter.post('/call/start', async (req, res) => {
  try {
    const to = String(req.body?.to ?? '').trim();
    const objective = String(req.body?.objective ?? '').trim();

    if (!to) {
      return res.status(400).json({ error: 'to is required' });
    }

    setCallContext({ toPhoneNumber: to, objective });

    const { callSid, status } = await twilio.startOutboundCall(to);
    startCall(callSid);
    updateCallStatus(status || 'queued');

    appendTranscript({
      ts: new Date().toISOString(),
      speaker: 'SYSTEM',
      text: `Outbound call started to ${to} (${callSid}).`
    });

    return res.json({ ok: true, callSid, status });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start call' });
  }
});

apiRouter.post('/call/end', async (req, res) => {
  try {
    const inputCallSid = String(req.body?.callSid ?? '').trim();
    const state = getLiveCallState();
    const callSid = inputCallSid || state.activeCallSid;

    if (!callSid) {
      return res.status(400).json({ error: 'No active call to end' });
    }

    await twilio.hangupCall(callSid);
    endCall('completed');
    appendTranscript({
      ts: new Date().toISOString(),
      speaker: 'SYSTEM',
      text: `Call ended (${callSid}).`
    });

    return res.json({ ok: true, callSid });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to end call' });
  }
});

apiRouter.post('/twilio/voice', (req, res) => {
  const callSid = String(req.body?.CallSid ?? 'UNKNOWN');
  const callStatus = String(req.body?.CallStatus ?? 'in-progress');
  if (callSid !== 'UNKNOWN') {
    startCall(callSid);
    updateCallStatus(callStatus);
  }

  res.type('text/xml').send(twimlVoiceLoop());
});

apiRouter.post('/twilio/voice/speech', (req, res) => {
  const speech = String(req.body?.SpeechResult ?? '').trim();
  const confidence = String(req.body?.Confidence ?? 'n/a');

  if (speech) {
    appendTranscript({
      ts: new Date().toISOString(),
      speaker: 'CUSTOMER',
      text: `${speech} (confidence: ${confidence})`
    });
  }

  res.type('text/xml').send(twimlVoiceLoop());
});

apiRouter.post('/twilio/status', (req, res) => {
  const callSid = String(req.body?.CallSid ?? '');
  const callStatus = String(req.body?.CallStatus ?? 'unknown');

  if (callSid) {
    updateCallStatus(callStatus);
    appendTranscript({
      ts: new Date().toISOString(),
      speaker: 'SYSTEM',
      text: `Call status update (${callSid}): ${callStatus}`
    });
  }

  res.json({ ok: true });
});
