# 🏰 Georgian Chat Paywall System - Complete Deployment Guide

This guide covers the implementation of a comprehensive usage-based paywall system for your Georgian Chat application.

## 📋 System Overview

### What's Implemented

1. **User Authentication & Management**
   - JWT-based authentication
   - User registration/login
   - Session management
   - User profile tracking

2. **Usage Tracking & Limits**
   - Message count tracking
   - Compute time monitoring
   - Token usage estimation
   - Monthly usage resets

3. **Subscription Tiers**
   - **Free Tier**: 50 messages/month, 5 minutes compute, 10K tokens
   - **Pro Monthly**: $9.99/month - Unlimited everything
   - **Pro Yearly**: $99.99/year - Unlimited everything + 2 months free

4. **Stripe Integration**
   - Secure payment processing
   - Subscription management
   - Webhook handling
   - Customer portal

5. **Paywall UI**
   - Elegant upgrade prompts
   - Usage statistics display
   - Seamless checkout flow

## 🚀 Deployment Steps

### Step 1: Install Dependencies

```bash
npm install jsonwebtoken stripe
```

### Step 2: Set Up Stripe

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Create account and get API keys

2. **Create Products & Prices**
   ```bash
   # Using Stripe CLI (recommended)
   stripe products create --name "Georgian Chat Pro Monthly" --description "Unlimited access to Georgian Chat"
   stripe prices create --product prod_xxx --unit-amount 999 --currency usd --recurring interval=month
   
   stripe products create --name "Georgian Chat Pro Yearly" --description "Unlimited access to Georgian Chat (Yearly)"
   stripe prices create --product prod_yyy --unit-amount 9999 --currency usd --recurring interval=year
   ```

3. **Get API Keys**
   - Publishable key: `pk_test_...` (for frontend)
   - Secret key: `sk_test_...` (for backend)
   - Webhook secret: `whsec_...` (for webhooks)

### Step 3: Configure Environment Variables

Add to your Vercel environment variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secure_jwt_secret_here

# Existing variables
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
MODAL_BASE_URL=https://minuterepeater7-hue--georgian-chat-llm-generate-response.modal.run
MODAL_HEALTH_URL=https://minuterepeater7-hue--georgian-chat-llm-health-check.modal.run
```

### Step 4: Update Vercel Configuration

The `vercel.json` file has been updated with the new environment variables.

### Step 5: Deploy the Application

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Set up Stripe Webhooks**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-app.vercel.app/stripe-webhook`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### Step 6: Update Frontend Stripe Key

In `public/paywall.html`, update the Stripe publishable key:

```javascript
const stripe = Stripe('pk_test_your_actual_publishable_key_here');
```

## 💰 Pricing Strategy

### Free Tier (Lead Generation)
- **50 messages/month** - Enough for 2-3 conversations
- **5 minutes compute time** - Covers basic usage
- **10,000 tokens** - Sufficient for short interactions
- **1 concurrent session** - Single user experience

### Pro Monthly ($9.99/month)
- **Unlimited messages** - No restrictions
- **Unlimited compute time** - Full AI capabilities
- **Unlimited tokens** - Long conversations
- **5 concurrent sessions** - Multi-device access
- **Priority support** - Faster response times

### Pro Yearly ($99.99/year)
- **All Pro Monthly features**
- **2 months free** - 20% discount
- **Annual billing** - Convenience
- **Early access** - New features first

## 🔧 Technical Implementation

### Database Schema (In-Memory for Demo)

```javascript
// User Object
{
  id: "user_123",
  email: "user@example.com",
  subscriptionStatus: "free", // free, active, cancelled, past_due
  subscriptionId: "sub_123",
  customerId: "cus_123",
  usage: {
    messagesThisMonth: 25,
    computeTimeThisMonth: 120, // seconds
    tokensThisMonth: 5000,
    lastResetDate: "2024-01-01"
  }
}
```

### Usage Tracking

```javascript
// Track usage for each request
database.trackUsage(userId, {
  messages: 1,
  computeTime: 5, // seconds
  tokens: 150 // estimated
});
```

### Paywall Triggers

```javascript
// Check limits before processing
const usageCheck = database.checkUsageLimit(userId, 'messages', 1);
if (!usageCheck.allowed) {
  return res.status(429).json({
    error: "Usage limit exceeded",
    upgradeRequired: true
  });
}
```

