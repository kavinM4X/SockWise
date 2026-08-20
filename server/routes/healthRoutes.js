import express from 'express';
import {
  getBasicHealth,
  runWarmupCheck,
  getHealthLogs,
  getHealthStats,
} from '../controllers/healthController.js';

const router = express.Router();

// Basic quick probe
router.get('/', getBasicHealth);

// Scheduled / Manual Warm-up and Audit execution endpoints
router.get('/warmup', runWarmupCheck);
router.post('/warmup', runWarmupCheck);

// Audit history and metrics dashboard endpoints
router.get('/logs', getHealthLogs);
router.get('/stats', getHealthStats);

export default router;
