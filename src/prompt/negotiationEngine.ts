import { NegotiationContext } from '../types.js';
import { loadProviderConfig } from '../config/providers.js';

export function buildNegotiationPrompt(context: NegotiationContext): string {
  const provider = loadProviderConfig(context.provider);

  return `You are Synthia, a live negotiation copilot for telecom retention and billing calls.

Provider: ${provider.displayName}
Tone: ${provider.defaultTone}
Customer: ${context.customerName}
Customer goal: ${context.customerGoal}
Account summary: ${context.accountSummary}

Non-negotiable constraints:
${provider.constraints.map((c) => `- ${c}`).join('\n')}

Success criteria:
${provider.successCriteria.map((c) => `- ${c}`).join('\n')}

Current transcript:
${context.transcript.map((l) => `[${l.ts}] ${l.speaker}: ${l.text}`).join('\n')}

Your response format:
1) Suggested next line (1-2 sentences)
2) Rationale (brief)
3) Decision recommendation: APPROVE | REJECT | ASK_MORE
4) What more info is needed (if ASK_MORE)
`;}
