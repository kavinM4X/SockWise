import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';

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
    const { customerName, customerPhone, items, discount = 0, fittingCharge = 0, gstPercent = 0, paymentMethod, notes, advancePayment = 0 } = req.body;

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

    const parsedFitting = parseFloat(fittingCharge) || 0;
    const parsedDiscount = parseFloat(discount) || 0;
    const parsedGstPercent = Math.max(parseFloat(gstPercent) || 0, 0);

    const taxableAmount = Math.max(subtotal + parsedFitting - parsedDiscount, 0);
    const gstAmount = Math.round(((taxableAmount * parsedGstPercent) / 100) * 100) / 100;
    const total = Math.round((taxableAmount + gstAmount) * 100) / 100;

    const parsedAdvance = paymentMethod === 'Credit' ? Math.min(Math.max(parseFloat(advancePayment) || 0, 0), total) : 0;
    const creditTabAmount = Math.max(total - parsedAdvance, 0);

    const invoiceNumber = await generateInvoiceNumber(req.user.id);
    const paymentStatus = paymentMethod === 'Credit' && creditTabAmount > 0 ? 'Pending' : 'Paid';

    let finalNotes = notes || '';
    if (paymentMethod === 'Credit' && parsedAdvance > 0) {
      finalNotes = finalNotes ? `${finalNotes} (Down Payment: ₹${parsedAdvance})` : `Down Payment: ₹${parsedAdvance}`;
    }

    const sale = new Sale({
      user: req.user.id,
      invoiceNumber,
      customerName,
      customerPhone,
      items: saleItems,
      subtotal,
      discount: parsedDiscount,
      fittingCharge: parsedFitting,
      gstPercent: parsedGstPercent,
      gstAmount,
      total,
      totalProfit,
      paymentMethod,
      paymentStatus,
      advancePayment: parsedAdvance,
      notes: finalNotes,
    });

    await sale.save();

    // Handle Customer Credit
    if (paymentMethod === 'Credit') {
      let customer = await Customer.findOne({ user: req.user.id, customerPhone });
      if (customer) {
        customer.outstandingBalance = Math.round((customer.outstandingBalance + creditTabAmount) * 100) / 100;
        if (!customer.customerName) customer.customerName = customerName;
        await customer.save();
      } else {
        await Customer.create([{
          user: req.user.id,
          customerName,
          customerPhone,
          outstandingBalance: Math.round(creditTabAmount * 100) / 100
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
    res.setHeader('Cache-Control', 'private, max-age=10');
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

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .sort({ saleDate: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      Sale.countDocuments(query)
    ]);

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

// @desc    Export Single Sale Receipt Invoice as PDF
// @route   GET /api/sales/:id/pdf
// @access  Private
export const exportInvoicePDF = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale || sale.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Sale not found');
    }

    const user = await User.findById(req.user.id).lean();
    const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : 'Rs. ';

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice_${sale.invoiceNumber || sale._id}.pdf`);
    doc.pipe(res);

    // ===== HEADER BOX =====
    doc.rect(40, 40, 515, 105).fill('#28594E');
    doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text(user?.shopName || 'SockWise Store', 55, 52);
    doc.fontSize(10).font('Helvetica').text(`Tax Invoice / Sale Receipt`, 55, 76);
    
    doc.fontSize(8.5).font('Helvetica').text(`Owner: ${user?.ownerName || user?.name || 'N/A'}`, 55, 94);
    doc.text(`Phone: ${user?.phone || 'N/A'}  |  Email: ${user?.email || 'N/A'}`, 55, 106);
    doc.text(`GSTIN: ${user?.gstNumber || 'N/A'}  |  Address: ${user?.address || 'N/A'}`, 55, 118);

    doc.moveDown(3);
    doc.fillColor('#20242A');

    // ===== INVOICE & CUSTOMER INFO METRICS =====
    const infoY = 160;
    doc.rect(40, infoY, 515, 55).fill('#F6F3EC');
    doc.fillColor('#20242A').fontSize(9.5).font('Helvetica-Bold');
    
    doc.text(`Invoice No: ${sale.invoiceNumber}`, 55, infoY + 12);
    doc.text(`Date: ${new Date(sale.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 230, infoY + 12);
    doc.text(`Payment Method: ${sale.paymentMethod}`, 410, infoY + 12);

    doc.fontSize(9).font('Helvetica');
    doc.text(`Customer Name: ${sale.customerName || 'Walk-in Customer'}`, 55, infoY + 32);
    doc.text(`Customer Phone: ${sale.customerPhone || 'N/A'}`, 230, infoY + 32);
    doc.text(`Payment Status: ${sale.paymentStatus}`, 410, infoY + 32);

    doc.y = infoY + 70;

    // ===== ITEMS TABLE HEADER =====
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#28594E').text('ITEMS BREAKDOWN');
    doc.moveDown(0.4);

    const tableHeaderY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#5B6169');
    doc.text('#', 50, tableHeaderY, { width: 30 });
    doc.text('Product Name', 90, tableHeaderY, { width: 230 });
    doc.text('Qty', 320, tableHeaderY, { width: 40, align: 'center' });
    doc.text('Unit Price', 370, tableHeaderY, { width: 80, align: 'right' });
    doc.text('Total', 460, tableHeaderY, { width: 80, align: 'right' });

    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E6E0D2');
    doc.moveDown(0.3);

    // ITEMS ROWS
    sale.items.forEach((item, idx) => {
      const rowY = doc.y;
      doc.fontSize(8.5).font('Helvetica').fillColor('#20242A');
      doc.text(`${idx + 1}`, 50, rowY, { width: 30 });
      doc.text(`${item.productName}`, 90, rowY, { width: 230 });
      doc.text(`${item.quantity}`, 320, rowY, { width: 40, align: 'center' });
      doc.text(`${currencySymbol}${(item.sellingPrice || 0).toFixed(2)}`, 370, rowY, { width: 80, align: 'right' });
      doc.text(`${currencySymbol}${(item.total || 0).toFixed(2)}`, 460, rowY, { width: 80, align: 'right' });
      doc.moveDown(0.4);
    });

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E6E0D2');
    doc.moveDown(0.8);

    // ===== FINANCIAL SUMMARY BOX =====
    const itemsSubtotal = sale.subtotal || sale.items.reduce((a, b) => a + (b.total || 0), 0);
    const fitting = sale.fittingCharge || (sale.notes?.match(/Fitting Charge:\s*₹?(\d+(?:\.\d+)?)/i)?.[1] ? parseFloat(sale.notes.match(/Fitting Charge:\s*₹?(\d+(?:\.\d+)?)/i)[1]) : 0);
    const discount = sale.discount || 0;
    const gstPct = sale.gstPercent || 0;
    const gstAmt = sale.gstAmount || (gstPct > 0 ? ((itemsSubtotal + fitting - discount) * gstPct) / 100 : 0);
    const advance = sale.advancePayment || 0;

    let summaryHeight = 65;
    if (fitting > 0) summaryHeight += 14;
    if (discount > 0) summaryHeight += 14;
    if (gstPct > 0 || gstAmt > 0) summaryHeight += 14;
    if (sale.paymentMethod === 'Credit') summaryHeight += 16;

    const summaryY = doc.y;
    doc.rect(300, summaryY, 255, summaryHeight).fill('#F6F3EC');
    doc.fillColor('#20242A').fontSize(9).font('Helvetica');

    let currentSumY = summaryY + 10;
    doc.text(`Subtotal:`, 315, currentSumY);
    doc.text(`${currencySymbol}${itemsSubtotal.toFixed(2)}`, 450, currentSumY, { width: 90, align: 'right' });
    currentSumY += 14;

    if (fitting > 0) {
      doc.text(`Fitting Charge:`, 315, currentSumY);
      doc.text(`+ ${currencySymbol}${fitting.toFixed(2)}`, 450, currentSumY, { width: 90, align: 'right' });
      currentSumY += 14;
    }

    if (discount > 0) {
      doc.fillColor('#D32F2F').text(`Discount:`, 315, currentSumY);
      doc.text(`- ${currencySymbol}${discount.toFixed(2)}`, 450, currentSumY, { width: 90, align: 'right' });
      currentSumY += 14;
      doc.fillColor('#20242A');
    }

    if (gstPct > 0 || gstAmt > 0) {
      doc.text(`GST (${gstPct}%):`, 315, currentSumY);
      doc.text(`+ ${currencySymbol}${gstAmt.toFixed(2)}`, 450, currentSumY, { width: 90, align: 'right' });
      currentSumY += 14;
    }

    doc.fillColor('#28594E').fontSize(11).font('Helvetica-Bold');
    doc.text(`Grand Total:`, 315, currentSumY);
    doc.text(`${currencySymbol}${sale.total.toFixed(2)}`, 450, currentSumY, { width: 90, align: 'right' });
    currentSumY += 16;

    if (sale.paymentMethod === 'Credit') {
      doc.fillColor('#20242A').fontSize(8.5).font('Helvetica');
      doc.text(`Advance Paid: ${currencySymbol}${advance.toFixed(2)}`, 315, currentSumY);
      doc.text(`Pending Balance: ${currencySymbol}${Math.max(sale.total - advance, 0).toFixed(2)}`, 430, currentSumY, { width: 110, align: 'right' });
    }

    // ===== FOOTER =====
    doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#5B6169');
    doc.text('Thank you for your business!', 40, 740, { align: 'center' });
    doc.text('SockWise POS System • Automatically Generated Invoice', 40, 752, { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
