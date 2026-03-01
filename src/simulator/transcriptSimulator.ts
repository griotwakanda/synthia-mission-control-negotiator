import { TranscriptLine } from '../types.js';

const script: Array<Omit<TranscriptLine, 'id'>> = [
  { ts: '00:03', speaker: 'AGENT', text: 'Thank you for calling TELUS loyalty, how can I help?' },
  { ts: '00:06', speaker: 'CALLER', text: 'My bill increased again. I need a better offer or I will switch.' },
  { ts: '00:13', speaker: 'AGENT', text: 'I can review available retention plans now.' },
  { ts: '00:21', speaker: 'SYSTEM', text: 'Potential leverage: competitor has lower 5G plan in your postal code.' },
  { ts: '00:30', speaker: 'AGENT', text: 'I can reduce your monthly fee by $15 with a 24-month term.' }
];

export function generateSimulatedTranscript(): TranscriptLine[] {
  return script.map((line, i) => ({ ...line, id: `sim-${i + 1}` }));
}
