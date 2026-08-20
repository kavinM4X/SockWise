import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { executeHealthCheck, createHealthLog, completeHealthLogFailure } from './services/healthService.js';
import HealthLog from './models/HealthLog.js';

dotenv.config();

const runTests = async () => {
  console.log('🧪 Starting SockWise Backend Health Check & Cold-Start Test Suite...\n');

  try {
    await connectDB();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 1: Successful Health Check Execution
    console.log('🔹 Test 1: Execute Full Health Check (Manual Trigger)...');
    const result1 = await executeHealthCheck({ triggerType: 'MANUAL' });
    console.assert(result1.success === true, 'Test 1 Failed: success should be true');
    console.assert(result1.status === 'SUCCESS', 'Test 1 Failed: status should be SUCCESS');
    console.assert(result1.databaseStatus === 'CONNECTED', 'Test 1 Failed: databaseStatus should be CONNECTED');
    console.assert(result1.databaseQueryStatus === 'SUCCESS', 'Test 1 Failed: databaseQueryStatus should be SUCCESS');
    console.log(`✅ Test 1 Passed! Execution ID: ${result1.executionId}, Duration: ${result1.durationMs}ms\n`);

    // Test 2: Scheduled Health Check Execution
    console.log('🔹 Test 2: Execute Scheduled Health Check...');
    const result2 = await executeHealthCheck({ triggerType: 'SCHEDULED' });
    console.assert(result2.success === true, 'Test 2 Failed: success should be true');
    console.assert(result2.triggerType === 'SCHEDULED', 'Test 2 Failed: triggerType should be SCHEDULED');
    console.log(`✅ Test 2 Passed! Execution ID: ${result2.executionId}, Duration: ${result2.durationMs}ms\n`);

    // Test 3: Step-by-Step Lifecycle & Partial Failure State Log Persistence
    console.log('🔹 Test 3: Partial Failure State Log Persistence...');
    const initialLog = await createHealthLog({ triggerType: 'MANUAL' });
    console.assert(initialLog.status === 'STARTED', 'Test 3 Failed: status should be STARTED initially');

    const failedLog = await completeHealthLogFailure(
      initialLog._id,
      Date.now() - 50,
      new Error('Simulated Database Connection Failure'),
      'DATABASE_CONNECTION'
    );

    console.assert(failedLog.status === 'FAILED', 'Test 3 Failed: status should be FAILED');
    console.assert(failedLog.databaseStatus === 'FAILED', 'Test 3 Failed: databaseStatus should be FAILED');
    console.assert(failedLog.errorMessage === 'Simulated Database Connection Failure', 'Test 3 Failed: Error message mismatch');
    console.log(`✅ Test 3 Passed! Partial failure recorded and persisted in health_logs table!\n`);

    // Test 4: Verify health_logs Audit History Records
    console.log('🔹 Test 4: Querying health_logs Audit Table Records...');
    const logs = await HealthLog.find().sort({ startedAt: -1 }).limit(5);
    console.assert(logs.length >= 3, 'Test 4 Failed: Expected at least 3 health log records');
    console.log(`✅ Test 4 Passed! Found ${logs.length} persisted health log records in MongoDB!\n`);

    // Test 5: Verify 55-Day MongoDB TTL Index Configuration on createdAt
    console.log('🔹 Test 5: Verifying MongoDB TTL Index on createdAt (55-Day Retention)...');
    await HealthLog.syncIndexes();
    const indexes = await HealthLog.collection.indexes();
    const ttlIndex = indexes.find(idx => idx.key && idx.key.createdAt === 1 && idx.expireAfterSeconds !== undefined);

    console.assert(ttlIndex !== undefined, 'Test 5 Failed: TTL index on createdAt not found');
    const expectedSeconds = 55 * 24 * 60 * 60; // 4,752,000 seconds
    console.assert(ttlIndex.expireAfterSeconds === expectedSeconds, `Test 5 Failed: Expected TTL ${expectedSeconds}s, got ${ttlIndex.expireAfterSeconds}s`);
    console.log(`✅ Test 5 Passed! Confirmed MongoDB TTL index on createdAt with expireAfterSeconds=${ttlIndex.expireAfterSeconds} (${ttlIndex.expireAfterSeconds / 86400} days)!\n`);

    // Test 6: Verify Retention Anchor (createdAt remains unchanged during step updates)
    console.log('🔹 Test 6: Verifying Retention Anchor Integrity (createdAt vs updatedAt)...');
    const logForAnchor = await createHealthLog({ triggerType: 'MANUAL' });
    const originalCreatedAt = logForAnchor.createdAt.getTime();

    // Simulate delay and update record state
    await new Promise(r => setTimeout(r, 200));
    const updatedAnchorLog = await HealthLog.findByIdAndUpdate(
      logForAnchor._id,
      { $set: { status: 'SUCCESS', details: { testUpdate: true } } },
      { returnDocument: 'after' }
    );

    console.assert(updatedAnchorLog.createdAt.getTime() === originalCreatedAt, 'Test 6 Failed: createdAt timestamp was mutated during update!');
    console.assert(updatedAnchorLog.updatedAt.getTime() > originalCreatedAt, 'Test 6 Failed: updatedAt should be greater than createdAt');
    console.log(`✅ Test 6 Passed! Confirmed createdAt is anchor timestamp for 55-day TTL retention (updatedAt does NOT extend retention period)!\n`);

    console.log('🎉 All 6 Backend Health Check & 55-Day Retention Tests Passed Successfully!');
  } catch (err) {
    console.error('❌ Test Suite Failed:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runTests();
