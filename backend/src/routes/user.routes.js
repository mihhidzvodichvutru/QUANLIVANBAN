const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const {
  validateCreateUser,
  validateUpdateUser,
  validateChangePassword,
} = require('../validators/user.validator');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Bắt buộc đăng nhập cho toàn bộ phân hệ /api/users
router.use(verifyToken);

// Cả 3 vai trò đều được tự đổi mật khẩu cá nhân (đặt trước các tuyến /:id và quyền Admin)
router.patch(
  '/change-password',
  authorizeRoles('Admin', 'VanThu', 'CanBo'),
  validateChangePassword,
  userController.changePassword
);

// Các tuyến quản trị tài khoản dưới đây chỉ dành cho Admin
router.use(authorizeRoles('Admin'));

router.get('/', userController.getAllUsers);
router.post('/', validateCreateUser, userController.createUser);
router.put('/:id', validateUpdateUser, userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;