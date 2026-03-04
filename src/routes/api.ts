import { Router } from 'express';
import { TwilioAdapter } from '../integrations/twilio.js';
import {
  appendTranscript,
  endCall,
  getLiveCallState,
  getRecentAudioEvents,
  setCallContext,
  setInstruction,
  startCall,
  subscribe,
  subscribeAudio,
  updateCallStatus
} from '../state/liveCallStore.js';
import type { RealtimeBridge } from '../integrations/realtimeBridge.js';

const twilio = new TwilioAdapter();

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normalizeBaseUrl(input: string): string {
  return input.endsWith('/') ? input.slice(0, -1) : input;
}

function wsBaseFromWebhook(httpsBase: string): string {
  if (httpsBase.startsWith('https://')) {
    return `wss://${httpsBase.slice('https://'.length)}`;
  }
  if (httpsBase.startsWith('http://')) {
    return `ws://${httpsBase.slice('http://'.length)}`;
  }
  return httpsBase;
}

function voiceTwimlForMediaStream(): string {
  const streamBase = wsBaseFromWebhook(normalizeBaseUrl(twilio.webhookBaseUrl()));
  const streamUrl = `${streamBase}/api/twilio/media-stream`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${xmlEscape(streamUrl)}" track="both_tracks" />
  </Connect>
</Response>`;
}

export function createApiRouter(bridge: RealtimeBridge): Router {
  const apiRouter = Router();

  apiRouter.get('/health', (_req, res) => {
    res.json({ ok: true, mode: 'realtime-voice-bridge' });
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

  apiRouter.get('/call/audio/recent', (req, res) => {
    const limit = Number(req.query.limit ?? 600);
    res.json({ events: getRecentAudioEvents(Number.isFinite(limit) ? Math.max(1, Math.min(limit, 4000)) : 600) });
  });

  apiRouter.get('/call/audio/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const initial = getRecentAudioEvents(200);
    for (const ev of initial) {
      res.write(`data: ${JSON.stringify(ev)}\n\n`);
    }

    const unsubscribe = subscribeAudio((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
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
    bridge.pushLiveInstruction(instruction);

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
      bridge.closeSession(callSid);
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

    res.type('text/xml').send(voiceTwimlForMediaStream());
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

  return apiRouter;
}
