require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const requestLogger = require('./middlewares/requestLogger');
const responseFormatter = require('./middlewares/responseFormatter');
const errorHandler = require('./middlewares/errorHandler');
const enforceHttps = require('./middlewares/httpsMiddleware');
const { csrfProtection } = require('./middlewares/csrfMiddleware');
const { authLimiter, generalLimiter } = require('./middlewares/rateLimitMiddleware');

const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : true, credentials: true }));
app.use(express.json({ limit: '20kb' }));
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
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  next();
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/v1/health', (req, res) => {
  res.formatResponse({ status: 'ok' }, 'Service disponible');
});

app.get('/api/v1/csrf-token', (req, res) => {
  res.formatResponse({ csrfToken: req.csrfToken() }, 'Jeton CSRF généré');
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/user', generalLimiter, userRoutes);
app.use('/api/v1/patients', generalLimiter, patientRoutes);
app.use('/api/v1', generalLimiter, adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: 'Ressource non trouvée' });
});

app.use(errorHandler);

module.exports = app;
