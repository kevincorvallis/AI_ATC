# Deployment Guide

This guide covers deploying the AI ATC Training System using Vercel for the frontend and AWS for the backend.

## Architecture

- **Frontend (Vercel)**: Static web application with UI, Live ATC player
- **Backend (AWS)**: Lambda function + API Gateway for AI training mode
- **Live ATC**: Direct streaming from LiveATC.net (no backend needed)

## Deployment Steps

### Part 1: Deploy Frontend to Vercel (5 minutes)

#### Prerequisites
- GitHub account
- Vercel account (free tier is fine)
- GitHub repository connected to your project

#### Step 1: Push to GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "Initial commit - AI ATC Training System"

# Push to GitHub (replace with your repo)
git push origin main
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Select your GitHub repository (AI_ATC)
4. Vercel will auto-detect the configuration from `vercel.json`
5. Click **"Deploy"**

**Important Settings:**
- **Framework Preset:** Other (or None)
- **Root Directory:** `./` (leave as root)
- **Build Command:** Leave empty (static site)
- **Output Directory:** Leave empty or `.` (files are in root)

That's it! Vercel will deploy your site and give you a URL like:
`https://ai-atc-training.vercel.app`

#### Step 3: Configure Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

### Part 2: Deploy Backend to AWS (Only for AI Training Mode)

**Note:** Live ATC works immediately without backend deployment!

If you want to use the AI Training Mode with voice interaction:

#### Step 1: Deploy Lambda Function

```bash
cd backend
./deploy.sh
```

This will output an API endpoint URL like:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/atc
```

#### Step 2: Add API Endpoint to Vercel

**Option A: Environment Variable (Recommended)**

1. In Vercel project → **Settings** → **Environment Variables**
2. Add variable:
   - **Name:** `VITE_API_ENDPOINT` or `NEXT_PUBLIC_API_ENDPOINT`
   - **Value:** Your API Gateway URL
3. Redeploy the site

Then update `frontend/config.js` to use the environment variable:
```javascript
const API_ENDPOINT = process.env.VITE_API_ENDPOINT || 'YOUR_API_ENDPOINT_HERE/atc';
```

**Option B: Direct Configuration**

1. Edit `frontend/config.js` directly:
   ```javascript
   const API_ENDPOINT = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/atc';
   ```
2. Commit and push:
   ```bash
   git add frontend/config.js
   git commit -m "Configure API endpoint"
   git push origin main
   ```
3. Vercel will auto-deploy

### Part 3: Verify Deployment

1. Visit your Vercel URL
2. Test **Live ATC Mode** (should work immediately)
3. Test **AI Training Mode** (requires backend deployment)

## Environment Variables

If using environment variables in Vercel:

| Variable | Description | Required For |
|----------|-------------|--------------|
| `VITE_API_ENDPOINT` | API Gateway URL | AI Training Mode only |

## Continuous Deployment

Once connected, Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Add new features"
git push origin main

# Vercel automatically deploys!
```

## Monitoring

### Vercel Dashboard
- View deployments and logs at [vercel.com/dashboard](https://vercel.com/dashboard)
- Check deployment status, analytics, and performance

### AWS CloudWatch (for AI Training)
```bash
# View Lambda logs
aws logs tail /aws/lambda/ai-atc-function --follow

# Check API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=ai-atc-api \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

## Troubleshooting

### Vercel Build Fails
- Check Vercel build logs in the dashboard
- Ensure `vercel.json` is present in root directory
- Verify `frontend/` directory exists with all files

### API Endpoint Not Working
- Verify API endpoint URL in `frontend/config.js`
- Check CORS settings in Lambda function
- View Lambda logs: `aws logs tail /aws/lambda/ai-atc-function --follow`

### Live ATC Not Playing
- Check browser console for errors (F12)
- Ensure you're using HTTPS (Vercel provides this automatically)
- Try a different airport/frequency

### Speech Recognition Not Working
- Must use Chrome or Edge browser
- Vercel provides HTTPS automatically (required for microphone access)
- Check microphone permissions in browser

## Rollback

If a deployment has issues:

1. Go to Vercel Dashboard → **Deployments**
2. Find a previous working deployment
3. Click **"..."** → **"Promote to Production"**

## Cost Breakdown

### Vercel (Frontend)
- **Free Tier:** 100GB bandwidth, unlimited sites
- **Pro Plan:** $20/month (if you exceed free tier)
- **Estimated Cost:** $0/month (free tier is plenty)

### AWS (Backend - AI Training only)
- **Lambda:** Free tier 1M requests/month
- **API Gateway:** Free tier 1M requests/month (12 months)
- **Estimated Cost:** $0-5/month

### OpenAI (AI Training only)
- **GPT-4 API:** ~$0.01-0.03 per conversation
- **Estimated Cost:** $5-15/month

### Live ATC
- **Cost:** FREE (streams from LiveATC.net)

## Security Best Practices

1. **Never commit API keys to GitHub**
   - Already configured in `.gitignore`
   - OpenAI key stays in AWS Lambda environment variables

2. **Use environment variables in Vercel**
   - Store sensitive config in Vercel dashboard
   - Not in code

3. **Keep dependencies updated**
   ```bash
   # Update Python packages
   cd backend
   pip install --upgrade openai boto3
   ```

## Custom Domain Setup

1. Purchase domain (Namecheap, Google Domains, etc.)
2. In Vercel: **Settings** → **Domains** → Add domain
3. Update DNS records as shown by Vercel
4. SSL certificate is automatic!

Example: `atc-trainer.com` → Your Vercel app

## Support

- **Vercel Issues:** Check [Vercel Documentation](https://vercel.com/docs)
- **AWS Issues:** Check CloudWatch logs
- **App Issues:** Check browser console (F12)

Happy deploying! ✈️
