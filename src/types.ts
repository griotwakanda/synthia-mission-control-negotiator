export type Decision = 'APPROVE' | 'REJECT' | 'ASK_MORE';

export interface TranscriptLine {
  id: string;
  ts: string;
  speaker: 'CALLER' | 'AGENT' | 'SYSTEM';
  text: string;
}

export interface NegotiationContext {
  provider: string;
  customerName: string;
  customerGoal: string;
  accountSummary: string;
  policyLimits: string[];
  transcript: TranscriptLine[];
}
