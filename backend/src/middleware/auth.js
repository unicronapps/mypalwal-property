const jwt = require('jsonwebtoken');

/**
 * Verifies the access token from Authorization header.
 * Attaches req.user = { id, role, phone } on success.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      code: 'TOKEN_MISSING',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.sub, role: decoded.role, phone: decoded.phone };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid access token',
      code: 'TOKEN_INVALID',
    });
  }
}

/**
 * Requires a specific role. Must be used after verifyToken.
 * Usage: router.use(verifyToken, requireRole('dealer'))
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }
    // Admin can access everything
    if (req.user.role === 'admin') return next();
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This action requires ${role} role`,
        code: 'FORBIDDEN',
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
