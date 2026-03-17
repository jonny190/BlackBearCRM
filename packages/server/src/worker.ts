import { healthQueue, alertQueue } from './core/queue/health-queue.js';
import { logger } from './core/logger.js';
import { calculateAndStoreHealth } from './modules/health/health.service.js';
import {
  checkActivityGaps,
  checkSingleContactRisk,
  checkFollowUpDue,
} from './modules/alerts/alerts.checker.js';
import { db } from './core/database/connection.js';

// ---------------------------------------------------------------------------
// Health queue processors
// ---------------------------------------------------------------------------

healthQueue.process('calculateAccountHealth', async (job) => {
  const { accountId } = job.data as { accountId: string };
  logger.info({ accountId }, 'Processing health score calculation');
  try {
    const score = await calculateAndStoreHealth(accountId);
    logger.info({ accountId, score: score.overall_score }, 'Health score calculated');
    return score;
  } catch (err) {
    logger.error({ err, accountId }, 'Failed to calculate health score');
    throw err;
  }
});

healthQueue.process('batchRecalculate', async (_job) => {
  logger.info('Starting batch health recalculation');
  const accounts: Array<{ id: string }> = await db('accounts')
    .where({ status: 'active' })
    .select('id');

  let processed = 0;
  let failed = 0;

  for (const account of accounts) {
    try {
      await calculateAndStoreHealth(account.id);
      processed++;
    } catch (err) {
      logger.error({ err, accountId: account.id }, 'Failed in batch recalculation');
      failed++;
    }
  }

  logger.info({ processed, failed }, 'Batch health recalculation complete');
  return { processed, failed };
});

// ---------------------------------------------------------------------------
// Alert queue processors
// ---------------------------------------------------------------------------

alertQueue.process('checkActivityGaps', async (_job) => {
  logger.info('Checking activity gaps');
  await checkActivityGaps();
  logger.info('Activity gap check complete');
});

alertQueue.process('checkSingleContactRisk', async (_job) => {
  logger.info('Checking single contact risk');
  await checkSingleContactRisk();
  logger.info('Single contact risk check complete');
});

alertQueue.process('checkFollowUpDue', async (_job) => {
  logger.info('Checking follow-up due');
  await checkFollowUpDue();
  logger.info('Follow-up due check complete');
});

// ---------------------------------------------------------------------------
// Scheduled jobs
// ---------------------------------------------------------------------------

// Batch recalculate at 2AM every day
healthQueue.add(
  'batchRecalculate',
  {},
  {
    repeat: { cron: '0 2 * * *' },
    jobId: 'scheduled-batch-recalculate',
  },
);

// Check activity gaps at 3AM every day
alertQueue.add(
  'checkActivityGaps',
  {},
  {
    repeat: { cron: '0 3 * * *' },
    jobId: 'scheduled-activity-gaps',
  },
);

// Check single contact risk at 4AM every Monday
alertQueue.add(
  'checkSingleContactRisk',
  {},
  {
    repeat: { cron: '0 4 * * 1' },
    jobId: 'scheduled-single-contact-risk',
  },
);

// Check follow-ups due at 5AM every day
alertQueue.add(
  'checkFollowUpDue',
  {},
  {
    repeat: { cron: '0 5 * * *' },
    jobId: 'scheduled-follow-up-due',
  },
);

logger.info('Worker started and listening for jobs');
