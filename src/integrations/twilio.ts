import { env } from '../config/env.js';

interface TwilioCallResponse {
  sid: string;
  status: string;
}

function twilioAuthHeader(): string {
  const token = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
  return `Basic ${token}`;
}

function twilioApiBase(): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}`;
}

function formBody(fields: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    params.set(key, value);
  }
  return params;
}

function normalizeBaseUrl(input: string): string {
  return input.endsWith('/') ? input.slice(0, -1) : input;
}

export class TwilioAdapter {
  private missingConfig(): string[] {
    const checks: Array<[string, string | undefined]> = [
      ['TWILIO_ACCOUNT_SID', env.TWILIO_ACCOUNT_SID],
      ['TWILIO_AUTH_TOKEN', env.TWILIO_AUTH_TOKEN],
      ['TWILIO_PHONE_NUMBER', env.TWILIO_PHONE_NUMBER],
      ['TWILIO_WEBHOOK_BASE_URL', env.TWILIO_WEBHOOK_BASE_URL]
    ];

    return checks.filter(([, value]) => !value).map(([name]) => name);
  }

  assertConfigured(): void {
    const missing = this.missingConfig();
    if (missing.length) {
      throw new Error(`Twilio is not fully configured. Missing: ${missing.join(', ')}`);
    }
  }

  webhookBaseUrl(): string {
    this.assertConfigured();
    return normalizeBaseUrl(env.TWILIO_WEBHOOK_BASE_URL!);
  }

  webhookUrl(path: string): string {
    return `${this.webhookBaseUrl()}/api/twilio${path}`;
  }

  async startOutboundCall(to: string): Promise<{ callSid: string; status: string }> {
    this.assertConfigured();

    const response = await fetch(`${twilioApiBase()}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: twilioAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody({
        To: to,
        From: env.TWILIO_PHONE_NUMBER!,
        Url: this.webhookUrl('/voice'),
        StatusCallback: this.webhookUrl('/status'),
        StatusCallbackMethod: 'POST',
        StatusCallbackEvent: 'initiated ringing answered completed'
      })
    });

    const data = (await response.json()) as TwilioCallResponse & { message?: string };

    if (!response.ok || !data.sid) {
      throw new Error(data.message ?? `Twilio call start failed with status ${response.status}`);
    }

    return { callSid: data.sid, status: data.status };
  }

  async hangupCall(callSid: string): Promise<void> {
    this.assertConfigured();

    const response = await fetch(`${twilioApiBase()}/Calls/${callSid}.json`, {
      method: 'POST',
      headers: {
        Authorization: twilioAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody({ Status: 'completed' })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(data.message ?? `Twilio hangup failed with status ${response.status}`);
    }
  }
}
