import { AccountTier, AccountStatus } from '../constants/enums.js';

export interface Account {
  id: string;
  name: string;
  industry: string;
  tier: AccountTier;
  website: string | null;
  status: AccountStatus;
  owner_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
