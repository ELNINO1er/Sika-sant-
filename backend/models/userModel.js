const db = require('../config/db');
const { ROLES } = require('../constants/access');

async function findUserByEmail(email) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findUserByEmailAndRole(email, role) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findUserByPhone(phone) {
  const [rows] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
  return rows[0] || null;
}

async function saveNewUser(user) {
  const { name, role, email, phone, passwordHash } = user;
  const [result] = await db.query(
    'INSERT INTO users (name, role, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
    [name, role, email || null, phone || null, passwordHash || null]
  );
  return result.insertId;
}

async function getAllUsers({ page = 1, pageSize = 20 } = {}) {
  const offset = (page - 1) * pageSize;
  const [[meta]] = await db.query('SELECT COUNT(*) AS total FROM users');
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.role, u.email, u.phone, u.created_at,
            p.cmu_number AS cmuNumber,
            pr.specialty,
            pr.license,
            i.institution_id AS institutionId,
            i.type AS institutionType
     FROM users u
     LEFT JOIN patients p ON p.user_id = u.id
     LEFT JOIN professionals pr ON pr.user_id = u.id
     LEFT JOIN institutions i ON i.user_id = u.id
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );

  return {
    items: rows,
    meta: {
      total: meta.total,
      page,
      pageSize,
      totalPages: Math.ceil(meta.total / pageSize) || 1
    }
  };
}

module.exports = {
  ROLES,
  findUserByEmail,
  findUserByEmailAndRole,
  findUserById,
  findUserByPhone,
  saveNewUser,
  getAllUsers
};
