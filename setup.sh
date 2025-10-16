#!/bin/bash

# Georgian Chat Setup Script
echo "🎭 Setting up Georgian Chat..."

# Check Node.js version
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 22+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 22+"
    exit 1
fi
echo "✅ Node.js $(node -v) is installed"

# Check Ollama
echo "Checking Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install from https://ollama.ai/download"
    exit 1
fi
echo "✅ Ollama is installed"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⚠️  Ollama is not running. Starting Ollama..."
    ollama serve &
    sleep 3
fi

# Check if model is installed
echo "Checking for llama3.2:3b-instruct model..."
if ! ollama list | grep -q "llama3.2:3b-instruct"; then
    echo "📥 Pulling llama3.2:3b-instruct model (this may take a few minutes)..."
    ollama pull llama3.2:3b-instruct
fi
echo "✅ Model is ready"

# Check AWS CLI
echo "Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install from https://aws.amazon.com/cli/"
    exit 1
fi
echo "✅ AWS CLI is installed"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "⚠️  AWS credentials not configured. Please run: aws configure"
    echo "   Make sure to set a region with Polly access (e.g., us-east-1)"
    exit 1
fi
echo "✅ AWS credentials are configured"

# Install dependencies
echo "Installing dependencies..."
npm install

echo ""
echo "🎉 Setup complete! You can now run:"
echo "   npm start"
echo ""
echo "Then open http://localhost:8787 in your browser"
