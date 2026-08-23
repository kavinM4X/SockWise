import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Expense from '../models/Expense.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';

// ---------------------------------------------------------
// Helper Functions for Aggregations
// ---------------------------------------------------------

const getDateBoundaries = (range) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  let end = new Date(today);
  end.setHours(23, 59, 59, 999);

  if (range === 'weekly') {
    start.setDate(today.getDate() - today.getDay());
  } else if (range === 'monthly') {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (range === 'yearly') {
    start = new Date(today.getFullYear(), 0, 1);
  }
  return { start, end };
};

const getSalesAgg = async (userId, start, end) => {
  const match = { user: new mongoose.Types.ObjectId(userId) };
  if (start && end) {
    match.saleDate = { $gte: start, $lte: end };
  }
  const agg = await Sale.aggregate([
    { $match: match },
    { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalProfit: { $sum: '$totalProfit' }, count: { $sum: 1 } } }
  ]);
  return agg[0] || { totalRevenue: 0, totalProfit: 0, count: 0 };
};

const getExpenseAgg = async (userId, start, end) => {
  const match = { user: new mongoose.Types.ObjectId(userId) };
  if (start && end) {
    match.expenseDate = { $gte: start, $lte: end };
  }
  const agg = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
  ]);
  return agg[0] ? agg[0].totalAmount : 0;
};

// ---------------------------------------------------------
// Unified Dashboard
// ---------------------------------------------------------

