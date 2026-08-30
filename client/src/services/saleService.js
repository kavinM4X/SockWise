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

// Download / Export Invoice PDF (Supports Web Share & Direct HTTPS PDF Viewer)
const exportInvoicePDF = async (id, invoiceNumber) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = user.token || '';
  
  const baseURL = axiosInstance.defaults.baseURL.replace(/\/+$/, '');
  const pdfUrl = `${baseURL}/sales/${id}/pdf?token=${token}`;

  // 1. Try Native Web Share API if supported by mobile device
  if (navigator.share && navigator.canShare) {
    try {
      const response = await axiosInstance.get(`/sales/${id}/pdf`, { responseType: 'blob' });
      const file = new File([response.data], `Invoice_${invoiceNumber || id}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${invoiceNumber}`,
          text: `Invoice #${invoiceNumber} from SockWise Store`,
        });
        return;
      }
    } catch (shareErr) {
      if (shareErr.name !== 'AbortError') {
        console.log('Web share dismissed or fallback triggered', shareErr);
      } else {
        return; // User intentionally cancelled share sheet
      }
    }
  }

  // 2. Fallback: Open HTTP/HTTPS URI in a new tab for native PDF view & download
  const win = window.open(pdfUrl, '_blank');
  if (!win) {
    window.location.href = pdfUrl;
  }
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
