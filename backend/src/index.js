const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const loaiVanBanRoutes = require('./routes/loaiVanBan.routes');
const userRoutes = require('./routes/user.routes');
const auditLogRoutes = require('./routes/auditLog.routes');

const app = express();
app.use(cors());
app.use(express.json());

// API kiểm tra kết nối Aiven MySQL
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM LoaiVanBan');
    res.json({
      status: 'OK',
      message: 'Kết nối Aiven MySQL thành công!',
      loaiVanBan: rows,
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
    });
  }
});

// Gắn nhóm API Xác thực & Phân quyền
app.use('/api/auth', authRoutes);

// Gắn nhóm API Loại văn bản, Người dùng và Nhật ký hoạt động
app.use('/api/loai-van-ban', loaiVanBanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nhat-ky', auditLogRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});