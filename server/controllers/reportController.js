import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Expense from '../models/Expense.js';
import Customer from '../models/Customer.js';
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
    const sales = await getSalesAgg(req.user.id, start, end);
    const expenses = await getExpenseAgg(req.user.id, start, end);
    res.json({ start, end, revenue: sales.totalRevenue, profit: sales.totalProfit, expenses });
  } catch (error) { next(error); }
};

export const getMonthly = async (req, res, next) => {
  try {
    const { start, end } = getDateBoundaries('monthly');
    const sales = await getSalesAgg(req.user.id, start, end);
    const expenses = await getExpenseAgg(req.user.id, start, end);
    res.json({ start, end, revenue: sales.totalRevenue, profit: sales.totalProfit, expenses });
  } catch (error) { next(error); }
};

export const getYearly = async (req, res, next) => {
  try {
    const { start, end } = getDateBoundaries('yearly');
    const sales = await getSalesAgg(req.user.id, start, end);
    const expenses = await getExpenseAgg(req.user.id, start, end);
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
    
    const sales = await getSalesAgg(req.user.id, start, end);
    const expenses = await getExpenseAgg(req.user.id, start, end);
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

    const monthlySalesAgg = await Sale.aggregate([
      { $match: { user: uidObj, saleDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$saleDate' }, month: { $month: '$saleDate' } }, rev: { $sum: '$total' }, profit: { $sum: '$totalProfit' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const monthlyExpAgg = await Expense.aggregate([
      { $match: { user: uidObj, expenseDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$expenseDate' }, month: { $month: '$expenseDate' } }, amt: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
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

    // Payment Methods & Category filter match
    const saleMatch = { user: uidObj };
    const expMatch = { user: uidObj };

    if (range && ['weekly', 'monthly', 'yearly'].includes(range)) {
      const { start, end } = getDateBoundaries(range);
      saleMatch.saleDate = { $gte: start, $lte: end };
      expMatch.expenseDate = { $gte: start, $lte: end };
    }

    // Payment Methods
    const payments = await Sale.aggregate([
      { $match: saleMatch },
      { $group: { _id: '$paymentMethod', total: { $sum: '$total' } } }
    ]);
    const paymentLabels = payments.map(p => p._id);
    const paymentData = payments.map(p => p.total);

    // Categories
    const categories = await Expense.aggregate([
      { $match: expMatch },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);
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
    const { startDate, endDate } = req.query;
    let title = 'Business Report';
    if (startDate && endDate) {
      title += ` (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()})`;
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sockwise_report_${new Date().getTime()}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('SockWise', { align: 'center' });
    doc.fontSize(12).text(title, { align: 'center' });
    doc.moveDown(2);

    // Fetch quick stats
    const startD = startDate ? new Date(startDate) : undefined;
    const endD = endDate ? new Date(endDate) : undefined;
    
    const sales = await getSalesAgg(req.user.id, startD, endD);
    const expenses = await getExpenseAgg(req.user.id, startD, endD);

    // Summary Box
    doc.fontSize(16).text('Financial Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Revenue: Rs. ${sales.totalRevenue.toFixed(2)}`);
    doc.text(`Total Gross Profit: Rs. ${sales.totalProfit.toFixed(2)}`);
    doc.text(`Total Expenses: Rs. ${expenses.toFixed(2)}`);
    doc.text(`Net Profit: Rs. ${(sales.totalProfit - expenses).toFixed(2)}`);
    doc.text(`Total Orders: ${sales.count}`);
    doc.moveDown(2);

    // Top Products
    doc.fontSize(16).text('Top Products', { underline: true });
    doc.moveDown(0.5);
    
    const topProducts = await Sale.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productName', qty: { $sum: '$items.quantity' } } },
      { $sort: { qty: -1 } },
      { $limit: 5 }
    ]);

    if (topProducts.length === 0) {
      doc.fontSize(12).text('No products sold.');
    } else {
      topProducts.forEach((p, i) => {
        doc.fontSize(12).text(`${i + 1}. ${p._id} - ${p.qty} sold`);
      });
    }
    doc.moveDown(2);

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(10).text(
        `Generated on ${new Date().toLocaleString()} - Page ${i + 1} of ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};
