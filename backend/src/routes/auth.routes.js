const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/auth.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Đường dẫn công khai (không cần Token)
router.post('/login', login);

// Đường dẫn cần đăng nhập (đi qua bảo vệ verifyToken trước khi vào getMe)
router.get('/me', verifyToken, getMe);

// Đường dẫn test phân quyền RBAC (chỉ riêng Admin mới vào được)
router.get('/admin-test', verifyToken, authorizeRoles('Admin'), (req, res) => {
  res.json({
    status: 'OK',
    message: `Xin chào Admin ${req.user.TenDangNhap}, phân quyền RBAC hoạt động chuẩn!`,
  });
});

module.exports = router;