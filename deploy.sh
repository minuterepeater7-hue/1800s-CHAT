#!/bin/bash

# Georgian Chat Deployment Script

echo "🚀 Georgian Chat Deployment Script"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Georgian Chat app"
fi

# Check if we're connected to a remote
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No GitHub remote found. Please:"
    echo "1. Create a new repository on GitHub"
    echo "2. Run: git remote add origin https://github.com/yourusername/georgian-chat.git"
    echo "3. Run: git push -u origin main"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Git repository ready"

# Check for required environment variables
echo "🔍 Checking environment variables..."

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "⚠️  AWS_ACCESS_KEY_ID not set"
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  AWS_SECRET_ACCESS_KEY not set"
fi

if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$COHERE_API_KEY" ]; then
    echo "⚠️  No LLM API key found. Please set one of:"
    echo "   - OPENAI_API_KEY"
    echo "   - ANTHROPIC_API_KEY" 
    echo "   - COHERE_API_KEY"
fi

echo ""
echo "🌐 Deployment Options:"
echo "1. Vercel (Recommended)"
echo "2. Railway"
echo "3. Render"
echo "4. DigitalOcean App Platform"
echo ""

read -p "Choose deployment option (1-4): " choice

case $choice in
    1)
        echo "🚀 Deploying to Vercel..."
        echo "1. Go to https://vercel.com"
        echo "2. Sign in with GitHub"
        echo "3. Click 'New Project'"
        echo "4. Import your repository"
        echo "5. Add environment variables:"
        echo "   - AWS_ACCESS_KEY_ID"
        echo "   - AWS_SECRET_ACCESS_KEY"
        echo "   - AWS_REGION"
        echo "   - OPENAI_API_KEY (or other LLM key)"
        echo "6. Click 'Deploy'"
        echo ""
        echo "📝 Note: For production, rename server-cloud.js to server.js"
        ;;
    2)
        echo "🚀 Deploying to Railway..."
        echo "1. Install Railway CLI: npm install -g @railway/cli"
        echo "2. Run: railway login"
        echo "3. Run: railway init"
        echo "4. Run: railway up"
        echo "5. Set environment variables in Railway dashboard"
        ;;
    3)
        echo "🚀 Deploying to Render..."
        echo "1. Go to https://render.com"
        echo "2. Sign up with GitHub"
        echo "3. Create new 'Web Service'"
        echo "4. Connect your repository"
        echo "5. Set environment variables in dashboard"
        ;;
    4)
        echo "🚀 Deploying to DigitalOcean..."
        echo "1. Go to DigitalOcean App Platform"
        echo "2. Create new app from GitHub"
        echo "3. Select your repository"
        echo "4. Configure environment variables"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment instructions provided!"
echo "📚 See DEPLOYMENT.md for detailed steps"
