import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import SessionOverviewPage from './pages/SessionOverviewPage';
import ModulePlaceholder from './pages/ModulePlaceholder';
import ForbiddenPage from './pages/ForbiddenPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Tuyến công khai */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<ForbiddenPage />} />

          {/* Tuyến yêu cầu đăng nhập (cả 3 vai trò) */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'VanThu', 'CanBo']} />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<SessionOverviewPage />} />
              <Route
                path="/tra-cuu"
                element={
                  <ModulePlaceholder
                    title="Tra cứu & Tìm kiếm toàn văn"
                    phase="Chặng 2C"
                    description="Phân hệ tìm kiếm theo siêu dữ liệu và FULLTEXT INDEX trên MySQL sẽ được tích hợp tại đường dẫn này."
                  />
                }
              />

              {/* Tuyến chỉ dành cho Nhân viên Văn thư */}
              <Route element={<ProtectedRoute allowedRoles={['VanThu']} />}>
                <Route
                  path="/so-hoa"
                  element={
                    <ModulePlaceholder
                      title="Số hóa & Tải tệp OCR"
                      phase="Bước 3"
                      description="Khu vực tải lên hàng loạt tệp PDF/ảnh lên Cloudinary và đẩy vào hàng đợi xử lý AI OCR bất đồng bộ."
                    />
                  }
                />
                <Route
                  path="/hau-kiem"
                  element={
                    <ModulePlaceholder
                      title="Hậu kiểm hồ sơ OCR"
                      phase="Bước 3"
                      description="Màn hình chia đôi xem trước tệp gốc từ Cloudinary song song biểu mẫu hiệu đính siêu dữ liệu trước khi lưu trữ."
                    />
                  }
                />
              </Route>

              {/* Tuyến dành cho Admin và Văn thư */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'VanThu']} />}>
                <Route
                  path="/loai-van-ban"
                  element={
                    <ModulePlaceholder
                      title="Danh mục Loại văn bản"
                      phase="Chặng 2B"
                      description="Quản lý danh mục Nghị định, Quyết định, Công văn, Thông tư gắn với API /api/loai-van-ban."
                    />
                  }
                />
              </Route>

              {/* Tuyến chỉ dành cho Quản trị viên (Admin) */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route
                  path="/tai-khoan"
                  element={
                    <ModulePlaceholder
                      title="Quản lý Tài khoản người dùng"
                      phase="Chặng 2B"
                      description="Tạo tài khoản mới, phân vai trò RBAC, cấp lại mật khẩu và bảo vệ tài khoản Admin cuối cùng."
                    />
                  }
                />
                <Route
                  path="/nhat-ky"
                  element={
                    <ModulePlaceholder
                      title="Nhật ký hoạt động (Audit Log)"
                      phase="Chặng 2B"
                      description="Tra cứu lịch sử thao tác hệ thống theo thời gian, có phân trang từ API /api/nhat-ky."
                    />
                  }
                />
              </Route>
            </Route>
          </Route>

          {/* Mọi đường dẫn không tồn tại điều hướng về trang chính */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}