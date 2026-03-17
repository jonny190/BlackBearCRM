import { RoleLevel } from '../constants/enums.js';

export interface Contact {
  id: string;
  account_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string;
  role_level: RoleLevel;
  influence_score: number;
  is_primary: boolean;
  last_interaction_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
