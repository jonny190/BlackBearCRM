import { db } from '../../core/database/connection.js';

export async function getManagerDashboard(userId: string) {
  const accounts = await db('accounts').where({ owner_id: userId, status: 'active' });
  const accountIds = accounts.map((a: any) => a.id);

  // Get latest health scores for each account
  const healthScores = await db('health_scores')
    .whereIn('account_id', accountIds)
    .distinctOn('account_id')
    .orderBy('account_id')
    .orderBy('calculated_at', 'desc');

  const atRisk = healthScores.filter((h: any) => h.overall_score < 60);

  // Recent activities
  const recentActivities = await db('activities')
    .whereIn('account_id', accountIds)
    .orderBy('occurred_at', 'desc').limit(10);

  // Unread alerts
  const alerts = await db('alerts').where({ user_id: userId, is_read: false, is_dismissed: false })
    .orderBy('created_at', 'desc').limit(10);

  return {
    total_accounts: accounts.length,
    at_risk_count: atRisk.length,
    health_scores: healthScores,
    at_risk_accounts: atRisk.map((h: any) => {
      const account = accounts.find((a: any) => a.id === h.account_id);
      return { ...h, account_name: account?.name };
    }),
    recent_activities: recentActivities,
    alerts,
  };
}

export async function getTeamLeadDashboard() {
  const accounts = await db('accounts').where({ status: 'active' });
  const healthScores = await db('health_scores')
    .distinctOn('account_id')
    .orderBy('account_id')
    .orderBy('calculated_at', 'desc');
  const atRisk = healthScores.filter((h: any) => h.overall_score < 60);

  return {
    total_accounts: accounts.length,
    at_risk_count: atRisk.length,
    at_risk_accounts: atRisk.map((h: any) => {
      const account = accounts.find((a: any) => a.id === h.account_id);
      return { ...h, account_name: account?.name, owner_id: account?.owner_id };
    }),
  };
}

export async function getOperationsDashboard() {
  const totalAccounts = await db('accounts').count('id as count').first();
  const totalContacts = await db('contacts').count('id as count').first();
  const accountsWithoutContacts = await db('accounts')
    .leftJoin('contacts', 'accounts.id', 'contacts.account_id')
    .whereNull('contacts.id').count('accounts.id as count').first();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const inactiveAccounts = await db('accounts')
    .where('status', 'active')
    .whereNotIn('id', db('activities').where('occurred_at', '>=', thirtyDaysAgo).distinct('account_id'))
    .count('id as count').first();

  return {
    total_accounts: Number(totalAccounts?.count ?? 0),
    total_contacts: Number(totalContacts?.count ?? 0),
    accounts_without_contacts: Number(accountsWithoutContacts?.count ?? 0),
    inactive_accounts_30d: Number(inactiveAccounts?.count ?? 0),
  };
}
