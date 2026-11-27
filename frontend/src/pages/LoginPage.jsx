import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Nếu đã đăng nhập sẵn thì chuyển thẳng vào hệ thống
  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Kiểm tra tối thiểu không bỏ trống phía Client (không áp Regex mật khẩu tại Login)
    const errors = {};
    if (!tenDangNhap.trim()) {
      errors.TenDangNhap = 'Vui lòng nhập tên đăng nhập.';
    }
    if (!matKhau) {
      errors.MatKhau = 'Vui lòng nhập mật khẩu.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await login(tenDangNhap.trim(), matKhau);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const apiMessage =
        err.response?.data?.message ||
        'Không thể kết nối tới máy chủ. Vui lòng kiểm tra Backend đang chạy.';
      setServerError(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[400px] bg-white border border-stone-200 rounded-[4px] p-8">
        {/* Phần tiêu đề hệ thống: thuần chữ sắc nét, không logo tròn nhựa */}
        <div className="mb-7 pb-5 border-b border-stone-200">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-[#14532D] mb-1.5">
            QLVB — OCR
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Đăng nhập hệ thống
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Quản lý và số hóa văn bản hành chính
          </p>
        </div>

        {/* Cảnh báo lỗi chung từ Backend (VD: 401 sai tài khoản/mật khẩu) */}
        {serverError && (
          <div
            role="alert"
            className="mb-5 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-[2px] text-xs font-medium text-[#991B1B]"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Trường Tên đăng nhập */}
          <div>
            <label
              htmlFor="tenDangNhap"
              className="block text-[13px] font-medium text-stone-700 mb-1.5"
            >
              Tên đăng nhập
            </label>
            <input
              id="tenDangNhap"
              type="text"
              autoComplete="username"
              autoFocus
              value={tenDangNhap}
              onChange={(e) => {
                setTenDangNhap(e.target.value);
                if (fieldErrors.TenDangNhap) {
                  setFieldErrors((prev) => ({ ...prev, TenDangNhap: '' }));
                }
              }}
              placeholder="Nhập tên tài khoản"
              className={`w-full h-9 px-3 bg-white text-sm text-stone-900 placeholder:text-stone-400 rounded-[2px] border transition-colors focus:outline-none focus:ring-1 ${
                fieldErrors.TenDangNhap
                  ? 'border-[#991B1B] focus:border-[#991B1B] focus:ring-[#991B1B]'
                  : 'border-stone-300 focus:border-[#14532D] focus:ring-[#14532D]'
              }`}
            />
            {fieldErrors.TenDangNhap && (
              <p className="text-xs font-medium text-[#991B1B] mt-1">
                {fieldErrors.TenDangNhap}
              </p>
            )}
          </div>

          {/* Trường Mật khẩu */}
          <div>
            <label
              htmlFor="matKhau"
              className="block text-[13px] font-medium text-stone-700 mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="matKhau"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={matKhau}
                onChange={(e) => {
                  setMatKhau(e.target.value);
                  if (fieldErrors.MatKhau) {
                    setFieldErrors((prev) => ({ ...prev, MatKhau: '' }));
                  }
                }}
                placeholder="Nhập mật khẩu"
                className={`w-full h-9 pl-3 pr-10 bg-white text-sm text-stone-900 placeholder:text-stone-400 rounded-[2px] border transition-colors focus:outline-none focus:ring-1 ${
                  fieldErrors.MatKhau
                    ? 'border-[#991B1B] focus:border-[#991B1B] focus:ring-[#991B1B]'
                    : 'border-stone-300 focus:border-[#14532D] focus:ring-[#14532D]'
                }`}
              />
              {/* Icon-only utility: được phép theo mục 4.3 của Design System */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {fieldErrors.MatKhau && (
              <p className="text-xs font-medium text-[#991B1B] mt-1">
                {fieldErrors.MatKhau}
              </p>
            )}
          </div>

          {/* Nút hành động chính: 100% chữ thuần túy, góc 2px, xanh rừng thông */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-9 px-4 bg-[#14532D] hover:bg-[#166534] text-white text-sm font-medium rounded-[2px] border border-[#14532D] transition-colors duration-150 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-xs text-stone-500">
        Sử dụng tài khoản nội bộ do Quản trị viên cấp để truy cập hệ thống.
      </p>
    </div>
  );
}