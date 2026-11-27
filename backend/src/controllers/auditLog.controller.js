const pool = require('../config/db');

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const POSITIVE_INT_REGEX = /^\d+$/;

function isValidIsoDate(dateStr) {
  if (typeof dateStr !== 'string' || !ISO_DATE_REGEX.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// GET /api/nhat-ky?page=1&limit=20&fromDate=2026-11-01&toDate=2026-11-27
exports.getAuditLogs = async (req, res) => {
  const { page: rawPage, limit: rawLimit, fromDate, toDate } = req.query;
  const errors = [];

  // 1. Kiểm tra page (mặc định 1, số nguyên dương >= 1)
  let page = 1;
  if (rawPage !== undefined && rawPage !== '') {
    if (!POSITIVE_INT_REGEX.test(String(rawPage)) || Number(rawPage) < 1) {
      errors.push({
        field: 'page',
        message: 'Tham số page phải là số nguyên dương lớn hơn hoặc bằng 1.',
      });
    } else {
      page = Number(rawPage);
    }
  }

  // 2. Kiểm tra limit (mặc định 20, giới hạn 1 đến 100)
  let limit = 20;
  if (rawLimit !== undefined && rawLimit !== '') {
    const parsedLimit = Number(rawLimit);
    if (!POSITIVE_INT_REGEX.test(String(rawLimit)) || parsedLimit < 1 || parsedLimit > 100) {
      errors.push({
        field: 'limit',
        message: 'Tham số limit phải là số nguyên trong khoảng từ 1 đến 100.',
      });
    } else {
      limit = parsedLimit;
    }
  }

  // 3. Kiểm tra fromDate & toDate (YYYY-MM-DD và fromDate <= toDate)
  const hasFrom = fromDate !== undefined && fromDate !== '';
  const hasTo = toDate !== undefined && toDate !== '';
  let validFrom = true;
  let validTo = true;

  if (hasFrom && !isValidIsoDate(fromDate)) {
    validFrom = false;
    errors.push({
      field: 'fromDate',
      message: 'Tham số fromDate phải đúng định dạng ngày ISO (YYYY-MM-DD).',
    });
  }

  if (hasTo && !isValidIsoDate(toDate)) {
    validTo = false;
    errors.push({
      field: 'toDate',
      message: 'Tham số toDate phải đúng định dạng ngày ISO (YYYY-MM-DD).',
    });
  }

  if (hasFrom && hasTo && validFrom && validTo && fromDate > toDate) {
    errors.push({
      field: 'fromDate',
      message: 'Ngày bắt đầu (fromDate) không được lớn hơn ngày kết thúc (toDate).',
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'ERROR',
      message: 'Dữ liệu đầu vào không hợp lệ.',
      errors,
    });
  }

  try {
    const whereClauses = [];
    const params = [];

    if (hasFrom) {
      whereClauses.push('nk.ThoiGian >= ?');
      params.push(`${fromDate} 00:00:00`);
    }

    if (hasTo) {
      whereClauses.push('nk.ThoiGian <= ?');
      params.push(`${toDate} 23:59:59`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [[{ totalItems }]] = await pool.query(
      `SELECT COUNT(*) AS totalItems FROM NhatKyHoatDong nk ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT
         nk.MaNhatKy,
         nk.ThoiGian,
         nk.ThaoTac,
         nk.TrangThai,
         nk.MaNguoiDung,
         nd.TenDangNhap,
         nd.HoTen,
         nd.VaiTro
       FROM NhatKyHoatDong nk
       LEFT JOIN NguoiDung nd ON nk.MaNguoiDung = nd.MaNguoiDung
       ${whereSql}
       ORDER BY nk.ThoiGian DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return res.status(200).json({
      status: 'OK',
      data: rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('[AuditLog] getAuditLogs error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Lỗi hệ thống khi truy vấn nhật ký hoạt động.',
    });
  }
};