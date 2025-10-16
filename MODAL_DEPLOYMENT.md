# Modal.com Deployment Guide

## Prerequisites
1. Modal.com account (sign up at modal.com)
2. Python 3.8+ installed locally
3. Your Georgian Chat app already deployed on Vercel

## Step 1: Install Modal CLI
```bash
pip install modal
```

## Step 2: Authenticate with Modal
```bash
modal token new
```
Follow the instructions to authenticate with your Modal account.

## Step 3: Deploy Modal App
```bash
# Deploy the app
modal deploy modal_app.py

# This will output URLs like:
# https://your-username--georgian-chat-llm-generate-response.modal.run
# https://your-username--georgian-chat-llm-health-check.modal.run
```

## Step 4: Update Vercel Environment Variables
1. Go to your Vercel dashboard
2. Select your Georgian Chat project
3. Go to Settings > Environment Variables
4. Add these variables:

**Required Variables:**
- `MODAL_BASE_URL` = `https://your-username--georgian-chat-llm-generate-response.modal.run`
- `MODAL_HEALTH_URL` = `https://your-username--georgian-chat-llm-health-check.modal.run`

**Keep existing:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

## Step 5: Redeploy Vercel
```bash
# Push changes to GitHub
git add .
git commit -m "Add Modal.com integration"
git push

# Vercel will automatically redeploy
```

## Step 6: Test the Integration
1. Visit your Vercel app URL
2. Try sending a message
3. Check the browser console for any errors
4. Test different characters

## Cost Monitoring
- Modal charges per second of GPU usage
- Expected cost: ~$0.36/hour when active
- For your usage (5 users × 10 min/day): ~$110/year

## Troubleshooting

### Common Issues:
1. **"Modal API error: 404"**
   - Check that the Modal URLs are correct
   - Ensure the Modal app is deployed

2. **"Modal API error: 500"**
   - Check Modal logs: `modal logs georgian-chat-llm`
   - Model might be loading (first request takes longer)

3. **Slow responses**
   - First request after idle time takes 2-3 seconds (cold start)
   - Subsequent requests are faster

### Debug Commands:
```bash
# Check Modal app status
modal app list

# View logs
modal logs georgian-chat-llm

# Test locally
modal run modal_app.py
```

## Performance Optimization
- Modal keeps 1 instance warm (`keep_warm=1`)
- Model is cached in memory after first load
- Consider increasing `keep_warm` if you have more traffic

## Scaling
- Modal auto-scales based on demand
- No need to manage servers
- Pay only for actual usage time
