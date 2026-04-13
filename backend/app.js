require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestLogger = require('./middlewares/requestLogger');
const responseFormatter = require('./middlewares/responseFormatter');
const errorHandler = require('./middlewares/errorHandler');
const enforceHttps = require('./middlewares/httpsMiddleware');
const { csrfProtection } = require('./middlewares/csrfMiddleware');
const { authLimiter, generalLimiter } = require('./middlewares/rateLimitMiddleware');

const swaggerDocument = YAML.load('./docs/swagger.yaml');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : true, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(xss());
app.use(requestLogger);
app.use(responseFormatter);

if (process.env.NODE_ENV === 'production') {
  app.use(enforceHttps);
}

app.use(csrfProtection);
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  next();
});

app.get('/api/v1/health', (req, res) => {
  res.formatResponse({ status: 'ok' }, 'Service disponible');
});

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/user', generalLimiter, userRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: 'Ressource non trouvée' });
});

app.use(errorHandler);

module.exports = app;
