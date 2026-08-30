import express from 'express';
import {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
  getDashboardSummary,
  exportInvoicePDF,
} from '../controllers/saleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Protect all routes

router.route('/').get(getSales).post(createSale);
router.get('/dashboard', getDashboardSummary);
router.get('/:id/pdf', exportInvoicePDF);
router.route('/:id').get(getSaleById).put(updateSale).delete(deleteSale);

export default router;
