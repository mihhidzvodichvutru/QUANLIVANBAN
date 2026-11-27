const express = require('express');
const router = express.Router();
const loaiVanBanController = require('../controllers/loaiVanBan.controller');
const { validateLoaiVanBan } = require('../validators/loaiVanBan.validator');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Cả 3 vai trò đều được xem danh mục
router.get(
  '/',
  verifyToken,
  authorizeRoles('Admin', 'VanThu', 'CanBo'),
  loaiVanBanController.getAllLoaiVanBan
);

// Chỉ Admin và VanThu được thêm, sửa, xóa
router.post(
  '/',
  verifyToken,
  authorizeRoles('Admin', 'VanThu'),
  validateLoaiVanBan,
  loaiVanBanController.createLoaiVanBan
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Admin', 'VanThu'),
  validateLoaiVanBan,
  loaiVanBanController.updateLoaiVanBan
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Admin', 'VanThu'),
  loaiVanBanController.deleteLoaiVanBan
);

module.exports = router;