const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');

app.listen(env.port, () => {
  logger.info('Sika-Santé backend listening on http://localhost:%s', env.port);
});
