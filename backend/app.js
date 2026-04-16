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
const { verifyToken } = require('./middlewares/authMiddleware');
const { authorizeRoles } = require('./middlewares/roleMiddleware');
const requestLogger = require('./middlewares/requestLogger');
const responseFormatter = require('./middlewares/responseFormatter');
const errorHandler = require('./middlewares/errorHandler');
const enforceHttps = require('./middlewares/httpsMiddleware');
const { csrfProtection } = require('./middlewares/csrfMiddleware');
const { authLimiter, generalLimiter } = require('./middlewares/rateLimitMiddleware');
const { ROLES } = require('./constants/access');
const env = require('./config/env');

const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"]
      }
    }
  })
);
app.use(cors({ origin: env.corsOrigins.split(','), credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(xss());
app.use(requestLogger);
app.use(responseFormatter);

if (env.nodeEnv === 'production') {
  app.use(enforceHttps);
}

app.use(csrfProtection);
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict'
  });
  next();
});

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

app.get('/api/v1/health', (req, res) => {
  res.formatResponse(
    {
      status: 'ok',
      uptime: process.uptime(),
      environment: env.nodeEnv,
      timestamp: new Date().toISOString()
    },
    'Service disponible'
  );
});

app.get('/api/v1/metrics', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.INSTITUTION), (req, res) => {
  res.formatResponse(
    {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      monitoring: 'placeholder'
    },
    'Métriques applicatives'
  );
});

app.get('/api/v1/csrf-token', (req, res) => {
  res.formatResponse({ csrfToken: req.csrfToken() }, 'Jeton CSRF généré');
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/user', generalLimiter, userRoutes);
app.use('/api/v1/patients', generalLimiter, patientRoutes);
app.use('/api/v1/patient', generalLimiter, patientRoutes);
app.use('/api/v1', generalLimiter, adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: 'Ressource non trouvée' });
});

app.use(errorHandler);

module.exports = app;
