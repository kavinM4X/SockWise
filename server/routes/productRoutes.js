import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All product routes are protected

router.route('/').get(getProducts).post(createProduct);
router.get('/low-stock', getLowStockProducts);
router.route('/:id').get(getProductById).put(updateProduct).delete(deleteProduct);

export default router;
