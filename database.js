// Simple in-memory database for demo purposes
// In production, use PostgreSQL, MongoDB, or similar

class Database {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.usage = new Map();
    this.subscriptions = new Map();
  }

  // User Management
  createUser(userData) {
    const userId = this.generateId();
    const user = {
      id: userId,
      email: userData.email,
      createdAt: new Date(),
      subscriptionStatus: 'free', // free, active, cancelled, past_due
      subscriptionId: null,
      customerId: null,
      usage: {
        messagesThisMonth: 0,
        computeTimeThisMonth: 0, // in seconds
        tokensThisMonth: 0,
        lastResetDate: new Date()
      }
    };
    this.users.set(userId, user);
    return user;
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (user) {
      Object.assign(user, updates);
      this.users.set(userId, user);
    }
    return user;
  }

  // Session Management
  createSession(userId) {
    const sessionId = this.generateId();
    const session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.sessions.delete(sessionId);
    }
    return null;
  }

  // Usage Tracking
  trackUsage(userId, usageData) {
    const user = this.users.get(userId);
    if (!user) return false;

    // Reset monthly usage if needed
    this.resetMonthlyUsageIfNeeded(user);

    // Update usage
    user.usage.messagesThisMonth += usageData.messages || 0;
    user.usage.computeTimeThisMonth += usageData.computeTime || 0;
    user.usage.tokensThisMonth += usageData.tokens || 0;

    this.users.set(userId, user);
    return true;
  }

  resetMonthlyUsageIfNeeded(user) {
    const now = new Date();
    const lastReset = new Date(user.usage.lastResetDate);
    
    // Reset if it's a new month
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      user.usage.messagesThisMonth = 0;
      user.usage.computeTimeThisMonth = 0;
      user.usage.tokensThisMonth = 0;
      user.usage.lastResetDate = now;
    }
  }

  // Subscription Management
  createSubscription(userId, subscriptionData) {
    const subscriptionId = this.generateId();
    const subscription = {
      id: subscriptionId,
      userId,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      status: subscriptionData.status,
      currentPeriodStart: subscriptionData.currentPeriodStart,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      createdAt: new Date()
    };
    this.subscriptions.set(subscriptionId, subscription);
    
    // Update user subscription status
    this.updateUser(userId, {
      subscriptionStatus: subscriptionData.status,
      subscriptionId: subscriptionId,
      customerId: subscriptionData.customerId
    });
    
    return subscription;
  }

  updateSubscription(subscriptionId, updates) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      Object.assign(subscription, updates);
      this.subscriptions.set(subscriptionId, subscription);
      
      // Update user status
      this.updateUser(subscription.userId, {
        subscriptionStatus: updates.status
      });
    }
    return subscription;
  }

  // Usage Limits
  getUsageLimits(subscriptionStatus) {
    const limits = {
      free: {
        messagesPerMonth: 50,
        computeTimePerMonth: 300, // 5 minutes
        tokensPerMonth: 10000,
        maxConcurrentSessions: 1
      },
      active: {
        messagesPerMonth: -1, // unlimited
        computeTimePerMonth: -1, // unlimited
        tokensPerMonth: -1, // unlimited
        maxConcurrentSessions: 5
      },
      cancelled: {
        messagesPerMonth: 10,
        computeTimePerMonth: 60, // 1 minute
        tokensPerMonth: 2000,
        maxConcurrentSessions: 1
      },
      past_due: {
        messagesPerMonth: 10,
        computeTimePerMonth: 60,
        tokensPerMonth: 2000,
        maxConcurrentSessions: 1
      }
    };
    return limits[subscriptionStatus] || limits.free;
  }

  checkUsageLimit(userId, usageType, amount = 1) {
    const user = this.users.get(userId);
    if (!user) return { allowed: false, reason: 'User not found' };

    const limits = this.getUsageLimits(user.subscriptionStatus);
    const currentUsage = user.usage;

    // Check specific limit
    let limitKey, currentKey;
    switch (usageType) {
      case 'messages':
        limitKey = 'messagesPerMonth';
        currentKey = 'messagesThisMonth';
        break;
      case 'computeTime':
        limitKey = 'computeTimePerMonth';
        currentKey = 'computeTimeThisMonth';
        break;
      case 'tokens':
        limitKey = 'tokensPerMonth';
        currentKey = 'tokensThisMonth';
        break;
      default:
        return { allowed: false, reason: 'Invalid usage type' };
    }

    const limit = limits[limitKey];
    const current = currentUsage[currentKey];

    // Unlimited for active subscribers
    if (limit === -1) {
      return { allowed: true, remaining: -1 };
    }

    // Check if adding this amount would exceed limit
    if (current + amount > limit) {
      return {
        allowed: false,
        reason: `${usageType} limit exceeded`,
        current,
        limit,
        remaining: Math.max(0, limit - current)
      };
    }

    return {
      allowed: true,
      remaining: limit - current - amount,
      current,
      limit
    };
  }

  // Utility
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Analytics
  getUserStats(userId) {
    const user = this.users.get(userId);
    if (!user) return null;

    const limits = this.getUsageLimits(user.subscriptionStatus);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt
      },
      usage: user.usage,
      limits,
      usagePercentage: {
        messages: limits.messagesPerMonth === -1 ? 0 : (user.usage.messagesThisMonth / limits.messagesPerMonth) * 100,
        computeTime: limits.computeTimePerMonth === -1 ? 0 : (user.usage.computeTimeThisMonth / limits.computeTimePerMonth) * 100,
        tokens: limits.tokensPerMonth === -1 ? 0 : (user.usage.tokensThisMonth / limits.tokensPerMonth) * 100
      }
    };
  }
}

// Export singleton instance
export default new Database();
