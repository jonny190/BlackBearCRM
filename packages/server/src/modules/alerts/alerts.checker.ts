import { db } from '../../core/database/connection.js';
import { logger } from '../../core/logger.js';
import { publishSocketEvent } from '../../core/websocket/socket.js';
import { findActiveAlert, insertAlert } from './alerts.queries.js';
import {
  AlertType,
  Severity,
  AccountTier,
  AccountStatus,
  ACTIVITY_GAP_DAYS,
  RoleLevel,
} from '@blackbear/shared';
import type { Account, Alert } from '@blackbear/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Insert an alert only if no active (non-dismissed) alert of the same type
 * already exists for this account.  Returns the new alert or null if
 * de-duplicated.
 */
async function createAlertIfNew(
  data: Omit<Alert, 'id' | 'created_at'>,
): Promise<Alert | null> {
  const existing = await findActiveAlert(data.account_id, data.type);
  if (existing) return null;

  const alert = await insertAlert(data);

  // Notify the owning user via WebSocket
  await publishSocketEvent('alert:created', { alert });

  return alert;
}

// ---------------------------------------------------------------------------
// Health threshold alerts
// ---------------------------------------------------------------------------

/**
 * Raise an alert when a score has dropped significantly in the last 7 days.
 * - Drop of 15+ points: high severity
 * - Drop of 10+ points: medium severity
 */
export async function checkHealthThresholds(
  accountId: string,
  score: number,
  previousScore: number,
  userId: string,
): Promise<void> {
  const drop = previousScore - score;

  let severity: string | null = null;
  if (drop >= 15) {
    severity = Severity.HIGH;
  } else if (drop >= 10) {
    severity = Severity.MEDIUM;
  }

  if (!severity) return;

  await createAlertIfNew({
    account_id: accountId,
    user_id: userId,
    type: AlertType.HEALTH_DROP,
    severity: severity as Alert['severity'],
    title: 'Health score dropped',
    message: `Score dropped by ${Math.round(drop)} points (from ${Math.round(previousScore)} to ${Math.round(score)}) in the last 7 days.`,
    is_read: false,
    is_dismissed: false,
  });
}

// ---------------------------------------------------------------------------
// Activity gap alerts
// ---------------------------------------------------------------------------

/**
 * Scan all active accounts and create alerts for those with no activity
 * within the expected gap window for their tier.
 */
export async function checkActivityGaps(): Promise<void> {
  const accounts: Account[] = await db('accounts')
    .where({ status: AccountStatus.ACTIVE })
    .select('*');

  for (const account of accounts) {
    const gapDays = ACTIVITY_GAP_DAYS[account.tier] ?? ACTIVITY_GAP_DAYS[AccountTier.SMB];
    const cutoff = new Date(Date.now() - gapDays * 24 * 60 * 60 * 1000);

    const recentActivity = await db('activities')
      .where({ account_id: account.id })
      .where('occurred_at', '>=', cutoff.toISOString())
      .first();

    if (!recentActivity) {
      await createAlertIfNew({
        account_id: account.id,
        user_id: account.owner_id,
        type: AlertType.ACTIVITY_GAP,
        severity: Severity.MEDIUM,
        title: 'No recent activity',
        message: `No activity recorded for this account in the last ${gapDays} days.`,
        is_read: false,
        is_dismissed: false,
      }).catch((err) => logger.error({ err, accountId: account.id }, 'Failed to create activity gap alert'));
    }
  }
}

// ---------------------------------------------------------------------------
// Single-contact risk alerts
// ---------------------------------------------------------------------------

/**
 * Detect accounts at risk due to having too few contacts or no senior contacts.
 * - Any tier: < 2 contacts -> low severity
 * - Enterprise / mid_market: no director+ contacts -> medium severity
 */
export async function checkSingleContactRisk(): Promise<void> {
  const accounts: Account[] = await db('accounts')
    .where({ status: AccountStatus.ACTIVE })
    .select('*');

  for (const account of accounts) {
    const contacts = await db('contacts')
      .where({ account_id: account.id })
      .select('id', 'role_level');

    if (contacts.length < 2) {
      await createAlertIfNew({
        account_id: account.id,
        user_id: account.owner_id,
        type: AlertType.SINGLE_CONTACT,
        severity: Severity.LOW,
        title: 'Single contact risk',
        message: `Account has fewer than 2 contacts on file.`,
        is_read: false,
        is_dismissed: false,
      }).catch((err) => logger.error({ err, accountId: account.id }, 'Failed to create single contact alert'));
      continue;
    }

    if (
      account.tier === AccountTier.ENTERPRISE ||
      account.tier === AccountTier.MID_MARKET
    ) {
      const seniorContact = contacts.find((c: { role_level: string }) =>
        c.role_level === RoleLevel.DIRECTOR || c.role_level === RoleLevel.EXECUTIVE,
      );

      if (!seniorContact) {
        await createAlertIfNew({
          account_id: account.id,
          user_id: account.owner_id,
          type: AlertType.SINGLE_CONTACT,
          severity: Severity.MEDIUM,
          title: 'No senior contact',
          message: `No director or executive contact found for this ${account.tier} account.`,
          is_read: false,
          is_dismissed: false,
        }).catch((err) => logger.error({ err, accountId: account.id }, 'Failed to create senior contact alert'));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Follow-up due alerts
// ---------------------------------------------------------------------------

/**
 * Find proposals with no follow-up activity logged in the last 7 days
 * and create alerts for the account owner.
 */
export async function checkFollowUpDue(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find all proposal activities that are older than 7 days
  const proposals = await db('activities')
    .where({ type: 'proposal' })
    .where('occurred_at', '<=', sevenDaysAgo.toISOString())
    .select('id', 'account_id', 'occurred_at');

  for (const proposal of proposals) {
    // Check if there has been any follow-up activity on this account since the proposal
    const followUp = await db('activities')
      .where({ account_id: proposal.account_id })
      .where('occurred_at', '>', proposal.occurred_at as string)
      .whereIn('type', ['follow_up', 'call', 'meeting', 'email'])
      .first();

    if (!followUp) {
      const account: Account | undefined = await db('accounts')
        .where({ id: proposal.account_id })
        .first();

      if (!account) continue;

      await createAlertIfNew({
        account_id: proposal.account_id,
        user_id: account.owner_id,
        type: AlertType.FOLLOW_UP_DUE,
        severity: Severity.MEDIUM,
        title: 'Follow-up overdue',
        message: `No follow-up activity recorded since a proposal was sent more than 7 days ago.`,
        is_read: false,
        is_dismissed: false,
      }).catch((err) => logger.error({ err, accountId: proposal.account_id }, 'Failed to create follow-up alert'));
    }
  }
}
