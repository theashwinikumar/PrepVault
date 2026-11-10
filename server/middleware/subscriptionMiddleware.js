const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.VERCEL ? null : 'cmrit-dev-secret-change-me');

// Decode the session token if one is present, but never reject.
//
// Used on the public question routes: an anonymous visitor gets the free
// sample, a signed-in subscriber gets everything, and both are served by the
// same handler. Deliberately distinct from verifyToken, which fails closed.
function optionalAuth(req, res, next) {
  req.user = null;
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ') && JWT_SECRET) {
      const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
      req.user = { email: decoded.email, name: decoded.name, picture: decoded.picture };
    }
  } catch {
    // Expired or tampered token is treated as anonymous, not as an error.
    req.user = null;
  }
  next();
}

// Resolve the caller's entitlements onto req.access.
// All questions and materials are free for CMRIT students.
async function attachAccess(req, res, next) {
  try {
    req.access = { questions: true, notes: true, lifetime: true, expiresAt: null, products: ['free_all'] };
    next();
  } catch (err) {
    next(err);
  }
}

// Access gate - open to all students
function requireAccess() {
  return (req, res, next) => {
    // Open access for all placement features
    next();
  };
}

module.exports = { optionalAuth, attachAccess, requireAccess };
