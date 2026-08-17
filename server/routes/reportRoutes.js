import express from 'express';
import {
  getDashboard,
  getWeekly,
  getMonthly,
  getYearly,
  getCustom,
  getTopProducts,
  getTopCustomers,
  getPaymentSummary,
  getProfitLoss,
  getStockSummary,
  exportCSV,
  exportPDF,
  getCharts,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes protected

router.get('/dashboard', getDashboard);
router.get('/weekly', getWeekly);
router.get('/monthly', getMonthly);
router.get('/yearly', getYearly);
router.get('/custom', getCustom);
router.get('/charts', getCharts);

router.get('/top-products', getTopProducts);
router.get('/top-customers', getTopCustomers);
router.get('/payment-summary', getPaymentSummary);
router.get('/profit-loss', getProfitLoss);
router.get('/stock-summary', getStockSummary);

router.get('/export/csv', exportCSV);
router.get('/export/pdf', exportPDF);

export default router;
