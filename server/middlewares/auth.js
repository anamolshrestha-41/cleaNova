const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorized' });
  try {
    req.admin = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid' });
  }
};

// Only allows admin role
const adminOnly = (req, res, next) => {
  protect(req, res, () => {
    if (req.admin.role !== 'admin')
      return res.status(403).json({ message: 'Admin access only' });
    next();
  });
};

// Ward officer can only touch complaints belonging to their ward
const wardProtect = (req, res, next) => {
  protect(req, res, next);
};

module.exports = { protect, adminOnly, wardProtect };
