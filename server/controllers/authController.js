import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      res.status(400);
      throw new Error('Please add all required fields');
    }

    const userExists = await User.findOne({ phone });

    if (userExists) {
      res.status(400);
      throw new Error('User with this phone number already exists');
    }
    
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400);
        throw new Error('User with this email already exists');
      }
    }

    const user = await User.create({
      name,
      phone,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid phone number or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        shopName: user.shopName,
        ownerName: user.ownerName,
        address: user.address,
        gstNumber: user.gstNumber,
        currency: user.currency,
        theme: user.theme,
        dateFormat: user.dateFormat,
        logo: user.logo,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name && req.body.name.trim() !== '') {
        user.name = req.body.name.trim();
      }
      
      if (req.body.email !== undefined) {
        const trimmedEmail = req.body.email ? req.body.email.trim() : '';
        if (trimmedEmail !== '') {
          const existingEmailUser = await User.findOne({ email: trimmedEmail, _id: { $ne: user._id } });
          if (existingEmailUser) {
            res.status(400);
            throw new Error('Email is already in use by another account');
          }
          user.email = trimmedEmail;
        } else {
          user.email = undefined;
        }
      }

      if (req.body.phone && req.body.phone.trim() !== '') {
        const trimmedPhone = req.body.phone.trim();
        const existingPhoneUser = await User.findOne({ phone: trimmedPhone, _id: { $ne: user._id } });
        if (existingPhoneUser) {
          res.status(400);
          throw new Error('Phone number is already registered to another account');
        }
        user.phone = trimmedPhone;
      }

      if (req.body.shopName !== undefined) user.shopName = req.body.shopName;
      if (req.body.ownerName !== undefined) user.ownerName = req.body.ownerName;
      if (req.body.address !== undefined) user.address = req.body.address;
      if (req.body.gstNumber !== undefined) user.gstNumber = req.body.gstNumber;
      if (req.body.currency !== undefined) user.currency = req.body.currency;
      if (req.body.theme !== undefined) user.theme = req.body.theme;
      if (req.body.dateFormat !== undefined) user.dateFormat = req.body.dateFormat;
      if (req.body.logo !== undefined) user.logo = req.body.logo;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        shopName: updatedUser.shopName,
        ownerName: updatedUser.ownerName,
        address: updatedUser.address,
        gstNumber: updatedUser.gstNumber,
        currency: updatedUser.currency,
        theme: updatedUser.theme,
        dateFormat: updatedUser.dateFormat,
        logo: updatedUser.logo,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (user) {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide current and new password');
      }

      if (!(await user.matchPassword(currentPassword))) {
        res.status(401);
        throw new Error('Incorrect current password');
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
