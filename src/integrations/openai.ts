import { env } from '../config/env.js';

export class OpenAIAdapter {
  isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY);
  }

  async generateNegotiationSuggestion(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      return `[SIMULATED MODEL OUTPUT]\n${prompt.slice(0, 220)}...`;
    }

    // Placeholder for real Responses API call.
    // Example to implement later with openai SDK:
    // const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    // const res = await client.responses.create({ model: env.OPENAI_MODEL, input: prompt });
    // return res.output_text;

    return 'OPENAI_PLACEHOLDER_RESPONSE';
  }
}
