import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Expense from '../models/Expense.js';
import Customer from '../models/Customer.js';

// @desc    Export database
// @route   GET /api/backup/export
// @access  Private
export const exportDatabase = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const products = await Product.find({ user: userId }).select('-__v -user -createdAt -updatedAt');
    const sales = await Sale.find({ user: userId }).select('-__v -user -createdAt -updatedAt');
    const expenses = await Expense.find({ user: userId }).select('-__v -user -createdAt -updatedAt');
    const customers = await Customer.find({ user: userId }).select('-__v -user -createdAt -updatedAt');

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      shopName: req.user.shopName,
      data: {
        products,
        sales,
        expenses,
        customers
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=SockWise_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    next(error);
  }
};

// @desc    Import database
// @route   POST /api/backup/import
// @access  Private
export const importDatabase = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { backup } = req.body;

    if (!backup || !backup.version || !backup.data) {
      res.status(400);
      throw new Error('Invalid backup file format');
    }

    const { products = [], sales = [], expenses = [], customers = [] } = backup.data;

    // Optional: We can wipe existing data or just merge. Standard import usually wipes to restore exactly.
    // Given it's a backup restore, we should wipe current data for this user.
    await Product.deleteMany({ user: userId });
    await Sale.deleteMany({ user: userId });
    await Expense.deleteMany({ user: userId });
    await Customer.deleteMany({ user: userId });

    // Prepare data with current user ID, ignore old _id if we want, or keep _id.
    // Keeping _id maintains relationships!
    const addUserId = (arr) => arr.map(item => ({ ...item, user: userId }));

    if (products.length > 0) await Product.insertMany(addUserId(products));
    if (sales.length > 0) await Sale.insertMany(addUserId(sales));
    if (expenses.length > 0) await Expense.insertMany(addUserId(expenses));
    if (customers.length > 0) await Customer.insertMany(addUserId(customers));

    res.json({ message: 'Database restored successfully' });
  } catch (error) {
    next(error);
  }
};
