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
  let targetUsername = id;

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
    targetUsername = targetUser.TenDangNhap;

    // 1. Chặn Admin tự tước/đổi vai trò của chính mình
    if (id === adminId && VaiTro !== undefined && VaiTro !== targetUser.VaiTro) {
      await logActivity(adminId, `Cập nhật thông tin tài khoản: ${targetUsername}`, 'Thất bại');
      return res.status(400).json({
        status: 'ERROR',
        message: 'Không thể tự thay đổi vai trò của tài khoản đang đăng nhập!',
      });
    }

    // 2. Bảo vệ tài khoản Admin cuối cùng khi bị hạ quyền
    if (targetUser.VaiTro === 'Admin' && VaiTro !== undefined && VaiTro !== 'Admin') {
      const [[{ totalAdmins }]] = await pool.query(
        "SELECT COUNT(*) AS totalAdmins FROM NguoiDung WHERE VaiTro = 'Admin'"
      );
      if (totalAdmins <= 1) {
        await logActivity(adminId, `Hạ quyền Quản trị viên cuối cùng: ${targetUsername}`, 'Thất bại');
        return res.status(400).json({
          status: 'ERROR',
          message: 'Không thể xóa hoặc hạ quyền tài khoản Quản trị viên cuối cùng của hệ thống!',
        });
      }
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

    if (isPasswordReset && !isInfoUpdated) {
      await logActivity(adminId, `Cấp lại mật khẩu cho tài khoản: ${targetUsername}`, 'Thành công');
    } else if (isInfoUpdated && !isPasswordReset) {
      await logActivity(adminId, `Cập nhật thông tin tài khoản: ${targetUsername}`, 'Thành công');
    } else {
      await logActivity(adminId, `Cập nhật thông tin tài khoản: ${targetUsername}`, 'Thành công');
      await logActivity(adminId, `Cấp lại mật khẩu cho tài khoản: ${targetUsername}`, 'Thành công');
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
    await logActivity(adminId, `Cập nhật thông tin tài khoản: ${targetUsername}`, 'Thất bại');
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
  let targetUsername = id;

  // 1. Chặn Admin tự xóa chính mình (có ghi Audit Log Thất bại)
  if (id === adminId) {
    await logActivity(
      adminId,
      `Xóa tài khoản: ${req.user?.TenDangNhap || adminId}`,
      'Thất bại'
    );
    return res.status(400).json({
      status: 'ERROR',
      message: 'Không thể tự xóa tài khoản đang đăng nhập!',
    });
  }

  try {
    const [existing] = await pool.query(
      'SELECT MaNguoiDung, TenDangNhap, VaiTro FROM NguoiDung WHERE MaNguoiDung = ? LIMIT 1',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Không tìm thấy tài khoản.',
      });
    }

    const targetUser = existing[0];
    targetUsername = targetUser.TenDangNhap;

    // 2. Bảo vệ tài khoản Admin cuối cùng khi xóa
    if (targetUser.VaiTro === 'Admin') {
      const [[{ totalAdmins }]] = await pool.query(
        "SELECT COUNT(*) AS totalAdmins FROM NguoiDung WHERE VaiTro = 'Admin'"
      );
      if (totalAdmins <= 1) {
        await logActivity(adminId, `Xóa Quản trị viên cuối cùng: ${targetUsername}`, 'Thất bại');
        return res.status(400).json({
          status: 'ERROR',
          message: 'Không thể xóa hoặc hạ quyền tài khoản Quản trị viên cuối cùng của hệ thống!',
        });
      }
    }

    await pool.query('DELETE FROM NguoiDung WHERE MaNguoiDung = ?', [id]);
    await logActivity(adminId, `Xóa tài khoản: ${targetUsername}`, 'Thành công');

    return res.status(200).json({
      status: 'OK',
      message: 'Xóa tài khoản thành công.',
    });
  } catch (error) {
    console.error('[Users] deleteUser error:', error);
    await logActivity(adminId, `Xóa tài khoản: ${targetUsername}`, 'Thất bại');

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

// PATCH /api/users/change-password (Cả 3 vai trò tự đổi mật khẩu của chính mình)
exports.changePassword = async (req, res) => {
  const { MatKhauCu, MatKhauMoi } = req.body;
  const userId = getCurrentUserId(req);

  try {
    const [rows] = await pool.query(
      'SELECT MaNguoiDung, TenDangNhap, MatKhauMaHoa FROM NguoiDung WHERE MaNguoiDung = ? LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Không tìm thấy tài khoản.',
      });
    }

    const currentUser = rows[0];
    const isOldPasswordValid = await bcrypt.compare(MatKhauCu, currentUser.MatKhauMaHoa);
    if (!isOldPasswordValid) {
      await logActivity(userId, 'Tự đổi mật khẩu cá nhân', 'Thất bại');
      return res.status(400).json({
        status: 'ERROR',
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }

    const newHashedPassword = await bcrypt.hash(MatKhauMoi, 10);
    await pool.query(
      'UPDATE NguoiDung SET MatKhauMaHoa = ? WHERE MaNguoiDung = ?',
      [newHashedPassword, userId]
    );

    await logActivity(userId, 'Tự đổi mật khẩu cá nhân', 'Thành công');

    return res.status(200).json({
      status: 'OK',
      message: 'Đổi mật khẩu thành công.',
    });
  } catch (error) {
    console.error('[Users] changePassword error:', error);
    await logActivity(userId, 'Tự đổi mật khẩu cá nhân', 'Thất bại');
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi đổi mật khẩu.',
    });
  }
};