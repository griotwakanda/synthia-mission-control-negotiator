import { buildNegotiationPrompt } from '../prompt/negotiationEngine.js';
import { generateSimulatedTranscript } from './transcriptSimulator.js';
import { OpenAIAdapter } from '../integrations/openai.js';

async function main() {
  const transcript = generateSimulatedTranscript();
  const prompt = buildNegotiationPrompt({
    provider: 'telus',
    customerName: 'Demo Customer',
    customerGoal: 'Reduce total monthly bill by at least 20%',
    accountSummary: 'Wireless + home internet bundle, 3-year customer, no recent credits',
    policyLimits: ['No unauthorized commitments'],
    transcript
  });

  const model = new OpenAIAdapter();
  const output = await model.generateNegotiationSuggestion(prompt);
  console.log(output);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
