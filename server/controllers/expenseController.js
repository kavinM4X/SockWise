import mongoose from 'mongoose';
import Expense from '../models/Expense.js';

// Helper: Generate Expense ID (EXP-YYYYMMDD-XXXX)
const generateExpenseId = async (userId) => {
  const date = new Date();
  const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `EXP-${dateString}-`;

  const lastExpense = await Expense.findOne({
    user: userId,
    expenseId: { $regex: `^${prefix}` }
  }).sort({ expenseId: -1 });

  if (lastExpense && lastExpense.expenseId) {
    const lastSequence = parseInt(lastExpense.expenseId.split('-')[2], 10);
    const nextSequence = String(lastSequence + 1).padStart(4, '0');
    return `${prefix}${nextSequence}`;
  } else {
    return `${prefix}0001`;
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { title, category, description, amount, paymentMethod, expenseDate, receiptImage } = req.body;

    if (!title || !category || !amount || !paymentMethod) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    const expenseId = await generateExpenseId(req.user._id);

    const expense = await Expense.create({
      user: req.user._id,
      createdBy: req.user._id,
      expenseId,
      title,
      category,
      description,
      amount,
      paymentMethod,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      receiptImage,
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'private, max-age=10');
    const { search, category, paymentMethod, startDate, endDate, page = 1, limit = 10 } = req.query;

    let query = { user: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (category && category !== 'All') query.category = category;
    if (paymentMethod && paymentMethod !== 'All') query.paymentMethod = paymentMethod;

    if (startDate && endDate) {
      query.expenseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.expenseDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.expenseDate = { $lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ expenseDate: -1, createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      Expense.countDocuments(query)
    ]);

    res.json({
      expenses,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Expense not found');
    }

    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Expense not found');
    }

    const { title, category, description, amount, paymentMethod, expenseDate, receiptImage } = req.body;

    if (title) expense.title = title;
    if (category) expense.category = category;
    if (description !== undefined) expense.description = description;
    if (amount) expense.amount = amount;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (expenseDate) expense.expenseDate = new Date(expenseDate);
    if (receiptImage !== undefined) expense.receiptImage = receiptImage;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense || expense.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Expense not found');
    }

    await expense.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard summary
// @route   GET /api/expenses/dashboard
// @access  Private
export const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const expensesAgg = await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          todayExpenses: {
            $sum: { $cond: [{ $gte: ['$expenseDate', today] }, '$amount', 0] },
          },
          weeklyExpenses: {
            $sum: { $cond: [{ $gte: ['$expenseDate', firstDayOfWeek] }, '$amount', 0] },
          },
          monthlyExpenses: {
            $sum: { $cond: [{ $gte: ['$expenseDate', firstDayOfMonth] }, '$amount', 0] },
          },
        },
      },
    ]);

    const stats = expensesAgg[0] || {
      totalCount: 0,
      todayExpenses: 0,
      weeklyExpenses: 0,
      monthlyExpenses: 0,
    };

    // Find Highest Category
    const categoryAgg = await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    const highestCategory = categoryAgg[0] ? categoryAgg[0]._id : 'N/A';

    res.json({
      ...stats,
      highestCategory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category summary (For Pie Chart)
// @route   GET /api/expenses/category-summary
// @access  Private
export const getCategorySummary = async (req, res, next) => {
  try {
    const categories = await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);
    res.json(categories.map(c => ({ category: c._id, total: c.total })));
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly trends (For Line Chart)
// @route   GET /api/expenses/monthly
// @access  Private
export const getMonthlyTrends = async (req, res, next) => {
  try {
    // 6 months trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trends = await Expense.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(req.user._id),
          expenseDate: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { year: { $year: '$expenseDate' }, month: { $month: '$expenseDate' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format output
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formatted = trends.map(t => ({
      month: `${monthNames[t._id.month - 1]} ${t._id.year}`,
      total: t.total
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};
