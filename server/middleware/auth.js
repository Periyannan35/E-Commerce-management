const jwt = require('jsonwebtoken');
const { findUserById } = require('../db');
const secret = process.env.JWT_SECRET || 'secret123';

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = auth.split(' ')[1];

  try {
    const payload = jwt.verify(token, secret);
    const user = findUserById(payload.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const { password, ...profile } = user;
    req.user = profile;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
