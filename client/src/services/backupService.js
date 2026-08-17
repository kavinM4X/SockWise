import axiosInstance from '../utils/axiosInstance';

const exportDatabase = async () => {
  try {
    const response = await axiosInstance.get('/backup/export', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sockwise_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export Error:', error);
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token || '';
    if (token) {
      window.open(`/api/backup/export?token=${token}`);
    } else {
      toast.error('Session expired. Please log in again.');
    }
  }
};

const importDatabase = async (backupData) => {
  const response = await axiosInstance.post('/backup/import', { backup: backupData });
  return response.data;
};

const backupService = {
  exportDatabase,
  importDatabase,
};

export default backupService;
