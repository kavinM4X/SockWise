import axiosInstance from '../utils/axiosInstance';

// Get all sales
const getSales = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/sales?${query}`);
  return response.data;
};

// Create sale
const createSale = async (saleData) => {
  const response = await axiosInstance.post('/sales', saleData);
  return response.data;
};

// Update sale (status/notes)
const updateSale = async (id, saleData) => {
  const response = await axiosInstance.put(`/sales/${id}`, saleData);
  return response.data;
};

// Delete sale
const deleteSale = async (id) => {
  const response = await axiosInstance.delete(`/sales/${id}`);
  return response.data;
};

// Get Dashboard stats
const getDashboardSummary = async () => {
  const response = await axiosInstance.get('/sales/dashboard');
  return response.data;
};

const saleService = {
  getSales,
  createSale,
  updateSale,
  deleteSale,
  getDashboardSummary,
};

export default saleService;
