const db = require('../config/db');

async function findPatientByCmu(cmuNumber) {
  const [rows] = await db.query(
    `SELECT u.*, p.cmu_number FROM patients p
     JOIN users u ON u.id = p.user_id
     WHERE p.cmu_number = ?`,
    [cmuNumber]
  );
  return rows[0] || null;
}

async function findPatientByUserId(userId) {
  const [rows] = await db.query('SELECT * FROM patients WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function getAllPatients({ page = 1, pageSize = 20, search = '' } = {}) {
  const offset = (page - 1) * pageSize;
  const searchValue = `%${search}%`;
  const [[meta]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM patients p
     JOIN users u ON u.id = p.user_id
     WHERE (? = '' OR u.name LIKE ? OR p.cmu_number LIKE ?)`,
    [search, searchValue, searchValue]
  );

  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.created_at, p.cmu_number AS cmuNumber,
            c.title AS latestConsultationTitle,
            c.created_at AS latestConsultationAt
     FROM patients p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN consultations c ON c.id = (
       SELECT c2.id
       FROM consultations c2
       WHERE c2.patient_user_id = u.id
       ORDER BY c2.created_at DESC
       LIMIT 1
     )
     WHERE (? = '' OR u.name LIKE ? OR p.cmu_number LIKE ?)
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [search, searchValue, searchValue, pageSize, offset]
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

async function savePatientRecord(userId, cmuNumber) {
  const [result] = await db.query(
    'INSERT INTO patients (user_id, cmu_number) VALUES (?, ?)',
    [userId, cmuNumber]
  );
  return { id: result.insertId, userId, cmuNumber };
}

module.exports = {
  findPatientByCmu,
  findPatientByUserId,
  getAllPatients,
  savePatientRecord
};
