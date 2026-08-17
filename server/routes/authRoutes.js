import express from 'express';
import { registerUser, loginUser, getCurrentUser, updateProfile, updatePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { check, validationResult } from 'express-validator';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('phone', 'Please include a valid phone number with 10+ digits').isLength({ min: 10 }),
  check('password', 'Please enter a password with 3 or more characters').isLength({ min: 3 }),
  validate
], registerUser);

router.post('/login', [
  check('phone', 'Phone is required').exists(),
  check('password', 'Password is required').exists(),
  validate
], loginUser);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

export default router;
