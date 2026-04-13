require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { authLimiter } = require('./middlewares/rateLimitMiddleware');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: true, credentials: true }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Sika-Santé backend running on http://localhost:${PORT}`);
});
