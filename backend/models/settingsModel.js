const db = require('../config/db');

async function getByUserId(userId) {
  const [rows] = await db.query('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function upsert(userId, settings) {
  const { notifyAppointments, notifyTreatments, notifyDocuments, language, theme } = settings;
  await db.query(
    `INSERT INTO user_settings (user_id, notify_appointments, notify_treatments, notify_documents, language, theme)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       notify_appointments = VALUES(notify_appointments),
       notify_treatments = VALUES(notify_treatments),
       notify_documents = VALUES(notify_documents),
       language = VALUES(language),
       theme = VALUES(theme)`,
    [userId, notifyAppointments ?? 1, notifyTreatments ?? 1, notifyDocuments ?? 1, language || 'fr', theme || 'light']
  );
}

module.exports = { getByUserId, upsert };
