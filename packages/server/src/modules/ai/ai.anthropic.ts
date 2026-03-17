import type { AiProvider } from './ai.provider.js';

export class AnthropicProvider implements AiProvider {
  async generateText(prompt: string, options?: { maxTokens?: number }): Promise<string> {
    throw new Error('Anthropic provider not configured. Set ANTHROPIC_API_KEY in environment.');
  }
  async summarize(text: string): Promise<string> {
    return this.generateText(`Summarize the following:\n\n${text}`);
  }
  async analyzeSentiment(text: string): Promise<{ score: number; label: string }> {
    throw new Error('Anthropic provider not configured.');
  }
}
