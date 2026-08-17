import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import mongoose from 'mongoose';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    let query = { user: req.user.id };

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const customers = await Customer.find(query)
      .sort(sort)
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer || customer.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Customer not found');
    }

    res.json(customer);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer || customer.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Customer not found');
    }

    const { customerName, customerPhone, outstandingBalance, notes } = req.body;

    if (customerName) customer.customerName = customerName;
    if (customerPhone) customer.customerPhone = customerPhone;
    if (outstandingBalance !== undefined) customer.outstandingBalance = outstandingBalance;
    if (notes !== undefined) customer.notes = notes;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer || customer.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Customer not found');
    }

    await customer.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Collect Payment
// @route   POST /api/customers/collect-payment
// @access  Private
export const collectPayment = async (req, res, next) => {
  try {
    const { customerId, amount } = req.body;
    
    if (!customerId || !amount || amount <= 0) {
      res.status(400);
      throw new Error('Invalid payment request');
    }

    const customer = await Customer.findById(customerId);

    if (!customer || customer.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Customer not found');
    }

    customer.outstandingBalance -= amount;
    const updatedCustomer = await customer.save();
    
    res.json(updatedCustomer);
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer purchase history
// @route   GET /api/customers/history/:phone
// @access  Private
export const getCustomerHistory = async (req, res, next) => {
  try {
    const phone = req.params.phone;
    const sales = await Sale.find({ user: req.user.id, customerPhone: phone })
      .sort({ saleDate: -1 });

    res.json(sales);
  } catch (error) {
    next(error);
  }
};
