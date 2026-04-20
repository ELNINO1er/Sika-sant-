const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('./logger');

const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

pool.getConnection()
  .then((connection) => {
    logger.info('Database connection established successfully');
    connection.release();
  })
  .catch((err) => {
    logger.error('Unable to connect to database: %s', err.message);
    process.exit(1);
  });

pool.on('error', (err) => {
  logger.error('Database pool error: %s', err.message);
});

module.exports = pool;
