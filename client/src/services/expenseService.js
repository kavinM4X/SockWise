import axiosInstance from '../utils/axiosInstance';

const getExpenses = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/expenses?${query}`);
  return response.data;
};

const createExpense = async (expenseData) => {
  const response = await axiosInstance.post('/expenses', expenseData);
  return response.data;
};

const updateExpense = async (id, expenseData) => {
  const response = await axiosInstance.put(`/expenses/${id}`, expenseData);
  return response.data;
};

const deleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/expenses/${id}`);
  return response.data;
};

const getDashboardSummary = async () => {
  const response = await axiosInstance.get('/expenses/dashboard');
  return response.data;
};

const getCategorySummary = async () => {
  const response = await axiosInstance.get('/expenses/category-summary');
  return response.data;
};

const getMonthlyTrends = async () => {
  const response = await axiosInstance.get('/expenses/monthly');
  return response.data;
};

const expenseService = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getDashboardSummary,
  getCategorySummary,
  getMonthlyTrends,
};

export default expenseService;
