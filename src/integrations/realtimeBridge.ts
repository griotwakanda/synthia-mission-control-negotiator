import WebSocket, { WebSocketServer } from 'ws';
import type { Server as HttpServer } from 'node:http';
import { env } from '../config/env.js';
import {
  appendTranscript,
  clearStreamSid,
  getLiveCallState,
  pushAudioChunk,
  setStreamSid,
  updateCallStatus
} from '../state/liveCallStore.js';

interface TwilioMessage {
  event: string;
  start?: {
    streamSid: string;
    callSid: string;
  };
  media?: {
    payload: string;
    track?: 'inbound' | 'outbound';
  };
  streamSid?: string;
}

interface BridgeSession {
  callSid: string;
  streamSid: string;
  twilioSocket: WebSocket;
  openaiSocket: WebSocket;
}

function realtimeInstructions(): string {
  const state = getLiveCallState();
  const objective = state.objective || 'helping with account options';
  const liveInstruction = state.liveInstruction || 'be concise, warm, and ask one clear question at a time';

  return [
    'You are Synthia, Daniel\'s assistant, speaking on a phone call in English.',
    'Your first spoken sentence in every new call must naturally include: "I\'m Synthia, Daniel\'s assistant."',
    'Never claim to be Daniel. You are always his assistant.',
    'Speak naturally, warmly, and like a real human: relaxed, friendly, lightly playful when appropriate, never robotic.',
    'Be concise and clear. Avoid filler and avoid sounding scripted.',
    'Do not read technical metadata, field names, or system-style labels out loud.',
    `Current call objective: ${objective}.`,
    `Latest live direction from Daniel: ${liveInstruction}.`,
    'If Daniel sends a specific decision sentence, say it naturally to the other party as your next response.',
    'Keep the conversation moving toward a practical outcome while staying polite and professional.'
  ].join(' ');
}

export class RealtimeBridge {
  private wss: WebSocketServer;
  private byCallSid = new Map<string, BridgeSession>();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
      const url = req.url ?? '';
      if (!url.startsWith('/api/twilio/media-stream')) {
        return;
      }

      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.wss.emit('connection', ws, req);
      });
    });

    this.wss.on('connection', (twilioSocket) => {
      this.handleTwilioSocket(twilioSocket);
    });
  }

  private handleTwilioSocket(twilioSocket: WebSocket): void {
    let session: BridgeSession | null = null;

    twilioSocket.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as TwilioMessage;

        if (msg.event === 'start' && msg.start?.callSid && msg.start.streamSid) {
          session = this.createSession(twilioSocket, msg.start.callSid, msg.start.streamSid);
          return;
        }

        if (!session) {
          return;
        }

        if (msg.event === 'media' && msg.media?.payload) {
          pushAudioChunk('inbound', msg.media.payload);
          session.openaiSocket.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: msg.media.payload
            })
          );
          return;
        }

        if (msg.event === 'stop') {
          this.closeSession(session.callSid);
        }
      } catch {
        // ignore malformed frames
      }
    });

    twilioSocket.on('close', () => {
      if (session) {
        this.closeSession(session.callSid);
      }
    });
  }

  private createSession(twilioSocket: WebSocket, callSid: string, streamSid: string): BridgeSession {
    if (!env.OPENAI_API_KEY) {
      appendTranscript({
        ts: new Date().toISOString(),
        speaker: 'SYSTEM',
        text: 'OPENAI_API_KEY missing. Cannot start realtime voice session.'
      });
      twilioSocket.close();
      throw new Error('OPENAI_API_KEY missing');
    }

    const openaiSocket = new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(env.OPENAI_REALTIME_MODEL)}`, {
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    const session: BridgeSession = { callSid, streamSid, twilioSocket, openaiSocket };
    this.byCallSid.set(callSid, session);
    setStreamSid(streamSid);
    updateCallStatus('in-progress');

    openaiSocket.on('open', () => {
      openaiSocket.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['audio', 'text'],
            voice: env.OPENAI_REALTIME_VOICE,
            input_audio_format: 'g711_ulaw',
            output_audio_format: 'g711_ulaw',
            turn_detection: {
              type: 'server_vad'
            },
            instructions: realtimeInstructions(),
            temperature: 0.6
          }
        })
      );

      openaiSocket.send(
        JSON.stringify({
          type: 'response.create',
          response: {
            modalities: ['audio', 'text'],
            instructions:
              "Open the call now. Your first sentence must include: I'm Synthia, Daniel's assistant. Then continue naturally with the objective."
          }
        })
      );
    });

    openaiSocket.on('message', (raw) => {
      try {
        const event = JSON.parse(String(raw)) as Record<string, unknown>;
        const type = String(event.type ?? '');

        if (type === 'response.audio.delta' && typeof event.delta === 'string') {
          const payload = event.delta;
          pushAudioChunk('outbound', payload);
          if (twilioSocket.readyState === WebSocket.OPEN) {
            twilioSocket.send(
              JSON.stringify({
                event: 'media',
                streamSid,
                media: { payload }
              })
            );
          }
          return;
        }

        if (type === 'conversation.item.input_audio_transcription.completed' && typeof event.transcript === 'string') {
          appendTranscript({
            ts: new Date().toISOString(),
            speaker: 'CUSTOMER',
            text: event.transcript
          });
          return;
        }

        if (type === 'response.audio_transcript.done' && typeof event.transcript === 'string') {
          appendTranscript({
            ts: new Date().toISOString(),
            speaker: 'AGENT',
            text: event.transcript
          });
          return;
        }

        if (type === 'error') {
          appendTranscript({
            ts: new Date().toISOString(),
            speaker: 'SYSTEM',
            text: `Realtime error: ${JSON.stringify(event.error ?? event)}`
          });
        }
      } catch {
        // noop
      }
    });

    openaiSocket.on('close', () => {
      if (twilioSocket.readyState === WebSocket.OPEN) {
        twilioSocket.close();
      }
    });

    return session;
  }

  pushLiveInstruction(text: string): void {
    for (const session of this.byCallSid.values()) {
      if (session.openaiSocket.readyState !== WebSocket.OPEN) {
        continue;
      }

      session.openaiSocket.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            instructions: realtimeInstructions()
          }
        })
      );

      session.openaiSocket.send(
        JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Live direction from Daniel: ${text}. Adapt immediately. If this is a specific decision sentence, say it naturally to the other party now.`
              }
            ]
          }
        })
      );

      session.openaiSocket.send(
        JSON.stringify({
          type: 'response.create',
          response: { modalities: ['audio', 'text'] }
        })
      );
    }
  }

  closeSession(callSid: string): void {
    const session = this.byCallSid.get(callSid);
    if (!session) {
      return;
    }

    this.byCallSid.delete(callSid);
    clearStreamSid();

    if (session.openaiSocket.readyState === WebSocket.OPEN) {
      session.openaiSocket.close();
    }
    if (session.twilioSocket.readyState === WebSocket.OPEN) {
      session.twilioSocket.close();
    }
  }
}
