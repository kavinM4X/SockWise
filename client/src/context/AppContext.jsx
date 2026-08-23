import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import productService from '../services/productService';
import saleService from '../services/saleService';
import expenseService from '../services/expenseService';
import reportService from '../services/reportService';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [expenses, setExpenses] = useState([]);

  const loadProducts = async () => {
    if (!currentUser) return;
    try {
      const [data, lowStockData, salesData, expenseData, stats] = await Promise.all([
        productService.getProducts({ limit: 1000 }),
        productService.getLowStock(),
        saleService.getSales({ limit: 1000 }),
        expenseService.getExpenses({ limit: 1000 }),
        reportService.getDashboard(),
      ]);

      setProducts(data?.products || []);
      setLowStockProducts(lowStockData || []);
      setSales(salesData?.sales || []);
      setExpenses(expenseData?.expenses || []);
      setDashboardStats(stats);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentUser]);

  const login = async (phone, password) => {
    try {
      if (phone.length < 10 || password.length < 3) return false;
      const data = await authService.login({ phone, password });
      setCurrentUser(data);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (name, phone, email, password, confirm) => {
    try {
      if (!name || phone.length < 10 || password.length < 3 || password !== confirm) return false;
      const data = await authService.register({ name, phone, email, password });
      setCurrentUser(data);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const data = await authService.updateProfile(profileData);
      setCurrentUser(data);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return false;
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      await authService.updatePassword(passwordData);
      toast.success('Password updated successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
      return false;
    }
  };

  const addStock = async (product) => {
    try {
      const newProduct = await productService.createProduct(product);
      setProducts([newProduct, ...products]);
      toast.success('Product added to inventory');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
      return false;
    }
  };

  const updateStock = async (id, productData) => {
    try {
      const updatedProduct = await productService.updateProduct(id, productData);
      setProducts(products.map(p => p._id === id ? updatedProduct : p));
      toast.success('Product updated');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product');
      return false;
    }
  };

  const deleteStock = async (id) => {
    try {
      await productService.deleteProduct(id);
      setProducts(products.filter(p => p._id !== id));
      toast.success('Product deleted');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
      return false;
    }
  };

  const submitSale = async (sale) => {
    try {
      const newSale = await saleService.createSale(sale);
      setSales([newSale, ...sales]);
      toast.success(`Sale recorded — Invoice ${newSale.invoiceNumber}`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit sale');
      return false;
    }
  };

  const deleteSaleData = async (id) => {
    try {
      await saleService.deleteSale(id);
      setSales(sales.filter(s => s._id !== id));
      toast.success('Sale deleted & stock restored');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete sale');
      return false;
    }
  };

  const addExpenseData = async (expense) => {
    try {
      const newExpense = await expenseService.createExpense(expense);
      setExpenses([newExpense, ...expenses]);
      toast.success('Expense logged');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to log expense');
      return false;
    }
  };

  const updateExpenseData = async (id, expenseData) => {
    try {
      const updatedExpense = await expenseService.updateExpense(id, expenseData);
      setExpenses(expenses.map(e => e._id === id ? updatedExpense : e));
      toast.success('Expense updated');
      loadProducts();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update expense');
      return false;
    }
  };

  const deleteExpenseData = async (id) => {
    try {
      await expenseService.deleteExpense(id);
      setExpenses(expenses.filter(e => e._id !== id));
      toast.success('Expense deleted');
      loadProducts();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
      return false;
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    products,
    lowStockProducts,
    addStock,
    updateStock,
    deleteStock,
    loadProducts,
    sales,
    submitSale,
    deleteSaleData,
    dashboardStats,
    expenses,
    addExpenseData,
    updateExpenseData,
    deleteExpenseData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
