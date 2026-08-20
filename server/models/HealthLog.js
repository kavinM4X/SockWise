import mongoose from 'mongoose';

const healthLogSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ['STARTED', 'SUCCESS', 'FAILED'],
      default: 'STARTED',
      index: true,
    },
    triggerType: {
      type: String,
      required: true,
      enum: ['SCHEDULED', 'MANUAL'],
      default: 'SCHEDULED',
      index: true,
    },
    backendStatus: {
      type: String,
      required: true,
      enum: ['STARTED', 'HEALTHY', 'FAILED'],
      default: 'STARTED',
    },
    databaseStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'CONNECTED', 'FAILED'],
      default: 'PENDING',
    },
    databaseQueryStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    errorCode: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytical queries and retention monitoring
healthLogSchema.index({ startedAt: -1, status: 1 });
healthLogSchema.index({ triggerType: 1, startedAt: -1 });

// 55-Day Automatic Document Expiration TTL Index on createdAt
// 55 days * 24 hours * 60 mins * 60 secs = 4,752,000 seconds
const RETENTION_PERIOD_SECONDS = 55 * 24 * 60 * 60; // 4,752,000 seconds
healthLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_PERIOD_SECONDS });

const HealthLog = mongoose.model('HealthLog', healthLogSchema);

export default HealthLog;
