import { env } from '../config/env.js';

export interface TwilioCallEvent {
  callSid: string;
  from: string;
  to: string;
  status: string;
  transcriptChunk?: string;
}

/**
 * Interface-only adapter for Twilio integration.
 * Live implementation requires real credentials and webhook setup.
 */
export class TwilioAdapter {
  isConfigured(): boolean {
    return Boolean(
      env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_PHONE_NUMBER &&
      env.TWILIO_WEBHOOK_BASE_URL
    );
  }

  async startOutboundCall(_to: string): Promise<{ callSid: string }> {
    if (!this.isConfigured()) {
      throw new Error('Twilio not configured. Use SIMULATION_MODE=true for local development.');
    }

    // Placeholder for actual Twilio REST API call.
    return { callSid: 'TWILIO_PLACEHOLDER_CALL_SID' };
  }

  async handleWebhook(payload: Record<string, string>): Promise<TwilioCallEvent> {
    return {
      callSid: payload.CallSid ?? 'UNKNOWN',
      from: payload.From ?? 'UNKNOWN',
      to: payload.To ?? 'UNKNOWN',
      status: payload.CallStatus ?? 'unknown',
      transcriptChunk: payload.SpeechResult
    };
  }
}
