# 🚀 Quick Deploy Guide - Georgian Chat

## Prerequisites
- GitHub account
- AWS account (for Polly TTS)
- One of: OpenAI, Anthropic, or Cohere API key

## Step 1: Prepare Your Code
```bash
# Make sure all files are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Choose Your Deployment Platform

### Option A: Vercel (Easiest - 5 minutes)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. **Important**: Change the build command to `npm run cloud`
6. Add these environment variables:
   - `AWS_ACCESS_KEY_ID` - Your AWS access key
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
   - `AWS_REGION` - us-east-1
   - `OPENAI_API_KEY` - Your OpenAI API key (or other LLM)
   - `LLM_PROVIDER` - openai (or anthropic/cohere)
7. Click "Deploy"

### Option B: Railway (Good for full-stack)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up

# Set environment variables
railway variables set AWS_ACCESS_KEY_ID=your_key
railway variables set AWS_SECRET_ACCESS_KEY=your_secret
railway variables set OPENAI_API_KEY=your_openai_key
railway variables set LLM_PROVIDER=openai
```

### Option C: Render (Free tier)
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Create "Web Service"
4. Connect your repository
5. Set:
   - Build Command: `npm install`
   - Start Command: `npm run cloud`
6. Add environment variables in dashboard

## Step 3: Get Your API Keys

### AWS (for TTS)
1. Go to AWS Console
2. Create IAM user with Polly permissions
3. Generate access keys
4. Use these as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### OpenAI (for LLM)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Use as `OPENAI_API_KEY`

### Alternative LLM Providers
- **Anthropic**: Get key from [console.anthropic.com](https://console.anthropic.com)
- **Cohere**: Get key from [dashboard.cohere.ai](https://dashboard.cohere.ai)

## Step 4: Test Your Deployment
1. Visit your deployed URL
2. Try sending a message
3. Check if TTS works (you'll need AWS credentials)

## Troubleshooting

### Common Issues
- **"No API key configured"**: Set your LLM provider API key
- **"Missing credentials"**: Set your AWS credentials
- **"Failed to process chat"**: Check your API keys are valid

### Environment Variables Checklist
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION` (us-east-1)
- [ ] `OPENAI_API_KEY` (or other LLM key)
- [ ] `LLM_PROVIDER` (openai/anthropic/cohere)

## File Structure
```
georgian-chat/
├── server.js              # Local version (uses Ollama)
├── server-cloud.js        # Cloud version (uses API)
├── public/index.html      # Frontend
├── vercel.json           # Vercel config
├── package.json          # Dependencies
└── deploy.sh             # Deployment script
```

## Cost Estimates
- **Vercel**: Free tier (100GB bandwidth)
- **OpenAI**: ~$0.002 per 1K tokens
- **AWS Polly**: $4.00 per 1M characters
- **Total**: ~$5-10/month for moderate usage

## Next Steps
1. Deploy to your chosen platform
2. Test all functionality
3. Customize characters in `server-cloud.js`
4. Add your own domain (optional)
5. Monitor usage and costs

Your Georgian Chat app will be live at your platform's URL! 🎉
