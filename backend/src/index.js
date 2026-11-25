const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});