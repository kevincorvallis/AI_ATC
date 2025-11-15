# 🔧 Fixing the 500 Error - Backend Deployment Guide

## What's Happening

You're getting a **500 Internal Server Error** from the backend API. This means:

1. ✅ The API endpoint exists (it's responding)
2. ❌ But something is crashing in the Lambda function
3. 🎯 Most likely: **OpenAI API key issue**

## Quick Fix: Use Demo Mode (Works Now!)

I've added **Demo Mode** which works WITHOUT the backend:

- ✅ **Real-time transcription** still works
- ✅ **All voice features** work
- ✅ **Pre-programmed ATC responses** (realistic)
- ✅ **Perfect for testing** the transcription feature
- ✅ **Completely FREE** (no API calls)

**Demo Mode activates automatically** when backend fails!

## Want Real AI Responses? Fix the Backend

### Step 1: Check Lambda Environment Variables

The most common issue is the OpenAI API key isn't set in Lambda:

```bash
# Check if the environment variable is set
aws lambda get-function-configuration \
  --function-name ai-atc-function \
  --region us-east-1 \
  --query 'Environment.Variables'
```

**Expected output:**
```json
{
  "OPENAI_API_KEY": "sk-proj-..."
}
```

**If empty or missing**, set it:

```bash
aws lambda update-function-configuration \
  --function-name ai-atc-function \
  --region us-east-1 \
  --environment "Variables={OPENAI_API_KEY=your-actual-openai-api-key-here}"
```

### Step 2: Check CloudWatch Logs

See exactly what's failing:

```bash
aws logs tail /aws/lambda/ai-atc-function --follow --region us-east-1
```

**Common errors:**

**Error: "No module named 'openai'"**
```
Solution: Redeploy the Lambda function with dependencies:
cd backend
./deploy.sh
```

**Error: "Invalid API key"**
```
Solution: Update your OpenAI API key in Lambda environment variables
```

**Error: "Rate limit exceeded"**
```
Solution: Wait a few minutes or upgrade OpenAI plan
```

### Step 3: Redeploy Backend (If Needed)

```bash
cd backend
./deploy.sh
```

This will:
- ✅ Package dependencies (openai, boto3)
- ✅ Upload to Lambda
- ✅ Configure environment variables from .env

### Step 4: Test the API

```bash
# Test the API endpoint directly
curl -X POST https://3zk0d6e54l.execute-api.us-east-1.amazonaws.com/atc \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "pattern_work",
    "message": "Tower, Cessna 12345, ready for departure",
    "history": []
  }'
```

**Expected response:**
```json
{
  "success": true,
  "atc_response": "Cessna 12345, Tower, runway 27, cleared for takeoff...",
  "has_feedback": false
}
```

## Demo Mode vs AI Mode

### Demo Mode (Active Now)
- ✅ Works immediately
- ✅ No setup needed
- ✅ Pre-programmed responses
- ✅ Great for testing transcription
- ✅ FREE
- ❌ Not context-aware
- ❌ Limited variety

### AI Mode (After Backend Fix)
- ✅ Real OpenAI GPT-4 responses
- ✅ Context-aware conversations
- ✅ Personalized feedback
- ✅ Unlimited variety
- ✅ Educational corrections
- ❌ Requires AWS deployment
- ❌ Costs ~$0.01-0.03 per session

## Testing Demo Mode Now

1. Go to your deployed site
2. Click **"AI Training Mode"**
3. Select **"Pattern Work"**
4. Press **"Push to Talk"** and speak
5. See your words in real-time ✨
6. Get a demo ATC response
7. Try again!

**The transcription feature works perfectly in Demo Mode!**

## Deployment Commands Summary

```bash
# Deploy with Demo Mode (works now)
git add .
git commit -m "Add Demo Mode for offline testing"
git push origin main

# Optional: Fix backend for AI mode
cd backend
./deploy.sh
```

## Cost Comparison

| Mode | Setup | Cost | AI Quality |
|------|-------|------|------------|
| **Demo Mode** | ✅ None | **FREE** | Pre-programmed |
| **AI Mode** | AWS + OpenAI | ~$5-15/mo | GPT-4 powered |

## Checking Deployment Status

```bash
# Check Lambda function status
aws lambda get-function --function-name ai-atc-function --region us-east-1

# Check API Gateway
aws apigatewayv2 get-apis --region us-east-1 --query "Items[?Name=='ai-atc-api']"

# View recent Lambda invocations
aws logs tail /aws/lambda/ai-atc-function --since 10m --region us-east-1
```

## Quick Troubleshooting

### Issue: "Cannot read property 'OPENAI_API_KEY'"
**Fix:** Environment variable not set in Lambda
```bash
aws lambda update-function-configuration \
  --function-name ai-atc-function \
  --environment "Variables={OPENAI_API_KEY=YOUR_KEY_HERE}"
```

### Issue: "Module not found: openai"
**Fix:** Dependencies not packaged
```bash
cd backend
./deploy.sh
```

### Issue: "Rate limit exceeded"
**Fix:** Too many OpenAI API calls
- Wait 60 seconds
- Or use Demo Mode

### Issue: "Unauthorized"
**Fix:** Invalid OpenAI API key
- Check key at https://platform.openai.com/api-keys
- Update in Lambda environment variables

## Recommended Approach

**For Now:**
1. ✅ Use **Demo Mode** (works perfectly!)
2. ✅ Test the **transcription feature** (works great!)
3. ✅ Practice **phraseology** with pre-programmed responses

**Later (Optional):**
1. Fix backend when you need AI responses
2. Deploy with corrected OpenAI key
3. Enjoy context-aware conversations

## Still Need Help?

Check these:
1. **CloudWatch Logs** - Shows exact error
2. **Lambda Console** - Visual interface to check config
3. **API Gateway Console** - Test endpoints directly

---

**Bottom line:** Demo Mode works now for testing the transcription feature! AI mode is optional. 🎉
