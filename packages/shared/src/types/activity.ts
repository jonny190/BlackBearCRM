import { ActivityType } from '../constants/enums.js';

export interface Activity {
  id: string;
  account_id: string;
  contact_id: string | null;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
