const jwt = require('jsonwebtoken');

// 1. Kiểm tra người dùng đã đăng nhập (có JWT hợp lệ) chưa
const verifyToken = (req, res, next) => {
  // Lấy header Authorization (định dạng chuẩn: "Bearer <chuỗi_token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'ERROR',
      message: 'Truy cập bị từ chối. Vui lòng cung cấp Token đăng nhập!',
    });
  }

  try {
    // Giải mã và xác thực chữ ký Token bằng khóa JWT_SECRET trong file .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gắn thông tin giải mã (MaNguoiDung, TenDangNhap, VaiTro) vào req để các bước sau dùng
    req.user = decoded;
    next(); // Cho phép đi tiếp vào Controller
  } catch (error) {
    return res.status(401).json({
      status: 'ERROR',
      message: 'Token không hợp lệ hoặc đã hết hạn!',
    });
  }
};

// 2. Kiểm tra vai trò (RBAC) có nằm trong danh sách được phép không
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.VaiTro)) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Bạn không có quyền thực hiện chức năng này!',
      });
    }
    next(); // Đúng vai trò -> cho phép đi tiếp
  };
};

module.exports = { verifyToken, authorizeRoles };