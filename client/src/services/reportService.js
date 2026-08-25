import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

const getDashboard = async () => {
  const response = await axiosInstance.get('/reports/dashboard');
  return response.data;
};

const getWeekly = async () => {
  const response = await axiosInstance.get('/reports/weekly');
  return response.data;
};

const getMonthly = async () => {
  const response = await axiosInstance.get('/reports/monthly');
  return response.data;
};

const getYearly = async () => {
  const response = await axiosInstance.get('/reports/yearly');
  return response.data;
};

const getCustom = async (startDate, endDate) => {
  const response = await axiosInstance.get(`/reports/custom?startDate=${startDate}&endDate=${endDate}`);
  return response.data;
};

const getCharts = async (range = 'monthly') => {
  const response = await axiosInstance.get(`/reports/charts?range=${range}`);
  return response.data;
};

const getTopProducts = async () => {
  const response = await axiosInstance.get('/reports/top-products');
  return response.data;
};

const getTopCustomers = async () => {
  const response = await axiosInstance.get('/reports/top-customers');
  return response.data;
};

const getPaymentSummary = async () => {
  const response = await axiosInstance.get('/reports/payment-summary');
  return response.data;
};

const getProfitLoss = async () => {
  const response = await axiosInstance.get('/reports/profit-loss');
  return response.data;
};

const getStockSummary = async () => {
  const response = await axiosInstance.get('/reports/stock-summary');
  return response.data;
};

const exportPDF = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token || '';
    if (!token) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    const baseURL = axiosInstance.defaults.baseURL || '/api';
    const cleanBaseURL = baseURL.replace(/\/+$/, '');
    const exportUrl = `${cleanBaseURL}/reports/export/pdf?token=${encodeURIComponent(token)}`;

    // Direct HTTP/HTTPS download link (supported across desktop and mobile browsers)
    const link = document.createElement('a');
    link.href = exportUrl;
    link.target = '_blank';
    link.download = `SockWise_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('PDF Export Error:', error);
    toast.error('Failed to download PDF report');
  }
};

const reportService = {
  getDashboard,
  getWeekly,
  getMonthly,
  getYearly,
  getCustom,
  getTopProducts,
  getTopCustomers,
  getPaymentSummary,
  getProfitLoss,
  getStockSummary,
  exportPDF,
  getCharts
};

export default reportService;
