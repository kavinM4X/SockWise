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

// Download / Export Invoice PDF
const exportInvoicePDF = async (id, invoiceNumber) => {
  const response = await axiosInstance.get(`/sales/${id}/pdf`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Invoice_${invoiceNumber || id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const saleService = {
  getSales,
  createSale,
  updateSale,
  deleteSale,
  getDashboardSummary,
  exportInvoicePDF,
};

export default saleService;
