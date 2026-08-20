import mongoose from 'mongoose';
import HealthLog from '../models/HealthLog.js';
import crypto from 'crypto';

/**
 * Generate unique correlation execution ID for health check
 */
export const generateExecutionId = () => {
  return `hl_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
};

/**
 * Create initial HealthLog record prior to performing database health operations
 */
export const createHealthLog = async ({ triggerType = 'SCHEDULED', executionId = null } = {}) => {
  const exId = executionId || generateExecutionId();
  const startTime = new Date();

  try {
    const log = await HealthLog.create({
      executionId: exId,
      startedAt: startTime,
      status: 'STARTED',
      triggerType: ['SCHEDULED', 'MANUAL'].includes(triggerType) ? triggerType : 'SCHEDULED',
      backendStatus: 'STARTED',
      databaseStatus: 'PENDING',
      databaseQueryStatus: 'PENDING',
      details: {
        nodeVersion: process.version,
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        uptimeSeconds: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
      },
    });

    return log;
  } catch (error) {
    console.error(`[HealthService] Failed to create initial HealthLog:`, error.message);
    return null;
  }
};

/**
 * Update HealthLog intermediate step
 */
export const updateHealthLogStep = async (logId, updates) => {
  if (!logId) return null;
  try {
    return await HealthLog.findByIdAndUpdate(logId, { $set: updates }, { returnDocument: 'after' });
  } catch (error) {
    console.error(`[HealthService] Failed to update HealthLog step ${logId}:`, error.message);
    return null;
  }
};

/**
 * Complete HealthLog execution successfully
 */
export const completeHealthLogSuccess = async (logId, startTime, additionalDetails = {}) => {
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - new Date(startTime).getTime();

  if (!logId) return null;

  try {
    return await HealthLog.findByIdAndUpdate(
      logId,
      {
        $set: {
          status: 'SUCCESS',
          backendStatus: 'HEALTHY',
          databaseStatus: 'CONNECTED',
          databaseQueryStatus: 'SUCCESS',
          completedAt,
          durationMs,
          'details.completedTimestamp': completedAt.toISOString(),
          ...additionalDetails,
        },
      },
      { returnDocument: 'after' }
    );
  } catch (error) {
    console.error(`[HealthService] Failed to complete HealthLog success ${logId}:`, error.message);
    return null;
  }
};

/**
 * Finalize HealthLog execution as FAILED
 */
export const completeHealthLogFailure = async (logId, startTime, error, failedStep = 'UNKNOWN') => {
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - new Date(startTime).getTime();

  const errorMessage = error?.message || String(error) || 'Health check execution failed';
  const errorCode = error?.code || error?.name || `ERR_${failedStep}`;

  if (!logId) return null;

  try {
    const updateObj = {
      status: 'FAILED',
      completedAt,
      durationMs,
      errorMessage,
      errorCode,
      'details.failedStep': failedStep,
      'details.errorStack': process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    };

    if (failedStep === 'BACKEND') {
      updateObj.backendStatus = 'FAILED';
    } else if (failedStep === 'DATABASE_CONNECTION') {
      updateObj.backendStatus = 'HEALTHY';
      updateObj.databaseStatus = 'FAILED';
    } else if (failedStep === 'DATABASE_QUERY') {
      updateObj.backendStatus = 'HEALTHY';
      updateObj.databaseStatus = 'CONNECTED';
      updateObj.databaseQueryStatus = 'FAILED';
    }

    return await HealthLog.findByIdAndUpdate(logId, { $set: updateObj }, { returnDocument: 'after' });
  } catch (err) {
    console.error(`[HealthService] Failed to update HealthLog failure ${logId}:`, err.message);
    return null;
  }
};

/**
 * Execute Full Health Check Lifecycle
 */
export const executeHealthCheck = async ({ triggerType = 'SCHEDULED', executionId = null } = {}) => {
  const exId = executionId || generateExecutionId();
  const startTime = Date.now();
  let currentLog = null;

  try {
    // Step 1 — Process Starts & Create Initial Health Log
    currentLog = await createHealthLog({ triggerType, executionId: exId });

    // Step 2 — Backend Check
    if (currentLog) {
      currentLog = await updateHealthLogStep(currentLog._id, {
        backendStatus: 'HEALTHY',
      });
    }

    // Step 3 — Database Connection Verification
    const dbState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (dbState !== 1) {
      const dbErr = new Error(`MongoDB connection state is inactive (${dbState})`);
      dbErr.code = 'DB_NOT_CONNECTED';
      if (currentLog) {
        await completeHealthLogFailure(currentLog._id, startTime, dbErr, 'DATABASE_CONNECTION');
      }
      return {
        success: false,
        executionId: exId,
        step: 'DATABASE_CONNECTION',
        error: dbErr.message,
        durationMs: Date.now() - startTime,
      };
    }

    if (currentLog) {
      currentLog = await updateHealthLogStep(currentLog._id, {
        databaseStatus: 'CONNECTED',
      });
    }

    // Step 4 — Lightweight Database Query Execution (ping)
    const pingStart = Date.now();
    let pingLatencyMs = 0;
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.command({ ping: 1 });
      } else {
        // Fallback lightweight query if db reference isn't initialized directly
        await HealthLog.findOne().select('_id').lean();
      }
      pingLatencyMs = Date.now() - pingStart;
    } catch (queryErr) {
      queryErr.code = queryErr.code || 'DB_QUERY_FAILED';
      if (currentLog) {
        await completeHealthLogFailure(currentLog._id, startTime, queryErr, 'DATABASE_QUERY');
      }
      return {
        success: false,
        executionId: exId,
        step: 'DATABASE_QUERY',
        error: queryErr.message,
        durationMs: Date.now() - startTime,
      };
    }

    // Complete Execution as SUCCESS
    const finalLog = await completeHealthLogSuccess(currentLog?._id, startTime, {
      'details.pingLatencyMs': pingLatencyMs,
      'details.mongooseReadyState': dbState,
    });

    const totalDurationMs = Date.now() - startTime;

    // Structured Application Log
    console.log(
      JSON.stringify({
        event: 'HEALTH_CHECK_EXECUTED',
        executionId: exId,
        timestamp: new Date().toISOString(),
        triggerType,
        status: 'SUCCESS',
        backendStatus: 'HEALTHY',
        databaseStatus: 'CONNECTED',
        databaseQueryStatus: 'SUCCESS',
        durationMs: totalDurationMs,
        pingLatencyMs,
      })
    );

    return {
      success: true,
      executionId: exId,
      triggerType,
      status: 'SUCCESS',
      backendStatus: 'HEALTHY',
      databaseStatus: 'CONNECTED',
      databaseQueryStatus: 'SUCCESS',
      durationMs: totalDurationMs,
      pingLatencyMs,
      logId: finalLog?._id,
    };
  } catch (error) {
    console.error(`[HealthService] Unhandled error during health check execution:`, error);
    if (currentLog) {
      await completeHealthLogFailure(currentLog._id, startTime, error, 'UNKNOWN');
    }
    return {
      success: false,
      executionId: exId,
      error: error.message,
      durationMs: Date.now() - startTime,
    };
  }
};