## 📊 Analytics & Monitoring

### User Analytics Endpoint

```javascript
GET /analytics
Authorization: Bearer <token>

Response:
{
  user: { id, email, subscriptionStatus, createdAt },
  usage: { messagesThisMonth, computeTimeThisMonth, tokensThisMonth },
  limits: { messagesPerMonth, computeTimePerMonth, tokensPerMonth },
  usagePercentage: { messages: 50, computeTime: 30, tokens: 75 }
}
```

### Key Metrics to Track

1. **Conversion Rates**
   - Free to paid conversion
   - Trial to paid conversion
   - Churn rate by tier

2. **Usage Patterns**
   - Average messages per user
   - Peak usage times
   - Feature adoption rates

3. **Revenue Metrics**
   - Monthly recurring revenue (MRR)
   - Customer lifetime value (CLV)
   - Average revenue per user (ARPU)

## 🛡️ Security Considerations

### Authentication
- JWT tokens with 24-hour expiration
- Secure token storage in localStorage
- Automatic token refresh

### Payment Security
- Stripe handles all payment data
- No card information stored locally
- PCI compliance through Stripe

### Rate Limiting
- Per-user usage limits
- API rate limiting
- DDoS protection via Vercel

## 🔄 Webhook Processing

### Stripe Webhook Events

```javascript
// Handle subscription changes
customer.subscription.created → Create subscription record
customer.subscription.updated → Update subscription status
customer.subscription.deleted → Mark as cancelled
invoice.payment_succeeded → Activate subscription
invoice.payment_failed → Mark as past_due
```

### Webhook Security

```javascript
// Verify webhook signatures
const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```

## 📱 User Experience Flow

### 1. First Visit
- User sees login modal
- Enters email and name
- Gets free tier access

### 2. Free Usage
- Can send 50 messages
- Usage counter shows remaining
- Smooth experience within limits

### 3. Limit Reached
- Automatic redirect to paywall
- Clear upgrade options
- Usage statistics displayed

### 4. Upgrade Process
- Stripe Checkout integration
- Secure payment processing
- Immediate access to Pro features

### 5. Pro Experience
- Unlimited usage
- All characters available
- Priority support access

## 🚨 Error Handling

### Common Scenarios

1. **Payment Failed**
   - Graceful error messages
   - Retry mechanisms
   - Fallback to free tier

2. **Webhook Failures**
   - Retry logic
   - Manual reconciliation
   - Admin notifications

3. **Usage Limit Edge Cases**
   - Graceful degradation
   - Clear messaging
   - Upgrade prompts

## 📈 Scaling Considerations

### Database Migration
- Move from in-memory to PostgreSQL
- Add proper indexing
- Implement connection pooling

### Caching Strategy
- Redis for session storage
- CDN for static assets
- API response caching

### Monitoring
- Application performance monitoring
- Error tracking (Sentry)
- Business metrics dashboard

## 🎯 Marketing Integration

### Conversion Optimization
- A/B test paywall designs
- Optimize pricing tiers
- Improve onboarding flow

### User Retention
- Usage notifications
- Feature announcements
- Loyalty programs

### Analytics Integration
- Google Analytics
- Mixpanel for user behavior
- Stripe Dashboard for payments

## 🔧 Maintenance

### Regular Tasks
- Monitor webhook health
- Review usage patterns
- Update pricing if needed
- Security audits

### Backup Strategy
- Database backups
- Configuration backups
- Code versioning

## 📞 Support

### User Support
- In-app help system
- Email support
- FAQ section

### Technical Support
- Error monitoring
- Performance alerts
- Automated scaling

---

## 🎉 Ready to Deploy!

Your Georgian Chat application now has a complete paywall system that can:

✅ Track user usage accurately  
✅ Enforce subscription limits  
✅ Process payments securely  
✅ Provide excellent UX  
✅ Scale with your business  

The system is designed to be both user-friendly and business-focused, helping you monetize your AI chat application effectively while providing value to your users.

**Next Steps:**
1. Deploy to Vercel
2. Configure Stripe
3. Test the complete flow
4. Monitor usage and conversions
5. Iterate based on user feedback

Good luck with your Georgian Chat business! 🏰✨
