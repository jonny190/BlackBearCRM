import type { AiProvider } from './ai.provider.js';

export class OllamaProvider implements AiProvider {
  constructor(private baseUrl: string, private model: string) {}

  async generateText(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          num_predict: options?.maxTokens ?? 2048,
          temperature: options?.temperature ?? 0.7,
        },
      }),
    });
    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
    const data = await response.json() as { response: string };
    return data.response;
  }

  async summarize(text: string): Promise<string> {
    return this.generateText(`Summarize the following concisely:\n\n${text}`);
  }

  async analyzeSentiment(text: string): Promise<{ score: number; label: string }> {
    const result = await this.generateText(
      `Analyze the sentiment of the following text. Respond with ONLY a JSON object like {"score": 75, "label": "positive"} where score is 0-100 and label is "positive", "neutral", or "negative".\n\nText: ${text}`
    );
    try {
      const parsed = JSON.parse(result.trim());
      return { score: Number(parsed.score) || 50, label: parsed.label || 'neutral' };
    } catch {
      return { score: 50, label: 'neutral' };
    }
  }
}
