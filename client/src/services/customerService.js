import axiosInstance from '../utils/axiosInstance';

const getCustomers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/customers?${query}`);
  return response.data;
};

const getCustomerById = async (id) => {
  const response = await axiosInstance.get(`/customers/${id}`);
  return response.data;
};

const updateCustomer = async (id, customerData) => {
  const response = await axiosInstance.put(`/customers/${id}`, customerData);
  return response.data;
};

const deleteCustomer = async (id) => {
  const response = await axiosInstance.delete(`/customers/${id}`);
  return response.data;
};

const collectPayment = async (customerId, amount) => {
  const response = await axiosInstance.post('/customers/collect-payment', { customerId, amount });
  return response.data;
};

const getCustomerHistory = async (phone) => {
  const response = await axiosInstance.get(`/customers/history/${phone}`);
  return response.data;
};

const customerService = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  collectPayment,
  getCustomerHistory,
};

export default customerService;
