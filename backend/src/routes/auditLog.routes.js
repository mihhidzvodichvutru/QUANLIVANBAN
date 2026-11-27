const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLog.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Chỉ Quản trị viên (Admin) được xem lịch sử kiểm toán
router.get('/', verifyToken, authorizeRoles('Admin'), auditLogController.getAuditLogs);

module.exports = router;