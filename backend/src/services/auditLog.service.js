const crypto = require('crypto');
const pool = require('../config/db');

/**
 * Ghi nhật ký hoạt động dùng chung cho toàn hệ thống (Fail-safe)
 * @param {string} maNguoiDung
 * @param {string} thaoTac
 * @param {'Thành công' | 'Thất bại'} trangThai
 */
async function logActivity(maNguoiDung, thaoTac, trangThai = 'Thành công') {
  try {
    if (!maNguoiDung || !thaoTac) return;

    const statusValue = trangThai === 'Thất bại' ? 'Thất bại' : 'Thành công';
    const maNhatKy = crypto.randomUUID();

    await pool.query(
      `INSERT INTO NhatKyHoatDong (MaNhatKy, ThoiGian, ThaoTac, TrangThai, MaNguoiDung)
       VALUES (?, NOW(), ?, ?, ?)`,
      [maNhatKy, thaoTac, statusValue, maNguoiDung]
    );
  } catch (error) {
    console.error('[AuditLog] Không thể ghi nhật ký hoạt động:', error);
  }
}

module.exports = { logActivity };