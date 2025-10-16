# Georgian Chat - Deployment Guide

## Option 1: Vercel (Recommended - Easiest)

### Prerequisites
1. GitHub account
2. Vercel account (free at vercel.com)
3. AWS account for Polly TTS

### Step 1: Prepare Your Code
1. Make sure all files are in your project directory
2. The `vercel.json` file is already created
3. Test locally first: `npm start`

### Step 2: Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/georgian-chat.git
git push -u origin main
```

### Step 3: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect it's a Node.js project
6. Add environment variables:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_REGION`: us-east-1 (or your preferred region)
7. Click "Deploy"

### Step 4: Configure Ollama (Important!)
Since Ollama runs locally, you have two options:

**Option A: Use a Cloud LLM Service**
Replace Ollama with a cloud service like:
- OpenAI API
- Anthropic Claude API
- Google Gemini API

**Option B: Use Vercel's Serverless Functions with Ollama**
This is more complex but possible with custom Docker containers.

## Option 2: Railway (Good for Full-Stack Apps)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Deploy
```bash
railway login
railway init
railway up
```

### Step 3: Set Environment Variables
```bash
railway variables set AWS_ACCESS_KEY_ID=your_key
railway variables set AWS_SECRET_ACCESS_KEY=your_secret
railway variables set AWS_REGION=us-east-1
```

## Option 3: Render (Free Tier Available)

### Step 1: Connect GitHub
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Create new "Web Service"
4. Connect your repository

### Step 2: Configure
- Build Command: `npm install`
- Start Command: `node server.js`
- Add environment variables in dashboard

## Option 4: DigitalOcean App Platform

### Step 1: Create App
1. Go to DigitalOcean App Platform
2. Create new app from GitHub
3. Select your repository

### Step 2: Configure
- Runtime: Node.js
- Build Command: `npm install`
- Run Command: `node server.js`
- Add environment variables

## Important Notes

### Ollama Limitation
The current setup uses Ollama which runs locally. For a live website, you'll need to:

1. **Replace with Cloud LLM** (Recommended):
   - OpenAI API
   - Anthropic Claude
   - Google Gemini
   - Cohere API

2. **Or use Ollama in the cloud**:
   - Run Ollama on a VPS
   - Use services like RunPod or Modal

### Environment Variables Needed
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `AWS_REGION`
- `OLLAMA_BASE_URL` (if using cloud Ollama)

### File Structure for Deployment
```
georgian-chat/
├── server.js
├── package.json
├── vercel.json
├── public/
│   └── index.html
├── dickens-knowledge-base.js
├── text-analyzer.js
└── README.md
```

## Quick Start with Vercel

1. Push code to GitHub
2. Connect to Vercel
3. Add AWS environment variables
4. Replace Ollama with cloud LLM service
5. Deploy!

The app will be live at `https://your-app-name.vercel.app`
