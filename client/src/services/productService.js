import axiosInstance from '../utils/axiosInstance';

// Get all products (with optional search, category, brand, pagination)
const getProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/products?${query}`);
  return response.data;
};

// Get low stock products
const getLowStock = async () => {
  const response = await axiosInstance.get('/products/low-stock');
  return response.data;
};

// Create product
const createProduct = async (productData) => {
  const response = await axiosInstance.post('/products', productData);
  return response.data;
};

// Update product
const updateProduct = async (id, productData) => {
  const response = await axiosInstance.put(`/products/${id}`, productData);
  return response.data;
};

// Delete product
const deleteProduct = async (id) => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};

const productService = {
  getProducts,
  getLowStock,
  createProduct,
  updateProduct,
  deleteProduct,
};

export default productService;
