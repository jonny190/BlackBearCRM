import type { AiProvider } from './ai.provider.js';

export class OpenAiProvider implements AiProvider {
  constructor(private apiKey: string, private model: string = 'gpt-4o-mini') {}

  async generateText(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }
    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? '';
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
