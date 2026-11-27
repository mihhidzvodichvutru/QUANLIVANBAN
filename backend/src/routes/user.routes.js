const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateCreateUser, validateUpdateUser } = require('../validators/user.validator');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Toàn bộ phân hệ Quản lý Tài khoản chỉ dành cho Admin
router.use(verifyToken, authorizeRoles('Admin'));

router.get('/', userController.getAllUsers);
router.post('/', validateCreateUser, userController.createUser);
router.put('/:id', validateUpdateUser, userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;