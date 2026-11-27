const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;

exports.validateLoaiVanBan = (req, res, next) => {
  const { TenLoaiVanBan, MoTa } = req.body || {};
  const errors = [];

  // 1. TenLoaiVanBan (bắt buộc, 2–100 ký tự sau khi trim)
  const tenClean = typeof TenLoaiVanBan === 'string' ? TenLoaiVanBan.trim() : '';
  if (tenClean.length < 2 || tenClean.length > 100 || CONTROL_CHAR_REGEX.test(tenClean)) {
    errors.push({
      field: 'TenLoaiVanBan',
      message: 'Tên loại văn bản phải dài từ 2 đến 100 ký tự.',
    });
  }

  // 2. MoTa (không bắt buộc, tối đa 500 ký tự sau khi trim, bỏ trống lưu NULL)
  let moTaClean = null;
  if (MoTa !== undefined && MoTa !== null) {
    if (typeof MoTa !== 'string') {
      errors.push({
        field: 'MoTa',
        message: 'Mô tả không được vượt quá 500 ký tự.',
      });
    } else {
      const trimmed = MoTa.trim();
      if (trimmed.length > 500) {
        errors.push({
          field: 'MoTa',
          message: 'Mô tả không được vượt quá 500 ký tự.',
        });
      } else {
        moTaClean = trimmed.length > 0 ? trimmed : null;
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'ERROR',
      message: 'Dữ liệu đầu vào không hợp lệ.',
      errors,
    });
  }

  req.body.TenLoaiVanBan = tenClean;
  req.body.MoTa = moTaClean;
  next();
};