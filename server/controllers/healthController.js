import { executeHealthCheck } from '../services/healthService.js';
import HealthLog from '../models/HealthLog.js';

// @desc    Basic health check probe (for load balancers)
// @route   GET /api/health
// @access  Public
export const getBasicHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

// @desc    Full Scheduled/Manual Health & Database Warm-up Execution
// @route   GET /api/health/warmup, POST /api/health/warmup
// @access  Public / Protected via HEALTH_KEY
export const runWarmupCheck = async (req, res, next) => {
  try {
    // Security key validation if HEALTH_KEY is configured in env
    const configuredKey = process.env.HEALTH_KEY;
    if (configuredKey) {
      const providedKey = req.headers['x-health-key'] || req.query.key;
      if (!providedKey || providedKey !== configuredKey) {
        return res.status(401).json({
          status: 'UNAUTHORIZED',
          message: 'Invalid or missing health security key',
        });
      }
    }

    // Determine trigger type (SCHEDULED or MANUAL)
    const rawTrigger = (req.query.triggerType || req.body?.triggerType || 'SCHEDULED').toUpperCase();
    const triggerType = ['SCHEDULED', 'MANUAL'].includes(rawTrigger) ? rawTrigger : 'SCHEDULED';

    // Execute multi-step health check flow
    const result = await executeHealthCheck({ triggerType });

    if (result.success) {
      return res.status(200).json({
        status: 'SUCCESS',
        message: 'Health check and database warm-up executed successfully',
        data: {
          executionId: result.executionId,
          triggerType: result.triggerType,
          backendStatus: result.backendStatus,
          databaseStatus: result.databaseStatus,
          databaseQueryStatus: result.databaseQueryStatus,
          durationMs: result.durationMs,
          pingLatencyMs: result.pingLatencyMs,
          logId: result.logId,
        },
      });
    } else {
      return res.status(500).json({
        status: 'FAILED',
        message: 'Health check execution encountered an error',
        error: {
          executionId: result.executionId,
          failedStep: result.step,
          errorMessage: result.error,
          durationMs: result.durationMs,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit history from health_logs database table
// @route   GET /api/health/logs
// @access  Public / Admin
export const getHealthLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && ['STARTED', 'SUCCESS', 'FAILED'].includes(req.query.status.toUpperCase())) {
      filter.status = req.query.status.toUpperCase();
    }
    if (req.query.triggerType && ['SCHEDULED', 'MANUAL'].includes(req.query.triggerType.toUpperCase())) {
      filter.triggerType = req.query.triggerType.toUpperCase();
    }

    const [logs, total] = await Promise.all([
      HealthLog.find(filter)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get health analytical stats & cold-start indicators
// @route   GET /api/health/stats
// @access  Public / Admin
export const getHealthStats = async (req, res, next) => {
  try {
    const [totalChecks, successCount, failedCount, recentLogs] = await Promise.all([
      HealthLog.countDocuments(),
      HealthLog.countDocuments({ status: 'SUCCESS' }),
      HealthLog.countDocuments({ status: 'FAILED' }),
      HealthLog.find({ status: 'SUCCESS' })
        .sort({ startedAt: -1 })
        .limit(50)
        .select('durationMs startedAt')
        .lean(),
    ]);

    const avgDurationMs =
      recentLogs.length > 0
        ? Math.round(recentLogs.reduce((acc, l) => acc + (l.durationMs || 0), 0) / recentLogs.length)
        : 0;

    const coldStartsDetected = recentLogs.filter((l) => l.durationMs > 1000).length;

    res.status(200).json({
      success: true,
      totalChecks,
      successCount,
      failedCount,
      successRatePercent: totalChecks > 0 ? ((successCount / totalChecks) * 100).toFixed(1) : '100.0',
      recentAverageDurationMs: avgDurationMs,
      coldStartsDetectedLast50: coldStartsDetected,
      lastCheck: recentLogs[0]?.startedAt || null,
    });
  } catch (error) {
    next(error);
  }
};
