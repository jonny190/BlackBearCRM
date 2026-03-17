export interface AiProvider {
  generateText(prompt: string, options?: { maxTokens?: number }): Promise<string>;
  summarize(text: string): Promise<string>;
  analyzeSentiment(text: string): Promise<{ score: number; label: string }>;
}
