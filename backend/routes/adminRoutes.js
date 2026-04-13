const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');

router.get('/users', verifyToken, authorizeRoles('INSTITUTION'), adminController.listUsers);
router.get('/audit-logs', verifyToken, authorizeRoles('INSTITUTION'), adminController.listAuditLogs);

module.exports = router;
