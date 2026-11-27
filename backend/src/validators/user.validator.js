const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{3,29}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,64}$/;
const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;
const VALID_ROLES = ['Admin', 'VanThu', 'CanBo'];

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    status: 'ERROR',
    message: 'Dữ liệu đầu vào không hợp lệ.',
    errors,
  });
};

exports.validateCreateUser = (req, res, next) => {
  const { TenDangNhap, MatKhau, HoTen, VaiTro } = req.body || {};
  const errors = [];

  // 1. TenDangNhap (trim trước khi kiểm tra)
  const tenDangNhapClean = typeof TenDangNhap === 'string' ? TenDangNhap.trim() : '';
  if (!USERNAME_REGEX.test(tenDangNhapClean)) {
    errors.push({
      field: 'TenDangNhap',
      message:
        'Tên đăng nhập phải bắt đầu bằng chữ cái, dài 4–30 ký tự và chỉ chứa chữ không dấu, số hoặc dấu gạch dưới (_).',
    });
  }

  // 2. MatKhau (KHÔNG trim, kiểm tra trực tiếp không chứa khoảng trắng)
  if (typeof MatKhau !== 'string' || !PASSWORD_REGEX.test(MatKhau)) {
    errors.push({
      field: 'MatKhau',
      message:
        'Mật khẩu phải dài 8–64 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và không chứa khoảng trắng.',
    });
  }

  // 3. HoTen (trim trước khi kiểm tra)
  const hoTenClean = typeof HoTen === 'string' ? HoTen.trim() : '';
  if (hoTenClean.length < 2 || hoTenClean.length > 100 || CONTROL_CHAR_REGEX.test(hoTenClean)) {
    errors.push({
      field: 'HoTen',
      message: 'Họ và tên phải có độ dài từ 2 đến 100 ký tự.',
    });
  }

  // 4. VaiTro
  if (typeof VaiTro !== 'string' || !VALID_ROLES.includes(VaiTro)) {
    errors.push({
      field: 'VaiTro',
      message: 'Vai trò không hợp lệ. Chỉ chấp nhận: Admin, VanThu hoặc CanBo.',
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.TenDangNhap = tenDangNhapClean;
  req.body.HoTen = hoTenClean;
  next();
};

exports.validateUpdateUser = (req, res, next) => {
  const { HoTen, VaiTro, MatKhau } = req.body || {};
  const errors = [];

  const hasHoTen = HoTen !== undefined;
  const hasVaiTro = VaiTro !== undefined;
  const hasMatKhau = MatKhau !== undefined && MatKhau !== '';

  if (!hasHoTen && !hasVaiTro && !hasMatKhau) {
    return sendValidationError(res, [
      {
        field: 'body',
        message: 'Vui lòng cung cấp ít nhất một thông tin cần cập nhật (HoTen, VaiTro hoặc MatKhau).',
      },
    ]);
  }

  if (hasHoTen) {
    const hoTenClean = typeof HoTen === 'string' ? HoTen.trim() : '';
    if (hoTenClean.length < 2 || hoTenClean.length > 100 || CONTROL_CHAR_REGEX.test(hoTenClean)) {
      errors.push({
        field: 'HoTen',
        message: 'Họ và tên phải có độ dài từ 2 đến 100 ký tự.',
      });
    } else {
      req.body.HoTen = hoTenClean;
    }
  }

  if (hasVaiTro) {
    if (typeof VaiTro !== 'string' || !VALID_ROLES.includes(VaiTro)) {
      errors.push({
        field: 'VaiTro',
        message: 'Vai trò không hợp lệ. Chỉ chấp nhận: Admin, VanThu hoặc CanBo.',
      });
    }
  }

  // Không trim MatKhau khi cấp lại mật khẩu
  if (hasMatKhau) {
    if (typeof MatKhau !== 'string' || !PASSWORD_REGEX.test(MatKhau)) {
      errors.push({
        field: 'MatKhau',
        message:
          'Mật khẩu phải dài 8–64 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và không chứa khoảng trắng.',
      });
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};