import type { AiProvider } from './ai.provider.js';
import { OpenAiProvider } from './ai.openai.js';
import { AnthropicProvider } from './ai.anthropic.js';
import { OllamaProvider } from './ai.ollama.js';
import { getAiSettings } from './ai.settings.js';

let cachedProvider: AiProvider | null = null;
let cachedSettingsHash: string | null = null;

export async function getAiProvider(): Promise<AiProvider | null> {
  const settings = await getAiSettings();
  if (!settings || !settings.is_enabled || settings.provider === 'none') return null;

  const hash = JSON.stringify({ provider: settings.provider, api_key: settings.api_key, model_id: settings.model_id, ollama_url: settings.ollama_url, ollama_model: settings.ollama_model });
  if (cachedProvider && cachedSettingsHash === hash) return cachedProvider;

  switch (settings.provider) {
    case 'openai':
      if (!settings.api_key) return null;
      cachedProvider = new OpenAiProvider(settings.api_key, settings.model_id || 'gpt-4o-mini');
      break;
    case 'anthropic':
      if (!settings.api_key) return null;
      cachedProvider = new AnthropicProvider(settings.api_key, settings.model_id || 'claude-sonnet-4-20250514');
      break;
    case 'ollama':
      if (!settings.ollama_url) return null;
      cachedProvider = new OllamaProvider(settings.ollama_url, settings.ollama_model || 'llama3');
      break;
    default:
      return null;
  }
  cachedSettingsHash = hash;
  return cachedProvider;
}

export function clearProviderCache() {
  cachedProvider = null;
  cachedSettingsHash = null;
}
