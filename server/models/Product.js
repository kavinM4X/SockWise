import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    productId: {
      type: String,
      required: [true, 'Please add a product ID'],
    },
    productName: {
      type: String,
      required: [true, 'Please add a product name'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Please add a purchase price'],
    },
    profitPercentage: {
      type: Number,
      required: [true, 'Please add a profit percentage'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please add a selling price'],
    },
    category: {
      type: String,
    },
    brand: {
      type: String,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Please add a stock quantity'],
    },
    minimumStock: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ user: 1, productName: 1 });
productSchema.index({ user: 1, category: 1 });
productSchema.index({ user: 1, brand: 1 });

export default mongoose.model('Product', productSchema);
