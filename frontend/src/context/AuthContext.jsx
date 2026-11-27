import { createContext, useContext, useEffect, useState } from 'react';
import authApi from '../api/authApi';
import { TOKEN_STORAGE_KEY } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Khôi phục phiên đăng nhập từ Token mỗi khi tải lại trang (F5)
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        const userData = res.data?.user || res.data?.data || res.data;
        setUser(userData);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, []);

  // Hàm đăng nhập: gọi API, lưu JWT và cập nhật state người dùng
  const login = async (TenDangNhap, MatKhau) => {
    const res = await authApi.login({ TenDangNhap, MatKhau });
    const token = res.data?.token || res.data?.data?.token;
    const userData = res.data?.user || res.data?.data?.user;

    if (!token || !userData) {
      throw new Error('Phản hồi từ máy chủ không đầy đủ thông tin xác thực.');
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(userData);
    return userData;
  };

  // Hàm đăng xuất: xóa sạch Token và phiên cục bộ
  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        initializing,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider.');
  }
  return context;
}