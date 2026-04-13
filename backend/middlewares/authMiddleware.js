const { verifyAccessToken } = require('../config/jwt');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT error', error);
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
}

module.exports = {
  verifyToken
};
