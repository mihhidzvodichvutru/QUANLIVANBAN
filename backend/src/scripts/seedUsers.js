const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();
const pool = require('../config/db');

const sampleUsers = [
  {
    TenDangNhap: 'admin',
    MatKhau: '123456',
    HoTen: 'Quản trị viên Hệ thống',
    VaiTro: 'Admin',
  },
  {
    TenDangNhap: 'vanthu',
    MatKhau: '123456',
    HoTen: 'Nhân viên Văn thư',
    VaiTro: 'VanThu',
  },
  {
    TenDangNhap: 'canbo',
    MatKhau: '123456',
    HoTen: 'Cán bộ Tra cứu',
    VaiTro: 'CanBo',
  },
];

async function seedUsers() {
  try {
    console.log('Đang kết nối Aiven MySQL để nạp/cập nhật 3 tài khoản mẫu...');

    for (const user of sampleUsers) {
      // Băm mật khẩu bằng bcryptjs (salt rounds = 10)
      const matKhauMaHoa = await bcrypt.hash(user.MatKhau, 10);

      // Kiểm tra xem tài khoản đã tồn tại chưa
      const [existing] = await pool.query(
        'SELECT MaNguoiDung FROM NguoiDung WHERE TenDangNhap = ?',
        [user.TenDangNhap]
      );

      if (existing.length > 0) {
        await pool.query(
          'UPDATE NguoiDung SET MatKhauMaHoa = ?, HoTen = ?, VaiTro = ? WHERE TenDangNhap = ?',
          [matKhauMaHoa, user.HoTen, user.VaiTro, user.TenDangNhap]
        );
        console.log(`~ Đã cập nhật lại mật khẩu hash cho: ${user.TenDangNhap} (${user.VaiTro})`);
        continue;
      }

      const maNguoiDung = crypto.randomUUID();

      await pool.query(
        `INSERT INTO NguoiDung (MaNguoiDung, TenDangNhap, MatKhauMaHoa, HoTen, VaiTro)
         VALUES (?, ?, ?, ?, ?)`,
        [maNguoiDung, user.TenDangNhap, matKhauMaHoa, user.HoTen, user.VaiTro]
      );

      console.log(`+ Đã tạo mới thành công: ${user.TenDangNhap} (${user.VaiTro})`);
    }

    console.log('Hoàn tất nạp/cập nhật 3 tài khoản mẫu!');
  } catch (error) {
    console.error('Lỗi khi nạp tài khoản mẫu:', error.message);
  } finally {
    await pool.end();
  }
}

seedUsers();