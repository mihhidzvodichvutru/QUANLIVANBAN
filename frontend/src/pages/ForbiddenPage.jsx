import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-[4px] p-8">
        <p className="font-mono text-xs font-semibold text-[#991B1B] uppercase tracking-wider mb-2">
          HTTP 403 · Forbidden
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Không có quyền truy cập
        </h1>
        <p className="text-sm text-stone-600 mt-2 leading-relaxed">
          Tài khoản hiện tại không thuộc vai trò được phép mở phân hệ này. Vui
          lòng quay lại khu vực làm việc hợp lệ hoặc liên hệ Quản trị viên.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="h-9 px-4 bg-[#14532D] hover:bg-[#166534] text-white text-sm font-medium rounded-[2px] border border-[#14532D] transition-colors duration-150 cursor-pointer"
          >
            Quay lại phiên làm việc
          </button>
        </div>
      </div>
    </div>
  );
}