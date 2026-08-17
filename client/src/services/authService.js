import axiosInstance from '../utils/axiosInstance';

// Register user
const register = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);

  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }

  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axiosInstance.post('/auth/login', userData);

  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }

  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem('user');
};

const getMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await axiosInstance.put('/auth/profile', profileData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const updatePassword = async (passwordData) => {
  const response = await axiosInstance.put('/auth/password', passwordData);
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword
};

export default authService;
