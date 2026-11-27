const crypto = require('crypto');
const pool = require('../config/db');
const { logActivity } = require('../services/auditLog.service');

const getCurrentUserId = (req) => req.user?.MaNguoiDung || req.user?.maNguoiDung || req.user?.id;

// GET /api/loai-van-ban
exports.getAllLoaiVanBan = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT MaLoai, TenLoaiVanBan, MoTa FROM LoaiVanBan ORDER BY TenLoaiVanBan ASC'
    );
    return res.status(200).json({
      status: 'OK',
      data: rows,
    });
  } catch (error) {
    console.error('[LoaiVanBan] getAllLoaiVanBan error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi lấy danh sách loại văn bản.',
    });
  }
};

// POST /api/loai-van-ban
exports.createLoaiVanBan = async (req, res) => {
  const { TenLoaiVanBan, MoTa } = req.body;
  const userId = getCurrentUserId(req);

  try {
    // Kiểm tra trùng tên không phân biệt chữ hoa/thường
    const [duplicates] = await pool.query(
      'SELECT MaLoai FROM LoaiVanBan WHERE LOWER(TenLoaiVanBan) = LOWER(?) LIMIT 1',
      [TenLoaiVanBan]
    );
    if (duplicates.length > 0) {
      await logActivity(userId, `Thêm loại văn bản: ${TenLoaiVanBan}`, 'Thất bại');
      return res.status(409).json({
        status: 'ERROR',
        message: 'Loại văn bản này đã tồn tại.',
      });
    }

    const maLoai = crypto.randomUUID();
    await pool.query(
      'INSERT INTO LoaiVanBan (MaLoai, TenLoaiVanBan, MoTa) VALUES (?, ?, ?)',
      [maLoai, TenLoaiVanBan, MoTa]
    );

    await logActivity(userId, `Thêm loại văn bản: ${TenLoaiVanBan}`, 'Thành công');

    return res.status(201).json({
      status: 'OK',
      message: 'Thêm loại văn bản thành công.',
      data: {
        MaLoai: maLoai,
        TenLoaiVanBan,
        MoTa,
      },
    });
  } catch (error) {
    console.error('[LoaiVanBan] createLoaiVanBan error:', error);
    await logActivity(userId, `Thêm loại văn bản: ${TenLoaiVanBan}`, 'Thất bại');

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'ERROR',
        message: 'Loại văn bản này đã tồn tại.',
      });
    }
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi thêm loại văn bản.',
    });
  }
};

// PUT /api/loai-van-ban/:id
exports.updateLoaiVanBan = async (req, res) => {
  const { id } = req.params;
  const { TenLoaiVanBan, MoTa } = req.body;
  const userId = getCurrentUserId(req);

  try {
    const [existing] = await pool.query(
      'SELECT MaLoai, TenLoaiVanBan FROM LoaiVanBan WHERE MaLoai = ? LIMIT 1',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Không tìm thấy loại văn bản.',
      });
    }

    // Kiểm tra trùng tên với bản ghi khác (không phân biệt hoa/thường)
    const [duplicates] = await pool.query(
      'SELECT MaLoai FROM LoaiVanBan WHERE LOWER(TenLoaiVanBan) = LOWER(?) AND MaLoai <> ? LIMIT 1',
      [TenLoaiVanBan, id]
    );
    if (duplicates.length > 0) {
      await logActivity(userId, `Cập nhật loại văn bản: ${TenLoaiVanBan}`, 'Thất bại');
      return res.status(409).json({
        status: 'ERROR',
        message: 'Loại văn bản này đã tồn tại.',
      });
    }

    await pool.query(
      'UPDATE LoaiVanBan SET TenLoaiVanBan = ?, MoTa = ? WHERE MaLoai = ?',
      [TenLoaiVanBan, MoTa, id]
    );

    await logActivity(userId, `Cập nhật loại văn bản: ${TenLoaiVanBan}`, 'Thành công');

    return res.status(200).json({
      status: 'OK',
      message: 'Cập nhật loại văn bản thành công.',
      data: {
        MaLoai: id,
        TenLoaiVanBan,
        MoTa,
      },
    });
  } catch (error) {
    console.error('[LoaiVanBan] updateLoaiVanBan error:', error);
    await logActivity(userId, `Cập nhật loại văn bản: ${TenLoaiVanBan}`, 'Thất bại');

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'ERROR',
        message: 'Loại văn bản này đã tồn tại.',
      });
    }
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi cập nhật loại văn bản.',
    });
  }
};

// DELETE /api/loai-van-ban/:id
exports.deleteLoaiVanBan = async (req, res) => {
  const { id } = req.params;
  const userId = getCurrentUserId(req);

  try {
    const [existing] = await pool.query(
      'SELECT MaLoai, TenLoaiVanBan FROM LoaiVanBan WHERE MaLoai = ? LIMIT 1',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Không tìm thấy loại văn bản.',
      });
    }

    const tenLoai = existing[0].TenLoaiVanBan;

    // Kiểm tra ràng buộc khóa ngoại với bảng VanBan trước khi xóa
    const [[{ totalRefs }]] = await pool.query(
      'SELECT COUNT(*) AS totalRefs FROM VanBan WHERE MaLoai = ?',
      [id]
    );
    if (totalRefs > 0) {
      await logActivity(userId, `Xóa loại văn bản: ${tenLoai}`, 'Thất bại');
      return res.status(409).json({
        status: 'ERROR',
        message: 'Không thể xóa loại văn bản này vì đang có văn bản sử dụng.',
      });
    }

    await pool.query('DELETE FROM LoaiVanBan WHERE MaLoai = ?', [id]);
    await logActivity(userId, `Xóa loại văn bản: ${tenLoai}`, 'Thành công');

    return res.status(200).json({
      status: 'OK',
      message: 'Xóa loại văn bản thành công.',
    });
  } catch (error) {
    console.error('[LoaiVanBan] deleteLoaiVanBan error:', error);
    await logActivity(userId, `Xóa loại văn bản: ${id}`, 'Thất bại');

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        status: 'ERROR',
        message: 'Không thể xóa loại văn bản này vì đang có văn bản sử dụng.',
      });
    }
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi xóa loại văn bản.',
    });
  }
};