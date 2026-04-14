function requireEnv(name, { allowEmpty = false } = {}) {
  const hasValue = Object.prototype.hasOwnProperty.call(process.env, name);
  const value = process.env[name];

  if (!hasValue) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (!allowEmpty && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  dbHost: requireEnv('DB_HOST'),
  dbPort: Number(requireEnv('DB_PORT')),
  dbUser: requireEnv('DB_USER'),
  dbPassword: requireEnv('DB_PASSWORD', { allowEmpty: true }),
  dbName: requireEnv('DB_NAME'),
  jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  corsOrigins: requireEnv('CORS_ORIGINS')
};

module.exports = env;
