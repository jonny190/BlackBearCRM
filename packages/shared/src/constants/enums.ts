export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AccountTier = {
  ENTERPRISE: 'enterprise',
  MID_MARKET: 'mid_market',
  SMB: 'smb',
} as const;
export type AccountTier = (typeof AccountTier)[keyof typeof AccountTier];

export const AccountStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CHURNED: 'churned',
  PROSPECT: 'prospect',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const RoleLevel = {
  EXECUTIVE: 'executive',
  DIRECTOR: 'director',
  MANAGER: 'manager',
  INDIVIDUAL: 'individual',
} as const;
export type RoleLevel = (typeof RoleLevel)[keyof typeof RoleLevel];

export const ActivityType = {
  MEETING: 'meeting',
  EMAIL: 'email',
  CALL: 'call',
  NOTE: 'note',
  PROPOSAL: 'proposal',
  FOLLOW_UP: 'follow_up',
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const AlertType = {
  HEALTH_DROP: 'health_drop',
  ACTIVITY_GAP: 'activity_gap',
  SINGLE_CONTACT: 'single_contact',
  FOLLOW_UP_DUE: 'follow_up_due',
} as const;
export type AlertType = (typeof AlertType)[keyof typeof AlertType];

export const Severity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];
