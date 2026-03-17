import type { AiProvider } from './ai.provider.js';
import { OpenAiProvider } from './ai.openai.js';
import { AnthropicProvider } from './ai.anthropic.js';

let provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (provider) return provider;
  const llmProvider = process.env.LLM_PROVIDER ?? 'openai';
  provider = llmProvider === 'anthropic' ? new AnthropicProvider() : new OpenAiProvider();
  return provider;
}
