import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';

// Helper to generate Invoice Number: SW-YYYYMMDD-XXXX
const generateInvoiceNumber = async (userId) => {
  const date = new Date();
  const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `SW-${dateString}-`;

  const lastSale = await Sale.findOne({
    user: userId,
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });

  if (lastSale && lastSale.invoiceNumber) {
    const lastSequence = parseInt(lastSale.invoiceNumber.split('-')[2], 10);
    const nextSequence = String(lastSequence + 1).padStart(4, '0');
    return `${prefix}${nextSequence}`;
  } else {
    return `${prefix}0001`;
  }
};

// @desc    Create a sale
// @route   POST /api/sales
// @access  Private
export const createSale = async (req, res, next) => {
  try {
    const { customerName, customerPhone, items, discount = 0, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      res.status(400);
      throw new Error('No sale items provided');
    }

    if (!paymentMethod) {
      res.status(400);
      throw new Error('Payment method is required');
    }

    if (paymentMethod === 'Credit' && (!customerName || !customerPhone)) {
      res.status(400);
      throw new Error('Customer details are required for Credit sales');
    }

    let subtotal = 0;
    let totalProfit = 0;
    const saleItems = [];

    // Verify stock and build items
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, user: req.user.id });
      
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.productName}`);
      }

      if (product.stockQuantity < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product.productName}. Available: ${product.stockQuantity}`);
      }

      // Calculate totals
      const itemTotal = product.sellingPrice * item.quantity;
      const itemProfit = (product.sellingPrice - product.purchasePrice) * item.quantity;
      
      subtotal += itemTotal;
      totalProfit += itemProfit;

      saleItems.push({
        product: product._id,
        productId: product.productId,
        productName: product.productName,
        quantity: item.quantity,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        total: itemTotal,
      });

      // Decrease stock
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    const total = subtotal - discount;
    const invoiceNumber = await generateInvoiceNumber(req.user.id);
    const paymentStatus = paymentMethod === 'Credit' ? 'Pending' : 'Paid';

    const sale = new Sale({
      user: req.user.id,
      invoiceNumber,
      customerName,
      customerPhone,
      items: saleItems,
      subtotal,
      discount,
      total,
      totalProfit,
      paymentMethod,
      paymentStatus,
      notes,
    });

    await sale.save();

    // Handle Customer Credit
    if (paymentMethod === 'Credit') {
      let customer = await Customer.findOne({ user: req.user.id, customerPhone });
      if (customer) {
        customer.outstandingBalance += total;
        if (!customer.customerName) customer.customerName = customerName;
        await customer.save();
      } else {
        await Customer.create([{
          user: req.user.id,
          customerName,
          customerPhone,
          outstandingBalance: total
        }]);
      }
    }

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res, next) => {
  try {
    const { customerName, customerPhone, invoiceNumber, paymentMethod, startDate, endDate, page = 1, limit = 10 } = req.query;

    let query = { user: req.user._id };

    if (customerName) query.customerName = { $regex: customerName, $options: 'i' };
    if (customerPhone) query.customerPhone = { $regex: customerPhone, $options: 'i' };
    if (invoiceNumber) query.invoiceNumber = { $regex: invoiceNumber, $options: 'i' };
    if (paymentMethod) query.paymentMethod = paymentMethod;
    
    if (startDate && endDate) {
      query.saleDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.saleDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.saleDate = { $lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;

    const sales = await Sale.find(query)
      .sort({ saleDate: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale || sale.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Sale not found');
    }

    res.json(sale);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a sale
// @route   PUT /api/sales/:id
// @access  Private
export const updateSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale || sale.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Sale not found');
    }

    // Only allow updating basic info like notes and paymentStatus for simplicity
    const { notes, paymentStatus } = req.body;
    
    if (notes) sale.notes = notes;
    
    if (paymentStatus && sale.paymentStatus !== paymentStatus) {
      // If changing from Pending to Paid on a Credit sale, update customer balance
      if (sale.paymentMethod === 'Credit' && sale.paymentStatus === 'Pending' && paymentStatus === 'Paid') {
        const customer = await Customer.findOne({ user: req.user.id, customerPhone: sale.customerPhone });
        if (customer) {
          customer.outstandingBalance -= sale.total;
          await customer.save();
        }
      }
      sale.paymentStatus = paymentStatus;
    }

    const updatedSale = await sale.save();
    res.json(updatedSale);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private
export const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale || sale.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Sale not found');
    }

    // Restore stock
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stockQuantity += item.quantity;
        await product.save();
      }
    }

    // Restore customer balance if credit
    if (sale.paymentMethod === 'Credit' && sale.paymentStatus === 'Pending') {
      const customer = await Customer.findOne({ user: req.user.id, customerPhone: sale.customerPhone });
      if (customer) {
        customer.outstandingBalance -= sale.total;
        await customer.save();
      }
    }

    await sale.deleteOne();

    res.json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard summary
// @route   GET /api/sales/dashboard
// @access  Private
export const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Sales Aggregations
    const salesAgg = await Sale.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          todayRevenue: {
            $sum: {
              $cond: [{ $gte: ['$saleDate', today] }, '$total', 0],
            },
          },
          todayProfit: {
            $sum: {
              $cond: [{ $gte: ['$saleDate', today] }, '$totalProfit', 0],
            },
          },
          weeklyRevenue: {
            $sum: {
              $cond: [{ $gte: ['$saleDate', firstDayOfWeek] }, '$total', 0],
            },
          },
          monthlyRevenue: {
            $sum: {
              $cond: [{ $gte: ['$saleDate', firstDayOfMonth] }, '$total', 0],
            },
          },
          monthlyProfit: {
            $sum: {
              $cond: [{ $gte: ['$saleDate', firstDayOfMonth] }, '$totalProfit', 0],
            },
          },
        },
      },
    ]);

    const stats = salesAgg[0] || {
      totalSales: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      todayProfit: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      monthlyProfit: 0,
    };

    const avgOrderValue = stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0;

    // Get Pending Credit
    const creditAgg = await Customer.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, totalPending: { $sum: '$outstandingBalance' } } },
    ]);
    const pendingCredit = creditAgg[0] ? creditAgg[0].totalPending : 0;

    res.json({
      todaySales: stats.todayRevenue,
      todayProfit: stats.todayProfit,
      weeklySales: stats.weeklyRevenue,
      monthlyRevenue: stats.monthlyRevenue,
      monthlyProfit: stats.monthlyProfit,
      totalOrders: stats.totalSales,
      averageOrderValue: avgOrderValue,
      pendingCredit,
    });
  } catch (error) {
    next(error);
  }
};
