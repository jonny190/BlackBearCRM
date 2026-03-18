export type MeetingNoteStatus = 'processing' | 'processed' | 'failed';

export interface MeetingNote {
  id: string;
  account_id: string;
  contact_id: string | null;
  user_id: string;
  title: string;
  raw_notes: string;
  meeting_date: string;
  participants: Array<{ name: string; role?: string }>;
  status: MeetingNoteStatus;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProcessedNoteType = 'insight' | 'action_item' | 'concern' | 'follow_up' | 'sentiment';

export interface ProcessedCustomerNote {
  id: string;
  meeting_note_id: string;
  account_id: string;
  note_type: ProcessedNoteType;
  content: string;
  confidence_score: number;
  created_at: string;
}
