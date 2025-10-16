import jwt from 'jsonwebtoken';
import database from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to authenticate requests
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Generate JWT token
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Create or get user session
export function createUserSession(userId) {
  const session = database.createSession(userId);
  const token = generateToken(userId);
  return { session, token };
}

// Get user from session
export function getUserFromSession(sessionId) {
  const session = database.getSession(sessionId);
  if (!session) return null;
  
  return database.getUser(session.userId);
}

// Check if user has access to a feature
export function checkFeatureAccess(userId, feature) {
  const user = database.getUser(userId);
  if (!user) return false;

  const limits = database.getUsageLimits(user.subscriptionStatus);
  
  switch (feature) {
    case 'unlimited_messages':
      return limits.messagesPerMonth === -1;
    case 'unlimited_compute':
      return limits.computeTimePerMonth === -1;
    case 'multiple_sessions':
      return limits.maxConcurrentSessions > 1;
    default:
      return false;
  }
}

// Get user's current usage status
export function getUserUsageStatus(userId) {
  const user = database.getUser(userId);
  if (!user) return null;

  const limits = database.getUsageLimits(user.subscriptionStatus);
  const usage = user.usage;

  return {
    subscriptionStatus: user.subscriptionStatus,
    usage,
    limits,
    canUseFeature: (feature) => checkFeatureAccess(userId, feature),
    isNearLimit: (type) => {
      const limit = limits[`${type}PerMonth`];
      if (limit === -1) return false;
      const current = usage[`${type}ThisMonth`];
      return (current / limit) > 0.8; // 80% threshold
    }
  };
}
