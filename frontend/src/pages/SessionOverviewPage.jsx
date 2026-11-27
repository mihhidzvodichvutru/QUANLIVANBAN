import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/authApi';

export default function SessionOverviewPage() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTestAdminRoute = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await authApi.testAdminAccess();
      setTestResult({
        ok: true,
        status: res.status,
        message: res.data?.message || 'Truy cập thành công tài nguyên Quản trị viên.',
      });
    } catch (err) {
      setTestResult({
        ok: false,
        status: err.response?.status || 'ERR',
        message:
          err.response?.data?.message ||
          'Yêu cầu bị từ chối hoặc lỗi kết nối tới máy chủ.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Thông tin phiên làm việc
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Dữ liệu được xác thực trực tiếp qua JWT và máy chủ Backend Chặng 2A.
        </p>
      </div>

      {/* Bảng thông tin tài khoản hiện tại */}
      <div className="bg-white border border-stone-200 rounded-[4px] overflow-hidden">
        <div className="px-4 py-3 bg-stone-100 border-b border-stone-200">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Hồ sơ định danh (GET /api/auth/me)
          </h2>
        </div>

        <table className="w-full text-sm border-collapse">
          <tbody>
            <tr className="border-b border-stone-200">
              <td className="py-3 px-4 w-52 text-stone-600 font-medium">
                Mã người dùng
              </td>
              <td className="py-3 px-4 font-mono text-[13px] text-stone-800">
                {user?.MaNguoiDung}
              </td>
            </tr>
            <tr className="border-b border-stone-200">
              <td className="py-3 px-4 text-stone-600 font-medium">
                Tên đăng nhập
              </td>
              <td className="py-3 px-4 font-mono text-[13px] text-stone-800">
                {user?.TenDangNhap}
              </td>
            </tr>
            <tr className="border-b border-stone-200">
              <td className="py-3 px-4 text-stone-600 font-medium">
                Họ và tên
              </td>
              <td className="py-3 px-4 text-stone-900">{user?.HoTen}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-stone-600 font-medium">
                Vai trò hệ thống (RBAC)
              </td>
              <td className="py-3 px-4">
                <span className="inline-block font-mono text-xs font-medium px-2 py-0.5 bg-[#F0FDF4] text-[#166534] border border-green-200 rounded-[2px]">
                  {user?.VaiTro}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Khối kiểm thử thông mạch phân quyền RBAC Backend */}
      <div className="bg-white border border-stone-200 rounded-[4px] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Kiểm thử phân quyền Backend (RBAC)
            </h2>
            <p className="text-sm text-stone-600 mt-0.5">
              Gửi yêu cầu tới{' '}
              <code className="font-mono text-[13px] text-stone-800">
                GET /api/auth/admin-test
              </code>{' '}
              để đối chiếu phản hồi <span className="font-mono">200</span> (Admin) hoặc{' '}
              <span className="font-mono">403</span> (VanThu / CanBo).
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestAdminRoute}
            disabled={testing}
            className="h-9 px-4 bg-[#14532D] hover:bg-[#166534] text-white text-sm font-medium rounded-[2px] border border-[#14532D] transition-colors duration-150 disabled:opacity-50 cursor-pointer"
          >
            {testing ? 'Đang gửi...' : 'Kiểm tra quyền Admin'}
          </button>
        </div>

        {testResult && (
          <div
            className={`px-3.5 py-2.5 rounded-[2px] border text-sm flex items-center gap-3 ${
              testResult.ok
                ? 'bg-[#F0FDF4] border-green-200 text-[#166534]'
                : 'bg-red-50 border-red-200 text-[#991B1B]'
            }`}
          >
            <span className="font-mono text-xs font-semibold px-1.5 py-0.5 bg-white/80 border border-current/20 rounded-[2px]">
              HTTP {testResult.status}
            </span>
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}