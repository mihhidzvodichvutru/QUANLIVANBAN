const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// API: POST /api/auth/login
const login = async (req, res) => {
  try {
    const { TenDangNhap, MatKhau } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!TenDangNhap || !MatKhau) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!',
      });
    }

    // Tìm tài khoản trong Aiven MySQL
    const [rows] = await pool.query(
      'SELECT MaNguoiDung, TenDangNhap, MatKhauMaHoa, HoTen, VaiTro FROM NguoiDung WHERE TenDangNhap = ?',
      [TenDangNhap]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác!',
      });
    }

    const user = rows[0];

    // So khớp mật khẩu người dùng nhập với chuỗi băm trong CSDL
    const isMatch = await bcrypt.compare(MatKhau, user.MatKhauMaHoa);
    if (!isMatch) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác!',
      });
    }

    // Tạo JWT Token chứa thông tin định danh và vai trò
    const token = jwt.sign(
      {
        MaNguoiDung: user.MaNguoiDung,
        TenDangNhap: user.TenDangNhap,
        VaiTro: user.VaiTro,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Trả về Token và thông tin cơ bản (tuyệt đối không trả MatKhauMaHoa)
    return res.status(200).json({
      status: 'OK',
      message: 'Đăng nhập thành công!',
      token,
      user: {
        MaNguoiDung: user.MaNguoiDung,
        TenDangNhap: user.TenDangNhap,
        HoTen: user.HoTen,
        VaiTro: user.VaiTro,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi máy chủ khi đăng nhập: ' + error.message,
    });
  }
};

// API: GET /api/auth/me (Lấy thông tin người dùng hiện tại từ Token)
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT MaNguoiDung, TenDangNhap, HoTen, VaiTro FROM NguoiDung WHERE MaNguoiDung = ?',
      [req.user.MaNguoiDung]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Không tìm thấy tài khoản!',
      });
    }

    return res.status(200).json({
      status: 'OK',
      user: rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi máy chủ: ' + error.message,
    });
  }
};

module.exports = { login, getMe };