// @desc    Get Unified Dashboard Response
// @route   GET /api/reports/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const uidObj = new mongoose.Types.ObjectId(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { start: weekStart } = getDateBoundaries('weekly');
    const { start: monthStart } = getDateBoundaries('monthly');
    const { start: yearStart } = getDateBoundaries('yearly');

    const [
      productsAgg,
      lowStockCount,
      outOfStockCount,
      allTimeSales,
      todaySales,
      weeklySales,
      monthlySales,
      yearlySales,
      allTimeExpenses,
      todayExpenses,
      monthlyExpenses,
      customerAgg,
      topCustomer,
      topExpenseCat,
      topProduct
    ] = await Promise.all([
      // Inventory
      Product.aggregate([
        { $match: { user: uidObj } },
        { $group: { _id: null, totalProducts: { $sum: 1 }, totalStock: { $sum: '$stockQuantity' } } }
      ]),
      Product.countDocuments({ user: userId, $expr: { $lte: ['$stockQuantity', '$minimumStock'] }, stockQuantity: { $gt: 0 } }),
      Product.countDocuments({ user: userId, stockQuantity: 0 }),
      // Sales
      getSalesAgg(userId),
      getSalesAgg(userId, today, new Date()),
      getSalesAgg(userId, weekStart, new Date()),
      getSalesAgg(userId, monthStart, new Date()),
      getSalesAgg(userId, yearStart, new Date()),
      // Expenses
      getExpenseAgg(userId),
      getExpenseAgg(userId, today, new Date()),
      getExpenseAgg(userId, monthStart, new Date()),
      // Customers
      Customer.aggregate([
        { $match: { user: uidObj } },
        { $group: { _id: null, totalCustomers: { $sum: 1 }, pendingCredit: { $sum: '$outstandingBalance' } } }
      ]),
      Customer.findOne({ user: userId }).sort({ outstandingBalance: -1 }).limit(1),
      // Highest Expense Category
      Expense.aggregate([
        { $match: { user: uidObj } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 1 }
      ]),
      // Best Selling Product
      Sale.aggregate([
        { $match: { user: uidObj } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName', qty: { $sum: '$items.quantity' } } },
        { $sort: { qty: -1 } },
        { $limit: 1 }
      ])
    ]);

    const inventoryData = productsAgg[0] || { totalProducts: 0, totalStock: 0 };
    const customerData = customerAgg[0] || { totalCustomers: 0, pendingCredit: 0 };

    res.json({
      inventory: {
        totalProducts: inventoryData.totalProducts,
        totalStock: inventoryData.totalStock,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      },
      sales: {
        todaySales: todaySales.totalRevenue,
        weeklySales: weeklySales.totalRevenue,
        monthlySales: monthlySales.totalRevenue,
        yearlySales: yearlySales.totalRevenue
      },
      revenue: {
        monthlyRevenue: monthlySales.totalRevenue,
        monthlyProfit: monthlySales.totalProfit,
        totalRevenue: allTimeSales.totalRevenue,
        netProfit: allTimeSales.totalProfit - allTimeExpenses
      },
      expenses: {
        todayExpenses,
        monthlyExpenses,
        totalExpenses: allTimeExpenses
      },
      customers: {
        totalCustomers: customerData.totalCustomers,
        pendingCredit: customerData.pendingCredit,
        topCustomer: topCustomer ? topCustomer.customerName : 'N/A'
      },
      business: {
        averageOrderValue: allTimeSales.count > 0 ? allTimeSales.totalRevenue / allTimeSales.count : 0,
        totalOrders: allTimeSales.count,
        bestSellingProduct: topProduct[0] ? topProduct[0]._id : 'N/A',
        highestExpenseCategory: topExpenseCat[0] ? topExpenseCat[0]._id : 'N/A'
      }
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// Time-based Metrics
// ---------------------------------------------------------

export const getWeekly = async (req, res, next) => {
  try {
    const { start, end } = getDateBoundaries('weekly');
    const [sales, expenses] = await Promise.all([
      getSalesAgg(req.user.id, start, end),
      getExpenseAgg(req.user.id, start, end)
    ]);
    res.json({ start, end, revenue: sales.totalRevenue, profit: sales.totalProfit, expenses });
  } catch (error) { next(error); }
};

export const getMonthly = async (req, res, next) => {
  try {
    const { start, end } = getDateBoundaries('monthly');
    const [sales, expenses] = await Promise.all([
      getSalesAgg(req.user.id, start, end),
      getExpenseAgg(req.user.id, start, end)
    ]);
    res.json({ start, end, revenue: sales.totalRevenue, profit: sales.totalProfit, expenses });
  } catch (error) { next(error); }
};

export const getYearly = async (req, res, next) => {
  try {
    const { start, end } = getDateBoundaries('yearly');
    const [sales, expenses] = await Promise.all([
      getSalesAgg(req.user.id, start, end),
      getExpenseAgg(req.user.id, start, end)
    ]);
    res.json({ start, end, revenue: sales.totalRevenue, profit: sales.totalProfit, expenses });
  } catch (error) { next(error); }
};

export const getCustom = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: 'Provide startDate and endDate' });
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const [sales, expenses] = await Promise.all([
      getSalesAgg(req.user.id, start, end),
      getExpenseAgg(req.user.id, start, end)
    ]);
    res.json({ start, end, revenue: sales.totalRevenue, profit: sales.totalProfit, expenses });
  } catch (error) { next(error); }
};

// ---------------------------------------------------------
// Specific Analytics
// ---------------------------------------------------------

export const getTopProducts = async (req, res, next) => {
  try {
    const top = await Sale.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productName', qtySold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { qtySold: -1 } },
      { $limit: 10 }
    ]);
    res.json(top);
  } catch (error) { next(error); }
};

export const getTopCustomers = async (req, res, next) => {
  try {
    const top = await Sale.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), customerName: { $ne: null } } },
      { $group: { _id: '$customerName', totalSpent: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);
    res.json(top);
  } catch (error) { next(error); }
};

export const getPaymentSummary = async (req, res, next) => {
  try {
    const summary = await Sale.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);
    res.json(summary);
  } catch (error) { next(error); }
};

export const getProfitLoss = async (req, res, next) => {
  try {
    const sales = await getSalesAgg(req.user.id);
    const expenses = await getExpenseAgg(req.user.id);
    res.json({
      totalRevenue: sales.totalRevenue,
      totalExpenses: expenses,
      grossProfit: sales.totalProfit,
      netProfit: sales.totalProfit - expenses
    });
  } catch (error) { next(error); }
};

