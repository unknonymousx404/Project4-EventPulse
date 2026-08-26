const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('You must be logged in to access this route', 401));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError('You must be logged in to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, iat, exp }
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
}

module.exports = requireAuth;
