import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      unique: true,
      minlength: [10, 'Phone number must be at least 10 characters'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function(v) {
          if (!v || v.trim() === '') return true;
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please add a valid email'
      }
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [3, 'Password must be at least 3 characters'],
      select: false,
    },
    shopName: {
      type: String,
      default: 'My Shop',
    },
    ownerName: {
      type: String,
    },
    address: {
      type: String,
    },
    gstNumber: {
      type: String,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    theme: {
      type: String,
      default: 'light',
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
    },
    logo: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
