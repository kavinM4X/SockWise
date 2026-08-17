import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    customerName: {
      type: String,
      required: [true, 'Please add a customer name'],
    },
    customerPhone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// Ensure a user can't have duplicate customers by phone
customerSchema.index({ user: 1, customerPhone: 1 }, { unique: true });

export default mongoose.model('Customer', customerSchema);
