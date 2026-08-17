import express from 'express';
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  collectPayment,
  getCustomerHistory,
} from '../controllers/customerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes protected

router.route('/').get(getCustomers);
router.post('/collect-payment', collectPayment);
router.get('/history/:phone', getCustomerHistory);
router.route('/:id').get(getCustomerById).put(updateCustomer).delete(deleteCustomer);

export default router;
