import express from 'express';
import { exportDatabase, importDatabase } from '../controllers/backupController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes protected

router.get('/export', exportDatabase);
router.post('/import', importDatabase);

export default router;
