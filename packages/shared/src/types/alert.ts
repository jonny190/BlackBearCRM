import { AlertType, Severity } from '../constants/enums.js';

export interface Alert {
  id: string;
  account_id: string;
  user_id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  message: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}
