import { Router } from 'express';
import { generateSimulatedTranscript } from '../simulator/transcriptSimulator.js';
import { buildNegotiationPrompt } from '../prompt/negotiationEngine.js';
import { OpenAIAdapter } from '../integrations/openai.js';
import { Decision } from '../types.js';

export const apiRouter = Router();

let lastDecision: Decision | null = null;

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, mode: 'simulation-first' });
});

apiRouter.get('/transcript/simulate', (_req, res) => {
  res.json({ transcript: generateSimulatedTranscript() });
});

apiRouter.post('/decision', (req, res) => {
  const decision = req.body?.decision as Decision;
  if (!['APPROVE', 'REJECT', 'ASK_MORE'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision' });
  }
  lastDecision = decision;
  return res.json({ ok: true, decision: lastDecision });
});

apiRouter.get('/decision', (_req, res) => {
  res.json({ lastDecision });
});

apiRouter.post('/prompt/next', async (_req, res) => {
  const transcript = generateSimulatedTranscript();
  const prompt = buildNegotiationPrompt({
    provider: 'telus',
    customerName: 'Demo Customer',
    customerGoal: 'Get lower monthly cost and avoid activation fees',
    accountSummary: 'Mid-tier plan, no device financing, tenure 36 months',
    policyLimits: ['Do not accept hidden surcharges'],
    transcript
  });

  const model = new OpenAIAdapter();
  const suggestion = await model.generateNegotiationSuggestion(prompt);

  res.json({ prompt, suggestion });
});
