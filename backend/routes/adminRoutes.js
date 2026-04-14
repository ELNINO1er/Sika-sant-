const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles, authorizePermissions } = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');
const { validateRequest } = require('../middlewares/validateMiddleware');
const { listUsersSchema, listAuditLogsSchema } = require('../validation/adminValidation');
const { ROLES, PERMISSIONS } = require('../constants/access');

router.get('/users', verifyToken, authorizeRoles(ROLES.ADMIN), validateRequest(listUsersSchema), adminController.listUsers);
router.get(
  '/audit-logs',
  verifyToken,
  authorizePermissions(PERMISSIONS.VIEW_AUDIT_LOGS),
  validateRequest(listAuditLogsSchema),
  adminController.listAuditLogs
);

module.exports = router;
