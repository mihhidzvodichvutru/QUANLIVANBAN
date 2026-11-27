import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Search,
  FileUp,
  FileCheck2,
  FolderKanban,
  Users,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Danh mục điều hướng bám sát Ma trận phân quyền RBAC (Bảng 3.2.1)
const NAV_ITEMS = [
  {
    path: '/',
    label: 'Phiên làm việc',
    icon: LayoutGrid,
    roles: ['Admin', 'VanThu', 'CanBo'],
    end: true,
  },
  {
    path: '/tra-cuu',
    label: 'Tra cứu văn bản',
    icon: Search,
    roles: ['Admin', 'VanThu', 'CanBo'],
  },
  {
    path: '/so-hoa',
    label: 'Số hóa & Tải tệp OCR',
    icon: FileUp,
    roles: ['VanThu'],
  },
  {
    path: '/hau-kiem',
    label: 'Hậu kiểm hồ sơ',
    icon: FileCheck2,
    roles: ['VanThu'],
  },
  {
    path: '/loai-van-ban',
    label: 'Danh mục loại văn bản',
    icon: FolderKanban,
    roles: ['Admin', 'VanThu'],
  },
  {
    path: '/tai-khoan',
    label: 'Quản lý tài khoản',
    icon: Users,
    roles: ['Admin'],
  },
  {
    path: '/nhat-ky',
    label: 'Nhật ký hoạt động',
    icon: ClipboardList,
    roles: ['Admin'],
  },
];

const ROLE_LABELS = {
  Admin: 'Quản trị viên',
  VanThu: 'Nhân viên Văn thư',
  CanBo: 'Cán bộ / Lãnh đạo',
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.VaiTro)
  );

  const currentNav = visibleNavItems.find((item) =>
    item.end
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path)
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex text-stone-900">
      {/* Sidebar 240px cố định, phẳng, phân tách bằng viền 1px */}
      <aside className="w-60 shrink-0 bg-[#FAF9F6] border-r border-stone-200 flex flex-col">
        <div className="h-14 px-5 border-b border-stone-200 flex items-center">
          <div>
            <span className="font-mono text-xs font-semibold tracking-wider text-[#14532D] block leading-none">
              QLVB — OCR
            </span>
            <span className="text-[11px] text-stone-500 mt-0.5 block">
              Số hóa văn bản hành chính
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-sm rounded-[2px] transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#F0FDF4] text-[#14532D] font-medium border-l-2 border-[#14532D] pl-2.5'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 border-l-2 border-transparent pl-2.5'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-5 py-3 border-t border-stone-200">
          <p className="font-mono text-[11px] text-stone-400">
            Phiên bản nội bộ · 2A
          </p>
        </div>
      </aside>

      {/* Khối phải: Header 56px + Nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-stone-200 px-6 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-stone-900">
            {currentNav?.label || 'Hệ thống QLVB-OCR'}
          </h2>

          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-stone-900">
                {user?.HoTen || user?.TenDangNhap}
              </p>
              <p className="text-xs text-stone-500">
                {ROLE_LABELS[user?.VaiTro] || user?.VaiTro}
                <span className="font-mono ml-1.5 text-stone-400">
                  ({user?.VaiTro})
                </span>
              </p>
            </div>

            <div className="h-6 w-px bg-stone-200" />

            {/* Nút Đăng xuất: 100% chữ thuần túy, Secondary/Ghost */}
            <button
              type="button"
              onClick={handleLogout}
              className="h-8 px-3 bg-white hover:bg-stone-100 text-stone-700 text-sm font-medium rounded-[2px] border border-stone-300 transition-colors duration-150 cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}