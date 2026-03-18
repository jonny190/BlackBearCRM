import { db } from '../../core/database/connection.js';
import { getAiProvider } from '../ai/ai.service.js';
import { healthQueue } from '../../core/queue/health-queue.js';
import { publishSocketEvent } from '../../core/websocket/socket.js';
import { logger } from '../../core/logger.js';
import {
  getMeetingNoteById,
  updateMeetingNote,
  insertProcessedNotes,
  deleteProcessedNotes,
} from './meetings.queries.js';
import type { ProcessedNoteType } from '@blackpear/shared';

interface ExtractedNote {
  type: ProcessedNoteType;
  content: string;
  confidence: number;
}

export async function processMeetingNote(meetingNoteId: string): Promise<void> {
  const note = await getMeetingNoteById(meetingNoteId);
  if (!note) {
    logger.warn({ meetingNoteId }, 'Meeting note not found for processing');
    return;
  }

  const provider = await getAiProvider();
  if (!provider) {
    await updateMeetingNote(meetingNoteId, { status: 'failed' });
    logger.warn({ meetingNoteId }, 'AI provider not configured, marking as failed');
    return;
  }

  try {
    const account = await db('accounts').where({ id: note.account_id }).first();
    const accountContext = account
      ? `Account: ${account.name}, Industry: ${account.industry ?? 'N/A'}, Tier: ${account.tier ?? 'N/A'}`
      : 'Account context unavailable';

    const prompt = `You are a CRM analyst for Black Pear CRM. Analyze the following meeting notes and extract structured insights.

${accountContext}
Meeting Title: ${note.title}
Meeting Date: ${note.meeting_date}
Participants: ${JSON.stringify(note.participants)}

Meeting Notes:
${note.raw_notes}

Extract key information and return ONLY a JSON array of objects. Each object must have:
- "type": one of "insight", "action_item", "concern", "follow_up", "sentiment"
- "content": a concise 1-2 sentence description
- "confidence": a number between 0 and 1 indicating your confidence

Example format:
[{"type": "action_item", "content": "Schedule follow-up demo for the analytics module by end of week", "confidence": 0.9}]

Return ONLY the JSON array, no other text.`;

    const response = await provider.generateText(prompt, { maxTokens: 1500, temperature: 0.3 });

    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const extracted: ExtractedNote[] = JSON.parse(jsonStr);

    if (!Array.isArray(extracted) || extracted.length === 0) {
      throw new Error('AI returned empty or invalid array');
    }

    const validTypes: ProcessedNoteType[] = ['insight', 'action_item', 'concern', 'follow_up', 'sentiment'];
    const validNotes = extracted
      .filter((e) => validTypes.includes(e.type) && typeof e.content === 'string' && e.content.length > 0)
      .map((e) => ({
        meeting_note_id: meetingNoteId,
        account_id: note.account_id,
        note_type: e.type,
        content: e.content,
        confidence_score: Math.max(0, Math.min(1, Number(e.confidence) || 0.5)),
      }));

    if (validNotes.length === 0) {
      throw new Error('No valid notes extracted from AI response');
    }

    await deleteProcessedNotes(meetingNoteId);
    await insertProcessedNotes(validNotes);

    await updateMeetingNote(meetingNoteId, {
      status: 'processed',
      processed_at: new Date().toISOString(),
    });

    await healthQueue.add('calculateAccountHealth', { accountId: note.account_id });

    await publishSocketEvent('meeting-note:processed', { accountId: note.account_id, meetingNoteId });

    logger.info({ meetingNoteId, extractedCount: validNotes.length }, 'Meeting note processed successfully');
  } catch (err) {
    logger.error({ err, meetingNoteId }, 'Failed to process meeting note');
    throw err;
  }
}
