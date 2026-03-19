const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ error: 'A token is required for authentication' });
  }

  try {
    const defaultSecret = 'fintran_super_secret_key_12345';
    // Remove "Bearer " prefix if present
    const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET || defaultSecret);
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Token' });
  }
  return next();
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'owner') {
      next();
    } else {
      res.status(403).json({ error: 'Admin dashboard access denied' });
    }
  });
};

module.exports = { verifyToken, verifyAdmin };
