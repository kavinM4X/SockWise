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
    const response = await axiosInstance.get('/reports/export/pdf', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SockWise_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF Export Error:', error);
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token || '';
    if (token) {
      window.open(`/api/reports/export/pdf?token=${token}`);
    } else {
      toast.error('Session expired. Please log in again.');
    }
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
