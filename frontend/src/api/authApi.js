import axiosClient from './axiosClient';

const authApi = {
  // POST /api/auth/login
  login(credentials) {
    return axiosClient.post('/auth/login', credentials);
  },

  // GET /api/auth/me
  getMe() {
    return axiosClient.get('/auth/me');
  },

  // GET /api/auth/admin-test (kiểm thử thông mạch RBAC 200 / 403)
  testAdminAccess() {
    return axiosClient.get('/auth/admin-test');
  },
};

export default authApi;