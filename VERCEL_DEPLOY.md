# Vercel Deployment Checklist

Follow these steps to deploy your AI ATC Training System to Vercel.

## Step 1: Commit to GitHub (2 minutes)

Your code is ready to deploy! Run these commands:

```bash
# Add all new files
git add .

# Check what's being committed (optional)
git status

# Commit with a message
git commit -m "Add AI ATC Training System with Live ATC streaming"

# Push to GitHub
git push origin main
```

**What's being committed:**
- ✅ Frontend application (HTML, CSS, JS)
- ✅ Backend Lambda function (Python)
- ✅ Deployment configurations
- ✅ Documentation
- ❌ .env file (kept secret, not committed)

## Step 2: Connect to Vercel (5 minutes)

### First Time Setup

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Find your `AI_ATC` repository
   - Click **"Import"**

3. **Configure Project**
   
   Vercel should auto-detect settings from `vercel.json`, but verify:
   
   - **Project Name:** `ai-atc-training` (or your choice)
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty or `.`)
   
4. **Deploy**
   - Click **"Deploy"**
   - Wait 30-60 seconds
   - Your site is live! 🎉

## Step 3: Test Your Deployment

You'll get a URL like: `https://ai-atc-training.vercel.app`

**Test checklist:**
- [ ] Site loads properly
- [ ] Main menu appears with two options
- [ ] Click "Listen to Live ATC"
- [ ] Search for an airport (try "JFK")
- [ ] Click a frequency and verify audio plays
- [ ] Go back and try another airport

**Live ATC mode should work perfectly right now!**

## Step 4: (Optional) Deploy AI Training Backend

If you want the AI Training Mode to work:

### A. Deploy to AWS Lambda

```bash
cd backend
./deploy.sh
```

Copy the API endpoint URL that's displayed at the end.

### B. Configure in Vercel

**Option 1: Use Environment Variable (Recommended)**

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add new variable:
   - Name: `VITE_API_ENDPOINT`
   - Value: `https://your-api-id.execute-api.us-east-1.amazonaws.com/atc`
3. Redeploy from Deployments tab

**Option 2: Edit Config File**

1. Edit `config.js` in the root directory:
   ```javascript
   const API_ENDPOINT = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/atc';
   ```

2. Commit and push:
   ```bash
   git add config.js
   git commit -m "Configure API endpoint"
   git push origin main
   ```

3. Vercel auto-deploys!

### C. Test AI Training Mode

- Click "AI Training Mode"
- Select a scenario
- Press "Push to Talk" and speak
- Verify ATC responds

## Step 5: (Optional) Custom Domain

Make it your own!

1. Purchase domain (example.com)
2. In Vercel: **Settings** → **Domains**
3. Add your domain
4. Update DNS records as instructed
5. SSL certificate is automatic!

Your app: `atc-trainer.com` ✨

## Automatic Updates

Now when you push to GitHub, Vercel automatically deploys:

```bash
# Make changes
git add .
git commit -m "Add new features"
git push origin main

# Vercel deploys automatically! 🚀
```

## Monitoring Your Deployment

### Vercel Dashboard
- View at: https://vercel.com/dashboard
- See deployments, analytics, logs
- Monitor performance

### Check Deployment Status
```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Check status
vercel ls
```

## Troubleshooting

### Build Failed in Vercel
- Check the build logs in Vercel dashboard
- Ensure `vercel.json` is in the root directory
- Verify all files are committed to GitHub

### Live ATC Not Playing
- Open browser console (F12) to check for errors
- Try a different airport
- Ensure you're on HTTPS (Vercel provides this)

### AI Training Not Working
- Verify you deployed the backend (Step 4)
- Check API endpoint is configured correctly
- View Lambda logs: `aws logs tail /aws/lambda/ai-atc-function --follow`

### Speech Recognition Issues
- Use Chrome or Edge browser
- Allow microphone permissions
- Vercel provides HTTPS (required for microphone)

## Quick Reference

### Your URLs
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Site:** https://[your-project].vercel.app
- **GitHub Repo:** https://github.com/[username]/AI_ATC

### Commands
```bash
# Push updates
git add .
git commit -m "Update message"
git push origin main

# Deploy backend (AWS)
cd backend && ./deploy.sh

# Run locally for testing
cd frontend && python3 -m http.server 8000
```

## Cost Summary

| Service | Cost | Notes |
|---------|------|-------|
| Vercel | **FREE** | Hobby plan is perfect |
| Live ATC | **FREE** | Stream from LiveATC.net |
| AWS Lambda | $0-5/mo | Only for AI Training |
| OpenAI API | $5-15/mo | Only for AI Training |

**Total if using both modes:** ~$5-20/month
**Total if just Live ATC:** **$0/month** 🎉

## Next Steps

1. Share your deployed site with friends!
2. Add your custom domain
3. Customize the airport list in `frontend/airports.js`
4. Add more training scenarios
5. Contribute improvements back to the project

Happy flying! ✈️

---

**Need help?** Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed documentation.
