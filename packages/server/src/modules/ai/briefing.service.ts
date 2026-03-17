import { db } from '../../core/database/connection.js';
import { getAiProvider } from './ai.service.js';
import { getAiSettings } from './ai.settings.js';
import { NotFoundError } from '../../core/helpers/errors.js';
import { logger } from '../../core/logger.js';

export async function generateBriefing(accountId: string, type: string) {
  const provider = await getAiProvider();
  if (!provider) throw new Error('AI provider not configured or disabled');

  const account = await db('accounts').where({ id: accountId }).first();
  if (!account) throw new NotFoundError('Account', accountId);

  const contacts = await db('contacts').where({ account_id: accountId });
  const activities = await db('activities').where({ account_id: accountId }).orderBy('occurred_at', 'desc').limit(20);
  const healthScore = await db('health_scores').where({ account_id: accountId }).orderBy('calculated_at', 'desc').first();

  const prompt = buildPrompt(type, account, contacts, activities, healthScore);
  const content = await provider.generateText(prompt, { maxTokens: 1500, temperature: 0.7 });

  const settings = await getAiSettings();
  const [briefing] = await db('ai_briefings').insert({
    account_id: accountId,
    type,
    content,
    model_provider: settings?.provider || 'unknown',
    model_id: settings?.model_id || settings?.ollama_model || 'unknown',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }).returning('*');

  logger.info({ accountId, type }, 'AI briefing generated');
  return briefing;
}

export async function getBriefings(accountId: string) {
  return db('ai_briefings').where({ account_id: accountId }).orderBy('generated_at', 'desc').limit(10);
}

function buildPrompt(type: string, account: Record<string, unknown>, contacts: Record<string, unknown>[], activities: Record<string, unknown>[], health: Record<string, unknown> | undefined): string {
  const contactSummary = contacts.map((c: Record<string, unknown>) => `${c.first_name} ${c.last_name} (${c.title}, ${c.role_level})`).join(', ');
  const activitySummary = activities.slice(0, 10).map((a: Record<string, unknown>) => `${a.type}: "${a.title}" on ${new Date(a.occurred_at as string).toLocaleDateString()}`).join('\n');
  const healthInfo = health ? `Health score: ${health.overall_score}/100, Engagement: ${health.engagement_score}/100` : 'No health data available';

  const prompts: Record<string, string> = {
    onboarding_90day: `You are a CRM analyst for BlackPear CRM. Generate a 90-day onboarding briefing for the following account. Include key relationship insights, suggested engagement cadence, and risk factors to watch.

Account: ${account.name}
Industry: ${account.industry}
Tier: ${account.tier}
Status: ${account.status}
Contacts: ${contactSummary || 'None'}
Recent Activities:\n${activitySummary || 'None'}
${healthInfo}

Provide actionable recommendations in a clear, concise format.`,

    pre_meeting: `You are a CRM analyst for BlackPear CRM. Generate a pre-meeting briefing for the following account. Include relationship context, recent engagement history, health trends, and suggested talking points.

Account: ${account.name}
Industry: ${account.industry}
Tier: ${account.tier}
Contacts: ${contactSummary || 'None'}
Recent Activities:\n${activitySummary || 'None'}
${healthInfo}

Keep it concise and actionable.`,

    relationship_gap: `You are a CRM analyst for BlackPear CRM. Analyze the following account for relationship gaps and risks. Identify missing stakeholder coverage, communication gaps, and recommend actions.

Account: ${account.name}
Industry: ${account.industry}
Tier: ${account.tier}
Contacts: ${contactSummary || 'None'}
Recent Activities:\n${activitySummary || 'None'}
${healthInfo}

Focus on specific, actionable gap analysis.`,
  };

  return prompts[type] || prompts.pre_meeting;
}
