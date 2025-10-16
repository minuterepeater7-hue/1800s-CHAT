# 🚀 Deploy Georgian Chat to Vercel

## Step 1: Vercel Account Setup

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up with GitHub** (recommended)
3. **Connect your GitHub account**
4. **Import your Georgian Chat repository**

## Step 2: Deploy from Vercel Dashboard

### Option A: Deploy from GitHub (Recommended)

1. **In Vercel Dashboard:**
   - Click "New Project"
   - Select your Georgian Chat repository
   - Vercel will auto-detect it's a Node.js project

2. **Configure Build Settings:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm install`
   - **Output Directory:** `public` (for static files)
   - **Install Command:** `npm install`

3. **Environment Variables:**
   Add these in Vercel dashboard under "Environment Variables":
   ```
   AWS_ACCESS_KEY_ID = your_aws_access_key
   AWS_SECRET_ACCESS_KEY = your_aws_secret_key
   AWS_REGION = us-east-1
   MODAL_BASE_URL = https://minuterepeater7-hue--georgian-chat-llm-generate-response.modal.run
   MODAL_HEALTH_URL = https://minuterepeater7-hue--georgian-chat-llm-health-check.modal.run
   STRIPE_SECRET_KEY = sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY = pk_test_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET = whsec_your_webhook_secret
   JWT_SECRET = your_super_secure_random_string_here
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - You'll get a URL like: `https://your-project.vercel.app`

### Option B: Deploy via CLI (Alternative)

If you prefer CLI deployment:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 3: Set Up Stripe (Required for Paywall)

1. **Go to [stripe.com](https://stripe.com)**
2. **Create account** (use test mode first)
3. **Get API Keys:**
   - Go to Developers → API Keys
   - Copy "Publishable key" (pk_test_...)
   - Copy "Secret key" (sk_test_...)

4. **Create Products:**
   - Go to Products → Create Product
   - **Monthly Plan:**
     - Name: "Georgian Chat Pro Monthly"
     - Price: $9.99
     - Billing: Recurring monthly
   - **Yearly Plan:**
     - Name: "Georgian Chat Pro Yearly" 
     - Price: $99.99
     - Billing: Recurring yearly

5. **Set up Webhooks:**
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-vercel-url.vercel.app/stripe-webhook`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook secret (whsec_...)

## Step 4: Configure Domain

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Domains"
   - Add your custom domain
   - Follow DNS instructions

2. **Update Stripe Webhook:**
   - Update webhook URL to use your custom domain
   - Test webhook delivery

## Step 5: Test Everything

1. **Visit your domain**
2. **Test user registration**
3. **Test free tier usage**
4. **Test paywall (after 50 messages)**
5. **Test Stripe checkout**
6. **Test webhook processing**

## 🎉 You're Live!

Your Georgian Chat application will be running at your custom domain with:
- ✅ User authentication
- ✅ Usage tracking
- ✅ Paywall system
- ✅ Stripe payments
- ✅ AI chat functionality
- ✅ TTS capabilities

## 🔧 Troubleshooting

### Common Issues:

1. **Environment Variables:**
   - Make sure all are set in Vercel dashboard
   - Redeploy after adding new variables

2. **Stripe Webhooks:**
   - Check webhook logs in Stripe dashboard
   - Ensure URL is correct and accessible

3. **Modal LLM:**
   - Verify Modal URLs are correct
   - Check Modal app is deployed and running

4. **AWS Polly:**
   - Ensure AWS credentials are correct
   - Check AWS region matches your setup

### Need Help?

- Check Vercel deployment logs
- Check Stripe webhook logs
- Check browser console for errors
- Test each component individually
