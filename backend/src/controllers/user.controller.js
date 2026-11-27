const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { logActivity } = require('../services/auditLog.service');

const getCurrentUserId = (req) => req.user?.MaNguoiDung || req.user?.maNguoiDung || req.user?.id;

// GET /api/users (Chỉ lấy các cột an toàn, ẩn MatKhauMaHoa)
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT MaNguoiDung, TenDangNhap, HoTen, VaiTro FROM NguoiDung ORDER BY VaiTro ASC, HoTen ASC'
    );
    return res.status(200).json({
      status: 'OK',
      data: rows,
    });
  } catch (error) {
    console.error('[Users] getAllUsers error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi lấy danh sách tài khoản.',
    });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  const { TenDangNhap, MatKhau, HoTen, VaiTro } = req.body;
  const adminId = getCurrentUserId(req);

  try {
    const [duplicates] = await pool.query(
      'SELECT MaNguoiDung FROM NguoiDung WHERE LOWER(TenDangNhap) = LOWER(?) LIMIT 1',
      [TenDangNhap]
    );
    if (duplicates.length > 0) {
      await logActivity(adminId, `Tạo tài khoản mới: ${TenDangNhap} (Vai trò: ${VaiTro})`, 'Thất bại');
      return res.status(409).json({
        status: 'ERROR',
        message: 'Tên đăng nhập đã tồn tại trong hệ thống.',
      });
    }

    const maNguoiDung = crypto.randomUUID();
    const matKhauMaHoa = await bcrypt.hash(MatKhau, 10);

    await pool.query(
      `INSERT INTO NguoiDung (MaNguoiDung, TenDangNhap, MatKhauMaHoa, HoTen, VaiTro)
       VALUES (?, ?, ?, ?, ?)`,
      [maNguoiDung, TenDangNhap, matKhauMaHoa, HoTen, VaiTro]
    );

    await logActivity(adminId, `Tạo tài khoản mới: ${TenDangNhap} (Vai trò: ${VaiTro})`, 'Thành công');

    return res.status(201).json({
      status: 'OK',
      message: 'Tạo tài khoản thành công.',
      data: {
        MaNguoiDung: maNguoiDung,
        TenDangNhap,
        HoTen,
        VaiTro,
      },
    });
  } catch (error) {
    console.error('[Users] createUser error:', error);
    await logActivity(adminId, `Tạo tài khoản mới: ${TenDangNhap} (Vai trò: ${VaiTro})`, 'Thất bại');

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'ERROR',
        message: 'Tên đăng nhập đã tồn tại trong hệ thống.',
      });
    }
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi tạo tài khoản.',
    });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { HoTen, VaiTro, MatKhau } = req.body;
  const adminId = getCurrentUserId(req);

  try {
    const [existing] = await pool.query(
      'SELECT MaNguoiDung, TenDangNhap, HoTen, VaiTro FROM NguoiDung WHERE MaNguoiDung = ? LIMIT 1',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Không tìm thấy tài khoản.',
      });
    }

    const targetUser = existing[0];

    // Chặn Admin tự tước/đổi vai trò của chính mình
    if (id === adminId && VaiTro !== undefined && VaiTro !== targetUser.VaiTro) {
      await logActivity(adminId, `Cập nhật thông tin tài khoản: ${targetUser.TenDangNhap}`, 'Thất bại');
      return res.status(400).json({
        status: 'ERROR',
        message: 'Không thể tự thay đổi vai trò của tài khoản đang đăng nhập!',
      });
    }

    const updates = [];
    const params = [];
    let isPasswordReset = false;
    let isInfoUpdated = false;

    if (HoTen !== undefined) {
      updates.push('HoTen = ?');
      params.push(HoTen);
      isInfoUpdated = true;
    }

    if (VaiTro !== undefined) {
      updates.push('VaiTro = ?');
      params.push(VaiTro);
      isInfoUpdated = true;
    }

    if (MatKhau !== undefined && MatKhau !== '') {
      const matKhauMaHoa = await bcrypt.hash(MatKhau, 10);
      updates.push('MatKhauMaHoa = ?');
      params.push(matKhauMaHoa);
      isPasswordReset = true;
    }

    params.push(id);
    await pool.query(`UPDATE NguoiDung SET ${updates.join(', ')} WHERE MaNguoiDung = ?`, params);

    // Ghi nhật ký chuẩn theo Mục 5.2 (không ghi mật khẩu)
    if (isPasswordReset && !isInfoUpdated) {
      await logActivity(adminId, `Cấp lại mật khẩu cho tài khoản: ${targetUser.TenDangNhap}`, 'Thành công');
    } else if (isInfoUpdated && !isPasswordReset) {
      await logActivity(adminId, `Cập nhật thông tin tài khoản: ${targetUser.TenDangNhap}`, 'Thành công');
    } else {
      await logActivity(adminId, `Cập nhật thông tin tài khoản: ${targetUser.TenDangNhap}`, 'Thành công');
      await logActivity(adminId, `Cấp lại mật khẩu cho tài khoản: ${targetUser.TenDangNhap}`, 'Thành công');
    }

    const [updatedRows] = await pool.query(
      'SELECT MaNguoiDung, TenDangNhap, HoTen, VaiTro FROM NguoiDung WHERE MaNguoiDung = ? LIMIT 1',
      [id]
    );

    return res.status(200).json({
      status: 'OK',
      message: 'Cập nhật tài khoản thành công.',
      data: updatedRows[0],
    });
  } catch (error) {
    console.error('[Users] updateUser error:', error);
    await logActivity(adminId, `Cập nhật thông tin tài khoản: ${id}`, 'Thất bại');
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi cập nhật tài khoản.',
    });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const adminId = getCurrentUserId(req);

  // Chặn Admin tự xóa chính mình
  if (id === adminId) {
    return res.status(400).json({
      status: 'ERROR',
      message: 'Không thể tự xóa tài khoản đang đăng nhập!',
    });
  }

  try {
    const [existing] = await pool.query(
      'SELECT MaNguoiDung, TenDangNhap FROM NguoiDung WHERE MaNguoiDung = ? LIMIT 1',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Không tìm thấy tài khoản.',
      });
    }

    const tenDangNhap = existing[0].TenDangNhap;

    await pool.query('DELETE FROM NguoiDung WHERE MaNguoiDung = ?', [id]);
    await logActivity(adminId, `Xóa tài khoản: ${tenDangNhap}`, 'Thành công');

    return res.status(200).json({
      status: 'OK',
      message: 'Xóa tài khoản thành công.',
    });
  } catch (error) {
    console.error('[Users] deleteUser error:', error);
    await logActivity(adminId, `Xóa tài khoản: ${id}`, 'Thất bại');

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        status: 'ERROR',
        message: 'Không thể xóa tài khoản này vì đang có văn bản hoặc nhật ký hoạt động liên quan.',
      });
    }
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi xóa tài khoản.',
    });
  }
};