export const getStockSummary = async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$category', totalStock: { $sum: '$stockQuantity' }, value: { $sum: { $multiply: ['$stockQuantity', '$purchasePrice'] } } } }
    ]);
    res.json(summary);
  } catch (error) { next(error); }
};

// ---------------------------------------------------------
// Charts & Datasets
// ---------------------------------------------------------

export const getCharts = async (req, res, next) => {
  try {
    const uidObj = new mongoose.Types.ObjectId(req.user.id);
    const { range } = req.query;
    const today = new Date();
    
    // Monthly Comparison (6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const saleMatch = { user: uidObj };
    const expMatch = { user: uidObj };

    if (range && ['weekly', 'monthly', 'yearly'].includes(range)) {
      const { start, end } = getDateBoundaries(range);
      saleMatch.saleDate = { $gte: start, $lte: end };
      expMatch.expenseDate = { $gte: start, $lte: end };
    }

    const [monthlySalesAgg, monthlyExpAgg, payments, categories] = await Promise.all([
      Sale.aggregate([
        { $match: { user: uidObj, saleDate: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$saleDate' }, month: { $month: '$saleDate' } }, rev: { $sum: '$total' }, profit: { $sum: '$totalProfit' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Expense.aggregate([
        { $match: { user: uidObj, expenseDate: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$expenseDate' }, month: { $month: '$expenseDate' } }, amt: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Sale.aggregate([
        { $match: saleMatch },
        { $group: { _id: '$paymentMethod', total: { $sum: '$total' } } }
      ]),
      Expense.aggregate([
        { $match: expMatch },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ])
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = [];
    const revenueTrend = [];
    const profitTrend = [];
    const expenseTrend = [];

    // Align the months
    let curr = new Date(sixMonthsAgo);
    for (let i = 0; i < 6; i++) {
      const m = curr.getMonth() + 1;
      const y = curr.getFullYear();
      labels.push(`${monthNames[m-1]} ${y}`);
      
      const sMatch = monthlySalesAgg.find(s => s._id.year === y && s._id.month === m);
      revenueTrend.push(sMatch ? sMatch.rev : 0);
      profitTrend.push(sMatch ? sMatch.profit : 0);

      const eMatch = monthlyExpAgg.find(e => e._id.year === y && e._id.month === m);
      expenseTrend.push(eMatch ? eMatch.amt : 0);

      curr.setMonth(curr.getMonth() + 1);
    }

    const paymentLabels = payments.map(p => p._id);
    const paymentData = payments.map(p => p.total);

    const catLabels = categories.map(c => c._id);
    const catData = categories.map(c => c.total);

    res.json({
      lineChart: { labels, revenueTrend, profitTrend, expenseTrend },
      paymentPie: { labels: paymentLabels, data: paymentData },
      categoryDoughnut: { labels: catLabels, data: catData }
    });
  } catch (error) { next(error); }
};

// ---------------------------------------------------------
// Exports
// ---------------------------------------------------------

export const exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user.id };
    if (startDate && endDate) {
      query.saleDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sales = await Sale.find(query).sort({ saleDate: -1 });
    
    const expQuery = { user: req.user.id };
    if (startDate && endDate) {
      expQuery.expenseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const expenses = await Expense.find(expQuery).sort({ expenseDate: -1 });

    let csv = `SockWise Export\nGenerated,${new Date().toLocaleString()}\n\n`;
    
    csv += `--- SALES ---\n`;
    csv += `Date,Invoice,Customer,Method,Total,Profit\n`;
    sales.forEach(s => {
      csv += `"${new Date(s.saleDate).toLocaleDateString()}","${s.invoiceNumber}","${s.customerName || 'Walk-in'}","${s.paymentMethod}",${s.total},${s.totalProfit}\n`;
    });

    csv += `\n--- EXPENSES ---\n`;
    csv += `Date,ID,Category,Title,Method,Amount\n`;
    expenses.forEach(e => {
      csv += `"${new Date(e.expenseDate).toLocaleDateString()}","${e.expenseId}","${e.category}","${e.title}","${e.paymentMethod}",${e.amount}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`sockwise_export_${new Date().getTime()}.csv`);
    return res.send(csv);
  } catch (error) { next(error); }
};

export const exportPDF = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : 'Rs. ';

    const { startDate, endDate } = req.query;
    const startD = startDate ? new Date(startDate) : undefined;
    const endD = endDate ? new Date(endDate) : undefined;

    // Aggregations & Data Retrieval
    const salesAgg = await getSalesAgg(req.user.id, startD, endD);
    const expensesAgg = await getExpenseAgg(req.user.id, startD, endD);

    const saleQuery = { user: req.user.id };
    if (startD && endD) saleQuery.saleDate = { $gte: startD, $lte: endD };
    const salesList = await Sale.find(saleQuery).sort({ saleDate: -1 });

    const expQuery = { user: req.user.id };
    if (startD && endD) expQuery.expenseDate = { $gte: startD, $lte: endD };
    const expensesList = await Expense.find(expQuery).sort({ expenseDate: -1 });

    const productsList = await Product.find({ user: req.user.id }).sort({ productName: 1 });
    const customersList = await Customer.find({ user: req.user.id }).sort({ outstandingBalance: -1 });

    const topProducts = await Sale.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productName', qty: { $sum: '$items.quantity' }, rev: { $sum: '$items.total' } } },
      { $sort: { qty: -1 } },
      { $limit: 10 }
    ]);

    const totalPendingCredit = customersList.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
    const totalStockValuation = productsList.reduce((acc, p) => acc + ((p.stockQuantity || 0) * (p.purchasePrice || 0)), 0);
    const netProfit = salesAgg.totalProfit - expensesAgg;
    const margin = salesAgg.totalRevenue > 0 ? ((netProfit / salesAgg.totalRevenue) * 100).toFixed(1) : 0;

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SockWise_Audit_Report_${Date.now()}.pdf`);
    doc.pipe(res);

    const checkPageBreak = (needed = 40) => {
      if (doc.y + needed > 750) {
        doc.addPage();
      }
    };

    // ===== HEADER BANNER =====
    doc.rect(40, 40, 515, 115).fill('#28594E');
    doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text(user?.shopName || 'SockWise Business Audit', 55, 52);
    doc.fontSize(10).font('Helvetica').text(`Executive Performance & Inventory Audit Report`, 55, 76);
    
    doc.fontSize(8.5).font('Helvetica').text(`Owner: ${user?.ownerName || user?.name || 'N/A'}`, 55, 94);
    doc.text(`Phone: ${user?.phone || 'N/A'}  |  Email: ${user?.email || 'N/A'}`, 55, 106);
    doc.text(`GSTIN / Tax ID: ${user?.gstNumber || 'N/A'}  |  Currency: ${user?.currency || 'INR'} (${currencySymbol})`, 55, 118);
    doc.text(`Address: ${user?.address || 'N/A'}`, 55, 130);

    doc.moveDown(3);
    doc.fillColor('#20242A');

    // ===== SECTION 1: FINANCIAL SUMMARY =====
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#28594E').text('1. FINANCIAL PERFORMANCE SUMMARY');
    doc.moveDown(0.4);

    const summaryBoxY = doc.y;
    doc.rect(40, summaryBoxY, 515, 65).fill('#F6F3EC');
    doc.fillColor('#20242A').fontSize(9.5).font('Helvetica-Bold');
    
    doc.text(`Gross Revenue: ${currencySymbol}${salesAgg.totalRevenue.toFixed(2)}`, 55, summaryBoxY + 12);
    doc.text(`Gross Sales Profit: ${currencySymbol}${salesAgg.totalProfit.toFixed(2)}`, 230, summaryBoxY + 12);
    doc.text(`Total Orders: ${salesAgg.count}`, 410, summaryBoxY + 12);

    doc.text(`Total Expenses: ${currencySymbol}${expensesAgg.toFixed(2)}`, 55, summaryBoxY + 30);
    doc.text(`Net Profit: ${currencySymbol}${netProfit.toFixed(2)} (${margin}%)`, 230, summaryBoxY + 30);
    doc.text(`Credit Tab Pending: ${currencySymbol}${totalPendingCredit.toFixed(2)}`, 410, summaryBoxY + 30);

    doc.text(`Total Stock Valuation: ${currencySymbol}${totalStockValuation.toFixed(2)}`, 55, summaryBoxY + 48);

    doc.y = summaryBoxY + 80;

    // ===== SECTION 2: TOP SELLING PRODUCTS LEADERBOARD =====
    checkPageBreak(80);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#28594E').text('2. TOP SELLING PRODUCTS LEADERBOARD');
    doc.moveDown(0.4);

    if (topProducts.length === 0) {
      doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#5B6169').text('No product sales recorded yet.');
      doc.moveDown(0.8);
    } else {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#5B6169');
      doc.text('Rank', 50, doc.y, { width: 30 });
      doc.text('Product Name', 90, doc.y - 11, { width: 260 });
      doc.text('Units Sold', 360, doc.y - 11, { width: 80, align: 'right' });
      doc.text('Total Revenue', 450, doc.y - 11, { width: 90, align: 'right' });
      
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E6E0D2');
      doc.moveDown(0.3);

      topProducts.forEach((p, idx) => {
        checkPageBreak(20);
        doc.fontSize(8.5).font('Helvetica').fillColor('#20242A');
        doc.text(`#${idx + 1}`, 50, doc.y, { width: 30 });
        doc.text(p._id || 'Product', 90, doc.y - 10, { width: 260 });
        doc.text(`${p.qty}`, 360, doc.y - 10, { width: 80, align: 'right' });
        doc.text(`${currencySymbol}${p.rev.toFixed(2)}`, 450, doc.y - 10, { width: 90, align: 'right' });
        doc.moveDown(0.4);
      });
      doc.moveDown(0.8);
    }

    // ===== SECTION 3: INVENTORY & CURRENT STOCK AUDIT =====
    checkPageBreak(100);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#28594E').text('3. CURRENT STOCK & INVENTORY AUDIT');
    doc.moveDown(0.4);

    if (productsList.length === 0) {
      doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#5B6169').text('No inventory items in stock catalog.');
      doc.moveDown(0.8);
    } else {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#5B6169');
      doc.text('SKU ID', 45, doc.y, { width: 65 });
      doc.text('Product Name', 115, doc.y - 11, { width: 170 });
      doc.text('Qty', 290, doc.y - 11, { width: 45, align: 'right' });
      doc.text('Min', 340, doc.y - 11, { width: 40, align: 'right' });
      doc.text('Price', 385, doc.y - 11, { width: 70, align: 'right' });
      doc.text('Status', 460, doc.y - 11, { width: 80, align: 'right' });
      
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E6E0D2');
      doc.moveDown(0.3);

      productsList.forEach(p => {
        checkPageBreak(20);
        const isLow = p.stockQuantity <= p.minimumStock;
        const status = p.stockQuantity === 0 ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY';
        const statusColor = p.stockQuantity === 0 ? '#B84A38' : isLow ? '#DB7B2B' : '#3E7D56';

        doc.fontSize(8.5).font('Helvetica').fillColor('#20242A');
        doc.text(p.productId || 'N/A', 45, doc.y, { width: 65 });
        doc.text(p.productName, 115, doc.y - 10, { width: 170 });
        doc.text(`${p.stockQuantity}`, 290, doc.y - 10, { width: 45, align: 'right' });
        doc.text(`${p.minimumStock}`, 340, doc.y - 10, { width: 40, align: 'right' });
        doc.text(`${currencySymbol}${p.sellingPrice.toFixed(2)}`, 385, doc.y - 10, { width: 70, align: 'right' });
        doc.fillColor(statusColor).font('Helvetica-Bold').text(status, 460, doc.y - 10, { width: 80, align: 'right' });
        doc.moveDown(0.4);
      });
      doc.moveDown(0.8);
    }

    // ===== SECTION 4: DETAILED DAILY SALES TRANSACTIONS =====
    checkPageBreak(100);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#28594E').text('4. DAILY SALES TRANSACTIONS LOG');
    doc.moveDown(0.4);

    if (salesList.length === 0) {
      doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#5B6169').text('No sales transaction records found.');
      doc.moveDown(0.8);
    } else {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#5B6169');
      doc.text('Date', 45, doc.y, { width: 65 });
      doc.text('Invoice #', 115, doc.y - 11, { width: 95 });
      doc.text('Customer', 215, doc.y - 11, { width: 110 });
      doc.text('Method', 330, doc.y - 11, { width: 65 });
      doc.text('Status', 400, doc.y - 11, { width: 60 });
      doc.text('Total Bill', 465, doc.y - 11, { width: 80, align: 'right' });
      
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E6E0D2');
      doc.moveDown(0.3);

      salesList.forEach(s => {
        checkPageBreak(22);
        const dateStr = new Date(s.saleDate).toLocaleDateString();
        doc.fontSize(8.5).font('Helvetica').fillColor('#20242A');
        doc.text(dateStr, 45, doc.y, { width: 65 });
        doc.text(s.invoiceNumber, 115, doc.y - 10, { width: 95 });
        doc.text(s.customerName || 'Walk-in', 215, doc.y - 10, { width: 110 });
        doc.text(s.paymentMethod, 330, doc.y - 10, { width: 65 });
        
        const statColor = s.paymentStatus === 'Paid' ? '#3E7D56' : '#DB7B2B';
        doc.fillColor(statColor).font('Helvetica-Bold').text(s.paymentStatus, 400, doc.y - 10, { width: 60 });
        
        doc.fillColor('#20242A').font('Helvetica-Bold').text(`${currencySymbol}${s.total.toFixed(2)}`, 465, doc.y - 10, { width: 80, align: 'right' });
        doc.moveDown(0.4);
      });
      doc.moveDown(0.8);
    }

    // ===== SECTION 5: EXPENSE TRANSACTIONS LOG =====
    checkPageBreak(100);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#28594E').text('5. OPERATING EXPENSES LOG');
    doc.moveDown(0.4);

    if (expensesList.length === 0) {
      doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#5B6169').text('No expense transaction records found.');
    } else {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#5B6169');
      doc.text('Date', 45, doc.y, { width: 65 });
      doc.text('Category', 115, doc.y - 11, { width: 110 });
      doc.text('Voucher Title', 230, doc.y - 11, { width: 160 });
      doc.text('Method', 395, doc.y - 11, { width: 65 });
      doc.text('Amount', 465, doc.y - 11, { width: 80, align: 'right' });
      
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#E6E0D2');
      doc.moveDown(0.3);

      expensesList.forEach(e => {
        checkPageBreak(22);
        const dateStr = new Date(e.expenseDate || e.createdAt).toLocaleDateString();
        doc.fontSize(8.5).font('Helvetica').fillColor('#20242A');
        doc.text(dateStr, 45, doc.y, { width: 65 });
        doc.text(e.category, 115, doc.y - 10, { width: 110 });
        doc.text(e.title, 230, doc.y - 10, { width: 160 });
        doc.text(e.paymentMethod, 395, doc.y - 10, { width: 65 });
        doc.fillColor('#B84A38').font('Helvetica-Bold').text(`${currencySymbol}${e.amount.toFixed(2)}`, 465, doc.y - 10, { width: 80, align: 'right' });
        doc.moveDown(0.4);
      });
    }

    // ===== FOOTER ON ALL PAGES =====
    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(40, 795).lineTo(555, 795).stroke('#E6E0D2');
      doc.fontSize(8).font('Helvetica').fillColor('#5B6169').text(
        `Generated on ${new Date().toLocaleString()}  •  Page ${i + 1} of ${pageRange.count}  •  SockWise Automated Business Audit System`,
        40,
        802,
        { align: 'center', width: 515 }
      );
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};
