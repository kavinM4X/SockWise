import express from 'express';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getDashboardSummary,
  getCategorySummary,
  getMonthlyTrends,
} from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Protect all routes

router.route('/').get(getExpenses).post(createExpense);
router.get('/dashboard', getDashboardSummary);
router.get('/category-summary', getCategorySummary);
router.get('/monthly', getMonthlyTrends);
router.route('/:id').get(getExpenseById).put(updateExpense).delete(deleteExpense);

export default router;
