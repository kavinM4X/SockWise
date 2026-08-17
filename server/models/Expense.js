import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    expenseId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add an expense title'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Shop Rent',
        'Electricity',
        'Salary',
        'Transport',
        'Maintenance',
        'Purchase',
        'Marketing',
        'Miscellaneous',
      ],
    },
    description: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, 'Please add an expense amount'],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'],
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    receiptImage: {
      type: String, // URL or file path
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ user: 1, expenseDate: -1 });
expenseSchema.index({ user: 1, category: 1 });

export default mongoose.model('Expense', expenseSchema);
