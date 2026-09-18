import cron from 'node-cron';
import { executeHealthCheck } from './healthService.js';

let healthCheckCronTask = null;
let isExecuting = false;

/**
 * Initialize 4-Hour Backend Health Check Cron Task
 */
export const initHealthCheckScheduler = () => {
  // Cron schedule expression: '0 */4 * * *' = Every 4 hours at minute 0 (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
  const CRON_EXPRESSION = process.env.HEALTH_CRON_EXPRESSION || '0 */4 * * *';

  if (healthCheckCronTask) {
    console.log('[Scheduler] Health check cron task is already initialized.');
    return healthCheckCronTask;
  }

  if (!cron.validate(CRON_EXPRESSION)) {
    console.error(`[Scheduler] Invalid cron expression: ${CRON_EXPRESSION}`);
    return null;
  }

  console.log(`[Scheduler] Initializing automated health-check cron task (${CRON_EXPRESSION})...`);

  healthCheckCronTask = cron.schedule(
    CRON_EXPRESSION,
    async () => {
      if (isExecuting) {
        console.warn(`[Scheduler] Previous health-check is still in progress. Skipping overlapping execution.`);
        return;
      }

      isExecuting = true;
      console.log(`[Scheduler] Triggering 4-hour scheduled health check...`);

      try {
        const result = await executeHealthCheck({ triggerType: 'SCHEDULED' });
        console.log(`[Scheduler] Scheduled health check finished. Status: ${result.status}, Duration: ${result.durationMs}ms`);
      } catch (error) {
        console.error(`[Scheduler] Health check execution failed with error:`, error.message);
      } finally {
        isExecuting = false;
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  console.log(`[Scheduler] Automated 4-hour health-check scheduler active.`);
  return healthCheckCronTask;
};

/**
 * Stop scheduler task gracefully
 */
export const stopHealthCheckScheduler = () => {
  if (healthCheckCronTask) {
    healthCheckCronTask.stop();
    healthCheckCronTask = null;
    console.log('[Scheduler] Health check cron task stopped.');
  }
};
